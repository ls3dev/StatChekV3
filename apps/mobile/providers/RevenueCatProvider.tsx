import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = 'appl_OzNmVPueEoumCUWTiucebUhQZxE';

// TODO: Set to true once RevenueCat products are configured in App Store Connect
const REVENUECAT_ENABLED = false;

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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Skip RevenueCat initialization if disabled
    if (!REVENUECAT_ENABLED) {
      console.log('RevenueCat disabled - skipping initialization');
      setIsLoading(false);
      return;
    }

    const initRevenueCat = async () => {
      try {
        // Configure RevenueCat
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        setIsConfigured(true);

        // Get customer info
        try {
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
        } catch (e) {
          console.log('Could not get customer info:', e);
        }

        // Get available packages
        try {
          const offerings = await Purchases.getOfferings();
          if (offerings.current?.availablePackages) {
            setPackages(offerings.current.availablePackages);
          }
        } catch (e) {
          // No offerings configured yet
          console.log('No offerings available:', e);
        }
      } catch (error) {
        console.error('RevenueCat init error:', error);
        // Don't crash - just continue without RevenueCat
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();

    // Listen for customer info updates (only if configured)
    const customerInfoListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(customerInfoListener);
    } catch (e) {
      console.log('Could not add listener:', e);
    }

    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Check if user has active "pro" entitlement
  const isProUser = customerInfo?.entitlements.active['pro'] !== undefined;

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);
      return newInfo.entitlements.active['pro'] !== undefined;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active['pro'] !== undefined;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  };

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
