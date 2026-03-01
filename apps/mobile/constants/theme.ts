/**
 * StatCheck Design System
 * Apple Sports-inspired dark aesthetic - bold, clean, athletic
 */

import { Platform } from 'react-native';

// Brand gradient colors - Apple Sports dark gray style
export const BrandGradient = {
  start: '#3A3A3C', // iOS tertiary
  end: '#1C1C1E', // iOS primary dark
} as const;

// Design tokens for the new aesthetic
export const DesignTokens = {
  // Gradient
  gradientStart: BrandGradient.start,
  gradientEnd: BrandGradient.end,

  // Card surfaces - iOS system colors
  cardBackground: '#FFFFFF',
  cardBackgroundDark: '#2C2C2E', // iOS secondary dark
  cardSurfaceDark: '#1C1C1E', // iOS primary dark for nested cards
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  cardShadowDark: 'rgba(0, 0, 0, 0.4)',

  // Text colors - iOS system colors
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnGradient: '#FFFFFF',
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#8E8E93', // iOS secondary label
  textMutedDark: '#636366', // iOS tertiary label

  // Accent colors - iOS system colors
  accentPrimary: '#FFFFFF', // White as primary accent on dark
  accentGreen: '#30D158', // iOS system green
  accentIndigo: '#5E5CE6', // iOS system indigo
  accentSuccess: '#30D158', // iOS system green
  accentWarning: '#FF9F0A', // iOS system orange
  accentError: '#FF3B30', // iOS system red

  // Borders & dividers - iOS system colors
  border: '#E5E7EB',
  borderDark: '#38383A', // iOS separator dark
  divider: '#F3F4F6',
  dividerDark: '#38383A', // iOS separator dark

  // Backgrounds - iOS system colors
  backgroundPrimary: '#F9FAFB',
  backgroundSecondary: '#FFFFFF',
  backgroundPrimaryDark: '#000000', // Pure black like Apple Sports
  backgroundSecondaryDark: '#1C1C1E', // iOS secondary dark

  // Tab bar - iOS system colors
  tabBarBackground: '#FFFFFF',
  tabBarBackgroundDark: '#000000',
  tabBarBorder: '#E5E7EB',
  tabBarBorderDark: '#38383A', // iOS separator dark
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#8E8E93', // iOS secondary label

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

// Sport-specific colors matching web design
export const SportColors = {
  NBA: {
    primary: '#F97316', // Orange-500
    background: 'rgba(249, 115, 22, 0.1)',
    backgroundDark: 'rgba(249, 115, 22, 0.15)',
  },
  NFL: {
    primary: '#22C55E', // Green-500
    background: 'rgba(34, 197, 94, 0.1)',
    backgroundDark: 'rgba(34, 197, 94, 0.15)',
  },
  MLB: {
    primary: '#3B82F6', // Blue-500
    background: 'rgba(59, 130, 246, 0.1)',
    backgroundDark: 'rgba(59, 130, 246, 0.15)',
  },
  default: {
    primary: '#30D158', // iOS system green
    background: 'rgba(48, 209, 88, 0.1)',
    backgroundDark: 'rgba(48, 209, 88, 0.15)',
  },
} as const;

// Sport theme configuration (matching web)
export const SPORT_THEMES = {
  NBA: {
    icon: '🏀',
    label: 'NBA',
    ...SportColors.NBA,
  },
  NFL: {
    icon: '🏈',
    label: 'NFL',
    ...SportColors.NFL,
  },
  MLB: {
    icon: '⚾',
    label: 'MLB',
    ...SportColors.MLB,
  },
  default: {
    icon: '📋',
    label: 'List',
    ...SportColors.default,
  },
} as const;

export type SportType = 'NBA' | 'NFL' | 'MLB';

// Player status colors for Hall of Fame and retired players
export const PlayerStatusColors = {
  hallOfFame: {
    primary: '#FFD700',      // Gold
    secondary: '#FFA500',    // Orange gold
    glow: 'rgba(255, 215, 0, 0.6)',
  },
  retired: {
    primary: '#CD7F32',      // Bronze
    secondary: '#B8860B',    // Dark goldenrod
    glow: 'rgba(205, 127, 50, 0.5)',
  },
} as const;

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: DesignTokens.textPrimary,
    background: DesignTokens.backgroundPrimary,
    tint: DesignTokens.accentGreen,
    icon: DesignTokens.textSecondary,
    tabIconDefault: DesignTokens.tabBarInactive,
    tabIconSelected: DesignTokens.tabBarActive,
  },
  dark: {
    text: DesignTokens.textPrimaryDark,
    background: DesignTokens.backgroundPrimaryDark,
    tint: DesignTokens.accentGreen,
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
