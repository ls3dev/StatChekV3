// Polyfill for iOS autofill callback handler (prevents Hermes crash)
// Must be at the very top before any imports
if (typeof global !== 'undefined') {
  (global as any)._AutofillCallbackHandler = (global as any)._AutofillCallbackHandler || {};
}

import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { initSentry } from '@/utils/sentry';

// Initialize Sentry as early as possible
initSentry();

import { ConvexProviderWrapper } from '@/providers/ConvexProvider';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';
import { ListsProvider } from '@/context/ListsContext';
import { PlayerLinksProvider } from '@/context/PlayerLinksContext';
import { RecentPlayersProvider } from '@/context/RecentPlayersContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { PaywallModal } from '@/components/PaywallModal';

export const unstable_settings = {
  // Start with auth flow, will redirect to tabs after onboarding/auth
  anchor: '(auth)',
};

// Handle auth-based routing
function AuthNavigator() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('[NAV] AuthNavigator effect - status:', status, 'segments:', segments);
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'onboarding') {
      console.log('[NAV] Redirecting to onboarding');
      router.replace('/(auth)/onboarding');
    } else if (status === 'authenticated') {
      // Only redirect authenticated users away from auth screens
      // Guests navigate via onboarding screen directly (avoids race condition)
      if (inAuthGroup) {
        console.log('[NAV] Authenticated user in auth group, redirecting to tabs');
        router.replace('/(tabs)');
      }
    }
    // Unauthenticated and guest users handle their own navigation
  }, [status, segments, router]);

  return null;
}

// Inner layout that has access to theme context
function RootLayoutNav() {
  const { isDark } = useTheme();

  // Customize navigation themes to match our design
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#1C1C1E',
      border: '#2D2D30',
      primary: '#7C3AED',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F9FAFB',
      card: '#FFFFFF',
      border: '#E5E7EB',
      primary: '#7C3AED',
    },
  };

  return (
    <NavigationThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
      <AuthNavigator />
      <ListsProvider>
        <PlayerLinksProvider>
          <RecentPlayersProvider>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <AuthPromptModal />
            <PaywallModal />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </RecentPlayersProvider>
        </PlayerLinksProvider>
      </ListsProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProviderWrapper>
          <RevenueCatProvider>
            <AuthProvider>
              <ThemeProvider>
                <RootLayoutNav />
              </ThemeProvider>
            </AuthProvider>
          </RevenueCatProvider>
        </ConvexProviderWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
