// Polyfill for iOS autofill callback handler (prevents Hermes crash)
// Must be at the very top before any imports
if (typeof global !== 'undefined') {
  (global as any)._AutofillCallbackHandler = (global as any)._AutofillCallbackHandler || {};
}

import { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

// Prevent splash screen from auto-hiding until auth is determined
SplashScreen.preventAutoHideAsync();

import { initSentry } from '@/utils/sentry';

// Initialize Sentry as early as possible
initSentry();

import { ConvexProviderWrapper } from '@/providers/ConvexProvider';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';
import { ListsProvider } from '@/context/ListsContext';
import { PlayerLinksProvider } from '@/context/PlayerLinksContext';
import { RecentPlayersProvider } from '@/context/RecentPlayersContext';
import { PlayerDataProvider } from '@/context/PlayerDataContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SportProvider } from '@/context/SportContext';
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
  const hasNavigated = useRef(false);
  const splashHidden = useRef(false);

  useEffect(() => {
    console.log('[NAV] AuthNavigator effect - status:', status, 'segments:', segments);

    // Keep splash visible while loading
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const onOnboardingScreen = segments[0] === '(auth)' && segments[1] === 'onboarding';

    // Determine if we're on the correct screen for current status
    let onCorrectScreen = false;

    if (status === 'onboarding') {
      if (onOnboardingScreen) {
        onCorrectScreen = true;
      } else if (!hasNavigated.current) {
        console.log('[NAV] Redirecting to onboarding');
        router.replace('/(auth)/onboarding');
        hasNavigated.current = true;
        return; // Don't hide splash yet, wait for navigation
      }
    } else if (status === 'authenticated') {
      if (inTabsGroup) {
        onCorrectScreen = true;
      } else if (inAuthGroup && !hasNavigated.current) {
        console.log('[NAV] Authenticated user in auth group, redirecting to tabs');
        router.replace('/(tabs)');
        hasNavigated.current = true;
        return; // Don't hide splash yet, wait for navigation
      } else if (!inAuthGroup) {
        onCorrectScreen = true; // Already somewhere valid
      }
    } else if (status === 'guest' || status === 'unauthenticated') {
      // Unauthenticated users should be in auth group or tabs (as guest)
      if (inAuthGroup || inTabsGroup) {
        onCorrectScreen = true;
      }
    }

    // Only hide splash when we've reached the correct destination
    if (onCorrectScreen && !splashHidden.current) {
      console.log('[NAV] On correct screen, hiding splash');
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
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
      <PlayerDataProvider>
        <ListsProvider>
          <PlayerLinksProvider>
            <RecentPlayersProvider>
              <Stack
                screenOptions={{
                  headerBackTitle: 'Back',
                  headerBackTitleVisible: true,
                }}
              >
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
      </PlayerDataProvider>
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
                <SportProvider>
                  <RootLayoutNav />
                </SportProvider>
              </ThemeProvider>
            </AuthProvider>
          </RevenueCatProvider>
        </ConvexProviderWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
