import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient, DesignTokens, Typography } from '@/constants/theme';

type GradientHeaderProps = {
  title?: string;
  children?: React.ReactNode;
  /** Extra padding at bottom for overlapping content */
  overlapPadding?: number;
};

export function GradientHeader({ title = 'StatChek', children, overlapPadding = 60 }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[BrandGradient.start, BrandGradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        {
          paddingTop: insets.top + DesignTokens.spacing.md,
          paddingBottom: overlapPadding + DesignTokens.spacing.lg,
        },
      ]}>
      {/* Subtle pattern overlay for depth */}
      <View style={styles.patternOverlay} />

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    // Subtle noise texture effect via very faint gradient
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  title: {
    ...Typography.displayMedium,
    color: DesignTokens.textOnGradient,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.sm,
    ...Platform.select({
      ios: {
        fontWeight: '700',
      },
      android: {
        fontWeight: 'bold',
      },
    }),
  },
});
