import React, { createContext, useContext, ReactNode } from 'react';

// TODO: Set to true once RevenueCat products are configured in App Store Connect
const REVENUECAT_ENABLED = false;

// Stub types when RevenueCat is disabled
type CustomerInfo = any;
type PurchasesPackage = any;

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
  // Completely disabled - just provide stub values
  const value: RevenueCatContextType = {
    customerInfo: null,
    isProUser: false,
    packages: [],
    isLoading: false,
    purchasePackage: async () => false,
    restorePurchases: async () => false,
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
