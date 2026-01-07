import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

type RecentPlayerCardProps = {
  player: Player;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export function RecentPlayerCard({ player, onPress, isFirst, isLast }: RecentPlayerCardProps) {
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
        styles.card,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
        },
        isDark ? styles.cardShadowDark : styles.cardShadow,
        pressed && {
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        },
        accentColor && {
          borderTopWidth: 3,
          borderTopColor: accentColor,
        },
      ]}>
      {/* Player photo */}
      <View style={styles.photoContainer}>
        {player.photoUrl && !imageError ? (
          <Image
            source={{ uri: player.photoUrl }}
            style={[styles.photo, accentColor && { borderWidth: 2, borderColor: accentColor }]}
            contentFit="cover"
            onError={() => setImageError(true)}
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              { backgroundColor: (accentColor || positionColor) + '20' },
            ]}>
            <Text style={[styles.placeholderText, { color: accentColor || positionColor }]}>
              {initials}
            </Text>
          </View>
        )}

        {/* Position badge overlay */}
        {displayPosition && (
          <View
            style={[
              styles.positionBadge,
              { backgroundColor: (accentColor || positionColor) + 'DD' },
            ]}>
            <Text style={styles.positionText}>{displayPosition}</Text>
          </View>
        )}
      </View>

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

      {/* Hall of Fame indicator */}
      {isHallOfFame && (
        <View style={styles.hofIndicator}>
          <Text style={styles.hofText}>HOF</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1, // Square
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: DesignTokens.backgroundSecondary,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  positionBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
  },
  positionText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  info: {
    padding: DesignTokens.spacing.sm,
    gap: 2,
  },
  name: {
    ...Typography.bodySmall,
    fontWeight: '600',
    fontSize: 13,
  },
  team: {
    ...Typography.caption,
    fontSize: 11,
  },
  hofIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: PlayerStatusColors.hallOfFame.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: DesignTokens.radius.sm,
  },
  hofText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
});
