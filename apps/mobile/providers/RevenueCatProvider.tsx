import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = 'test_ubBPFsmeTcQRWcObNmBNCvBvTTF';

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

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Configure RevenueCat
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Get available packages
        try {
          const offerings = await Purchases.getOfferings();
          if (offerings.current?.availablePackages) {
            setPackages(offerings.current.availablePackages);
          }
        } catch (e) {
          // No offerings configured yet
          console.log('No offerings available');
        }
      } catch (error) {
        console.error('RevenueCat init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();

    // Listen for customer info updates
    const customerInfoListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
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
