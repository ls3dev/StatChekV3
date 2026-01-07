import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';

import { useUserId } from '@/providers/ConvexProvider';
import { api } from '@statchek/convex';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const userId = useUserId();

  // Query user settings from Convex (includes theme)
  const userSettings = useQuery(
    api.userSettings.getUserSettings,
    userId ? { userId } : 'skip'
  );

  // Mutation to update theme
  const updateSettingsMutation = useMutation(api.userSettings.setTheme);

  // Local state for theme (synced with Convex)
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  // Sync local theme with Convex data
  useEffect(() => {
    if (userSettings?.theme) {
      setThemeState(userSettings.theme);
    }
  }, [userSettings]);

  const isLoaded = userSettings !== undefined;

  // Set theme and persist to Convex
  const setTheme = useCallback(
    async (newTheme: ThemeMode) => {
      if (!userId) {
        console.warn('Cannot set theme: user not initialized');
        return;
      }

      // Optimistic update
      setThemeState(newTheme);

      // Persist to Convex
      try {
        await updateSettingsMutation({
          userId,
          theme: newTheme,
        });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Revert on error
        if (userSettings?.theme) {
          setThemeState(userSettings.theme);
        }
      }
    },
    [userId, userSettings, updateSettingsMutation]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
