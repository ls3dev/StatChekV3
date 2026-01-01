import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

type SearchDropdownItemProps = {
  player: Player;
  onPress: () => void;
  index: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SearchDropdownItem({ player, onPress, index }: SearchDropdownItemProps) {
  const { isDark } = useTheme();

  const getPositionColor = (position: string) => {
    // Sport-specific position colors for visual interest
    const positionColors: Record<string, string> = {
      QB: '#EF4444', // Red
      RB: '#F59E0B', // Amber
      WR: '#10B981', // Emerald
      TE: '#06B6D4', // Cyan
      PG: '#8B5CF6', // Violet
      SG: '#EC4899', // Pink
      SF: '#F97316', // Orange
      PF: '#14B8A6', // Teal
      C: '#6366F1', // Indigo
      P: '#22C55E', // Green
      SP: '#3B82F6', // Blue
      RP: '#A855F7', // Purple
    };
    return positionColors[position] || DesignTokens.accentPurple;
  };

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 50).duration(200)}
      exiting={FadeOut.duration(150)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
      {/* Player avatar placeholder with position indicator */}
      <View style={[styles.avatar, { backgroundColor: getPositionColor(player.position) + '20' }]}>
        <Text style={[styles.avatarText, { color: getPositionColor(player.position) }]}>
          {player.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.name, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}
          numberOfLines={1}>
          {player.name}
        </Text>
        <Text
          style={[styles.details, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}
          numberOfLines={1}>
          {player.team} • {player.position}
        </Text>
      </View>

      {/* Chevron indicator */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: DesignTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.label,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.headline,
  },
  details: {
    ...Typography.bodySmall,
  },
});
