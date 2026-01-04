/**
 * StatChek Design System
 * Apple Sports-inspired dark aesthetic - bold, clean, athletic
 */

import { Platform } from 'react-native';

// Brand gradient colors - Apple Sports dark gray style
export const BrandGradient = {
  start: '#374151', // Gray-700
  end: '#1F2937', // Gray-800
} as const;

// Design tokens for the new aesthetic
export const DesignTokens = {
  // Gradient
  gradientStart: BrandGradient.start,
  gradientEnd: BrandGradient.end,

  // Card surfaces - darker for sports aesthetic
  cardBackground: '#FFFFFF',
  cardBackgroundDark: '#1F2937', // Gray-800
  cardSurfaceDark: '#111827', // Gray-900 for nested cards
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  cardShadowDark: 'rgba(0, 0, 0, 0.4)',

  // Text colors
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnGradient: '#FFFFFF',
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#9CA3AF',
  textMutedDark: '#6B7280',

  // Accent colors - sports-focused
  accentPrimary: '#FFFFFF', // White as primary accent on dark
  accentPurple: '#A78BFA', // Lighter purple for dark backgrounds
  accentIndigo: '#818CF8', // Lighter indigo
  accentSuccess: '#34D399', // Brighter green
  accentWarning: '#FBBF24', // Brighter amber
  accentError: '#F87171', // Brighter red

  // Borders & dividers
  border: '#E5E7EB',
  borderDark: '#374151', // Gray-700
  divider: '#F3F4F6',
  dividerDark: '#374151',

  // Backgrounds - pure black base like Apple Sports
  backgroundPrimary: '#F9FAFB',
  backgroundSecondary: '#FFFFFF',
  backgroundPrimaryDark: '#000000',
  backgroundSecondaryDark: '#111827', // Gray-900

  // Tab bar - dark and minimal
  tabBarBackground: '#FFFFFF',
  tabBarBackgroundDark: '#000000',
  tabBarBorder: '#E5E7EB',
  tabBarBorderDark: '#1F2937',
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#6B7280',

  // Spacing scale (base 4)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius scale
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: DesignTokens.textPrimary,
    background: DesignTokens.backgroundPrimary,
    tint: DesignTokens.accentPurple,
    icon: DesignTokens.textSecondary,
    tabIconDefault: DesignTokens.tabBarInactive,
    tabIconSelected: DesignTokens.tabBarActive,
  },
  dark: {
    text: DesignTokens.textPrimaryDark,
    background: DesignTokens.backgroundPrimaryDark,
    tint: DesignTokens.accentPurple,
    icon: DesignTokens.textSecondaryDark,
    tabIconDefault: DesignTokens.tabBarInactive,
    tabIconSelected: DesignTokens.tabBarActive,
  },
} as const;

// Typography - using SF Pro on iOS for that premium feel
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
    // Display weights for headers
    display: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      semibold: { fontFamily: 'System', fontWeight: '600' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
    },
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
    display: {
      regular: { fontWeight: '400' as const },
      medium: { fontWeight: '500' as const },
      semibold: { fontWeight: '600' as const },
      bold: { fontWeight: '700' as const },
    },
  },
});

// Typography scale
export const Typography = {
  // Display - for hero text
  displayLarge: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
    ...Fonts?.display?.bold,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
    ...Fonts?.display?.bold,
  },
  displaySmall: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.35,
    ...Fonts?.display?.bold,
  },

  // Headlines
  headline: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    ...Fonts?.display?.semibold,
  },

  // Body text
  bodyLarge: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    ...Fonts?.display?.regular,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    ...Fonts?.display?.regular,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    ...Fonts?.display?.regular,
  },

  // Labels & captions
  label: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    ...Fonts?.display?.medium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    ...Fonts?.display?.regular,
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.07,
    ...Fonts?.display?.regular,
  },
} as const;
