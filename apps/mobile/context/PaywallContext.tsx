import React, { createContext, useCallback, useContext, useState } from 'react';

type PaywallContextValue = {
  isPaywallVisible: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
};

const PaywallContext = createContext<PaywallContextValue | undefined>(undefined);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const openPaywall = useCallback(() => {
    console.log('[PaywallContext] openPaywall called');
    setIsPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  return (
    <PaywallContext.Provider value={{ isPaywallVisible, openPaywall, closePaywall }}>
      {children}
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const ctx = useContext(PaywallContext);
  if (!ctx) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return ctx;
}
