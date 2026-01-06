import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

type RecentPlayerItemProps = {
  player: Player;
  onPress: () => void;
  isLast?: boolean;
};

export function RecentPlayerItem({ player, onPress, isLast = false }: RecentPlayerItemProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  const getPositionColor = (position: string) => {
    const positionColors: Record<string, string> = {
      QB: '#EF4444',
      RB: '#F59E0B',
      WR: '#10B981',
      TE: '#06B6D4',
      PG: '#8B5CF6',
      SG: '#EC4899',
      SF: '#F97316',
      PF: '#14B8A6',
      C: '#6366F1',
      P: '#22C55E',
      SP: '#3B82F6',
      RP: '#A855F7',
    };
    return positionColors[position] || DesignTokens.accentPurple;
  };

  const positionColor = getPositionColor(player.position);
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Determine player status styling
  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : null;

  // Hide "N/A" team and position
  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? DesignTokens.dividerDark : DesignTokens.divider,
        },
        accentColor && {
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          backgroundColor: isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.1)',
        },
        !accentColor && {
          backgroundColor: pressed
            ? isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.02)'
            : 'transparent',
        },
      ]}>
      {/* Player avatar */}
      {player.photoUrl && !imageError ? (
        <Image
          source={{ uri: player.photoUrl }}
          style={[styles.avatar, accentColor && { borderWidth: 2, borderColor: accentColor }]}
          contentFit="cover"
          onError={() => setImageError(true)}
          transition={150}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: (accentColor || positionColor) + '15' },
          ]}>
          <Text style={[styles.avatarText, { color: accentColor || positionColor }]}>{initials}</Text>
        </View>
      )}

      {/* Player info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            { color: accentColor || (isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary) },
          ]}
          numberOfLines={1}>
          {player.name}
        </Text>
        {displayTeam && (
          <Text
            style={[styles.team, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}
            numberOfLines={1}>
            {displayTeam}
          </Text>
        )}
      </View>

      {/* Position badge */}
      {displayPosition && (
        <View
          style={[
            styles.positionBadge,
            { backgroundColor: (accentColor || positionColor) + '15' },
          ]}>
          <Text style={[styles.positionText, { color: accentColor || positionColor }]}>
            {displayPosition}
          </Text>
        </View>
      )}

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={accentColor || (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.headline,
  },
  team: {
    ...Typography.bodySmall,
  },
  positionBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  positionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
