import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';

import { useAuth } from '@/context/AuthContext';
import { api } from '@statcheck/convex';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { userId } = useAuth();

  // Query user settings from Convex (includes theme)
  const userSettings = useQuery(
    api.userSettings.getUserSettings,
    userId ? { userId } : 'skip'
  );

  // Mutations
  const updateSettingsMutation = useMutation(api.userSettings.setTheme);
  const updateAccentColorMutation = useMutation(api.userSettings.setAccentColor);

  // Local state (synced with Convex)
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColorState] = useState('#30D158');

  // Sync local state with Convex data
  useEffect(() => {
    if (userSettings?.theme) {
      setThemeState(userSettings.theme);
    }
    if (userSettings?.accentColor) {
      setAccentColorState(userSettings.accentColor);
    }
  }, [userSettings]);

  // Consider loaded if:
  // 1. No userId (use default theme), or
  // 2. Query has returned (even if null/undefined result)
  const isLoaded = !userId || userSettings !== undefined;

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

  const setAccentColor = useCallback(
    async (color: string) => {
      if (!userId) return;

      setAccentColorState(color);

      try {
        await updateAccentColorMutation({ userId, accentColor: color });
      } catch (error) {
        console.error('Failed to save accent color:', error);
        if (userSettings?.accentColor) {
          setAccentColorState(userSettings.accentColor);
        }
      }
    },
    [userId, userSettings, updateAccentColorMutation]
  );

  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
    accentColor,
    setAccentColor,
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
