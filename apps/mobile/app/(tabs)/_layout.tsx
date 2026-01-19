import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { DesignTokens } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: isDark ? DesignTokens.tabBarActive : DesignTokens.accentPurple,
        tabBarInactiveTintColor: isDark ? DesignTokens.tabBarInactive : DesignTokens.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? DesignTokens.tabBarBackgroundDark : DesignTokens.tabBarBackground,
          borderTopColor: isDark ? DesignTokens.tabBarBorderDark : DesignTokens.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: Platform.select({ ios: 8, android: 4 }),
          paddingBottom: Platform.select({ ios: 24, android: 8 }),
          height: Platform.select({ ios: 84, android: 64 }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Hide unused tabs from navigation */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="paywall"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
