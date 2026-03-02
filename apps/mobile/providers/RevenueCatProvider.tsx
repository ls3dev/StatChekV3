import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '@clerk/clerk-expo';

const REVENUECAT_ENABLED = true;

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isProUser: boolean;
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

  // Derive pro status from customer info
  const isProUser = customerInfo?.entitlements?.active?.['pro'] !== undefined;

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
        console.log('[RevenueCat] Customer info:', {
          activeEntitlements: Object.keys(info.entitlements.active),
          allEntitlements: Object.keys(info.entitlements.all),
          originalAppUserId: info.originalAppUserId,
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
  }, [isConfigured]);

  // Identify user with Clerk ID when auth changes
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isConfigured || !isSignedIn || !userId) return;

    const identify = async () => {
      try {
        console.log('[RevenueCat] Identifying user:', userId);
        const { customerInfo: info } = await Purchases.logIn(userId);
        console.log('[RevenueCat] User identified:', {
          appUserId: info.originalAppUserId,
          activeEntitlements: Object.keys(info.entitlements.active),
          isProUser: info.entitlements.active['pro'] !== undefined,
        });
        setCustomerInfo(info);
      } catch (error) {
        console.error('[RevenueCat] Login error:', error);
      }
    };

    identify();
  }, [isConfigured, isSignedIn, userId]);

  // Listen for customer info updates
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isConfigured) return;

    const listener = (info: CustomerInfo) => {
      console.log('[RevenueCat] Customer info updated:', {
        activeEntitlements: Object.keys(info.entitlements.active),
        isProUser: info.entitlements.active['pro'] !== undefined,
      });
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      console.log('[RevenueCat] Purchasing package:', {
        id: pkg.identifier,
        price: pkg.product.priceString,
        productId: pkg.product.identifier,
      });
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      const hasPro = info.entitlements.active['pro'] !== undefined;
      console.log('[RevenueCat] Purchase complete:', {
        hasPro,
        activeEntitlements: Object.keys(info.entitlements.active),
        latestExpirationDate: info.latestExpirationDate,
      });
      setCustomerInfo(info);
      return hasPro;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[RevenueCat] Purchase cancelled by user');
      } else {
        console.error('[RevenueCat] Purchase error:', error.code, error.message);
      }
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[RevenueCat] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      const hasPro = info.entitlements.active['pro'] !== undefined;
      console.log('[RevenueCat] Restore complete:', {
        hasPro,
        activeEntitlements: Object.keys(info.entitlements.active),
      });
      setCustomerInfo(info);
      return hasPro;
    } catch (error) {
      console.error('[RevenueCat] Restore error:', error);
      return false;
    }
  }, []);

  // Fallback stub when disabled or no API key
  if (!REVENUECAT_ENABLED || !API_KEY) {
    const stubValue: RevenueCatContextType = {
      customerInfo: null,
      isProUser: false,
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
