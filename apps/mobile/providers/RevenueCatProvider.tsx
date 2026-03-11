import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useMutation } from 'convex/react';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@statcheck/convex';

const REVENUECAT_ENABLED = true;

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const DEFAULT_PRO_ENTITLEMENT_IDS = ['pro', 'statcheck pro'];

const parseConfiguredProEntitlementIds = (rawValue: string | undefined): string[] => {
  if (!rawValue) return DEFAULT_PRO_ENTITLEMENT_IDS;

  const parsed = rawValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_PRO_ENTITLEMENT_IDS;
};

const hasConfiguredProEntitlement = (
  activeEntitlements: Record<string, unknown> | undefined,
  configuredProEntitlementIds: string[]
): boolean => {
  if (!activeEntitlements) return false;

  const activeEntitlementIds = Object.keys(activeEntitlements).map((id) => id.toLowerCase());
  return configuredProEntitlementIds.some((id) => activeEntitlementIds.includes(id));
};

const getConfiguredProExpiration = (
  activeEntitlements: Record<string, any> | undefined,
  configuredProEntitlementIds: string[]
): number | undefined => {
  if (!activeEntitlements) return undefined;

  const matchedEntitlement = Object.entries(activeEntitlements).find(([id]) =>
    configuredProEntitlementIds.includes(id.toLowerCase())
  );
  const expirationDate = matchedEntitlement?.[1]?.expirationDate;
  return expirationDate ? new Date(expirationDate).getTime() : undefined;
};

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isProUser: boolean;
  proSyncVersion: number;
  packages: PurchasesPackage[];
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { isSignedIn, userId } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [proSyncVersion, setProSyncVersion] = useState(0);
  const lastSyncedProStatus = useRef<boolean | null>(null);
  const configuredProEntitlementIds = useMemo(
    () => parseConfiguredProEntitlementIds(process.env.EXPO_PUBLIC_PRO_ENTITLEMENT_IDS),
    []
  );
  const syncProStatus = useMutation(api.proWebhook.syncProStatus);

  // Derive pro status from customer info
  const isProUser = hasConfiguredProEntitlement(
    customerInfo?.entitlements?.active,
    configuredProEntitlementIds
  );

  useEffect(() => {
    if (!isConfigured || !isSignedIn) return;
    if (lastSyncedProStatus.current === isProUser) return;

    lastSyncedProStatus.current = isProUser;
    const expiresAt = getConfiguredProExpiration(
      customerInfo?.entitlements?.active as Record<string, any> | undefined,
      configuredProEntitlementIds
    );

    console.log('[RevenueCat] Syncing pro status to Convex:', { isProUser, expiresAt });
    syncProStatus({ isProUser, expiresAt })
      .then(() => {
        console.log('[RevenueCat] Pro status synced to Convex successfully');
        setProSyncVersion((version) => version + 1);
      })
      .catch((error) => {
        console.error('[RevenueCat] Failed to sync pro status:', error);
        lastSyncedProStatus.current = null;
      });
  }, [
    customerInfo,
    configuredProEntitlementIds,
    isConfigured,
    isProUser,
    isSignedIn,
    syncProStatus,
  ]);

  // Configure RevenueCat SDK on mount
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !API_KEY || isConfigured) return;

    const configure = async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        console.log('[RevenueCat] Configuring with API key:', API_KEY.slice(0, 10) + '...');
        Purchases.configure({ apiKey: API_KEY });
        setIsConfigured(true);
        console.log('[RevenueCat] SDK configured successfully');

        // Fetch initial customer info
        const info = await Purchases.getCustomerInfo();
        const activeEntitlements = Object.keys(info.entitlements.active);
        const hasPro = hasConfiguredProEntitlement(info.entitlements.active, configuredProEntitlementIds);
        console.log('[RevenueCat] Customer info:', {
          activeEntitlements,
          allEntitlements: Object.keys(info.entitlements.all),
          originalAppUserId: info.originalAppUserId,
          configuredProEntitlementIds,
          isProUser: hasPro,
        });
        setCustomerInfo(info);

        // Fetch offerings
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings:', {
          currentId: offerings.current?.identifier,
          packageCount: offerings.current?.availablePackages?.length ?? 0,
          packages: offerings.current?.availablePackages?.map(p => ({
            id: p.identifier,
            price: p.product.priceString,
            title: p.product.title,
          })),
        });
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (error: any) {
        console.error('[RevenueCat] Configure error:', error);
        console.error('[RevenueCat] Error details:', JSON.stringify(error, null, 2));
        console.error('[RevenueCat] Error message:', error?.message);
        console.error('[RevenueCat] Error code:', error?.code);
        console.error('[RevenueCat] API key used:', API_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    configure();
  }, [isConfigured, configuredProEntitlementIds]);

  // Identify user with Clerk ID when auth changes
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isConfigured || !isSignedIn || !userId) return;

    const identify = async () => {
      try {
        console.log('[RevenueCat] Identifying user:', userId);
        const { customerInfo: info } = await Purchases.logIn(userId);
        const activeEntitlements = Object.keys(info.entitlements.active);
        const hasPro = hasConfiguredProEntitlement(info.entitlements.active, configuredProEntitlementIds);
        console.log('[RevenueCat] User identified:', {
          appUserId: info.originalAppUserId,
          activeEntitlements,
          configuredProEntitlementIds,
          isProUser: hasPro,
        });
        setCustomerInfo(info);
      } catch (error) {
        console.error('[RevenueCat] Login error:', error);
      }
    };

    identify();
  }, [isConfigured, isSignedIn, userId, configuredProEntitlementIds]);

  // Listen for customer info updates
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isConfigured) return;

    const listener = (info: CustomerInfo) => {
      const activeEntitlements = Object.keys(info.entitlements.active);
      const hasPro = hasConfiguredProEntitlement(info.entitlements.active, configuredProEntitlementIds);
      console.log('[RevenueCat] Customer info updated:', {
        activeEntitlements,
        configuredProEntitlementIds,
        isProUser: hasPro,
      });
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured, configuredProEntitlementIds]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      console.log('[RevenueCat] Purchasing package:', {
        id: pkg.identifier,
        price: pkg.product.priceString,
        productId: pkg.product.identifier,
      });
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      const activeEntitlements = Object.keys(info.entitlements.active);
      const hasPro = hasConfiguredProEntitlement(info.entitlements.active, configuredProEntitlementIds);
      console.log('[RevenueCat] Purchase complete:', {
        hasPro,
        activeEntitlements,
        configuredProEntitlementIds,
        latestExpirationDate: info.latestExpirationDate,
      });
      setCustomerInfo(info);
      return hasPro;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[RevenueCat] Purchase cancelled by user');
      } else {
        console.error('[RevenueCat] Purchase error:', error.code, error.message);
        // Refresh — handles "already purchased" where Apple rejects but user IS subscribed
        try {
          const freshInfo = await Purchases.getCustomerInfo();
          setCustomerInfo(freshInfo);
          const hasPro = hasConfiguredProEntitlement(freshInfo.entitlements.active, configuredProEntitlementIds);
          return hasPro;
        } catch (refreshError) {
          console.error('[RevenueCat] Failed to refresh:', refreshError);
        }
      }
      return false;
    }
  }, [configuredProEntitlementIds]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[RevenueCat] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      const activeEntitlements = Object.keys(info.entitlements.active);
      const hasPro = hasConfiguredProEntitlement(info.entitlements.active, configuredProEntitlementIds);
      console.log('[RevenueCat] Restore complete:', {
        hasPro,
        activeEntitlements,
        configuredProEntitlementIds,
      });
      setCustomerInfo(info);
      return hasPro;
    } catch (error) {
      console.error('[RevenueCat] Restore error:', error);
      return false;
    }
  }, [configuredProEntitlementIds]);

  // Fallback stub when disabled or no API key
  if (!REVENUECAT_ENABLED || !API_KEY) {
    const stubValue: RevenueCatContextType = {
      customerInfo: null,
      isProUser: false,
      proSyncVersion: 0,
      packages: [],
      isLoading: false,
      purchasePackage: async () => false,
      restorePurchases: async () => false,
    };

    return (
      <RevenueCatContext.Provider value={stubValue}>
        {children}
      </RevenueCatContext.Provider>
    );
  }

  const value: RevenueCatContextType = {
    customerInfo,
    isProUser,
    proSyncVersion,
    packages,
    isLoading,
    purchasePackage,
    restorePurchases,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
