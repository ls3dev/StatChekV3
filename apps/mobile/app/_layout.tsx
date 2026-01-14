import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

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
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'onboarding') {
      // First time user - show onboarding
      router.replace('/(auth)/onboarding');
    } else if (status === 'authenticated' || status === 'guest') {
      // Authenticated user or guest - go to main app
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else if (status === 'unauthenticated') {
      // Not authenticated - show sign in (they can choose to continue as guest)
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
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
      <ListsProvider>
        <PlayerLinksProvider>
          <RecentPlayersProvider>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
