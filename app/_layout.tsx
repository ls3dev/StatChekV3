import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ListsProvider } from '@/context/ListsContext';
import { PlayerLinksProvider } from '@/context/PlayerLinksContext';
import { RecentPlayersProvider } from '@/context/RecentPlayersContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
      <ListsProvider>
        <PlayerLinksProvider>
          <RecentPlayersProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
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
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
