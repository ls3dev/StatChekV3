import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

type SearchDropdownItemProps = {
  player: Player;
  onPress: () => void;
  index: number;
};

// Sport colors for left border accent
// TODO: Adding NFL and MLB player lists - colors:
//   NFL: Blue (#3B82F6)
//   NBA: Orange (#F97316)
//   MLB: Green (#22C55E) - change from red when MLB players added
const getSportColor = (sport: string) => {
  const sportColors: Record<string, string> = {
    NFL: '#3B82F6', // Blue
    NBA: '#F97316', // Orange
    MLB: '#22C55E', // Green (updated for future MLB players)
    NHL: '#06B6D4', // Cyan
    MLS: '#10B981', // Emerald
  };
  return sportColors[sport?.toUpperCase()] || '#6B7280';
};

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

export function SearchDropdownItem({ player, onPress }: SearchDropdownItemProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  const sportColor = getSportColor(player.sport);
  const positionColor = getPositionColor(player.position);
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Determine player status styling
  const isHallOfFame = player.hallOfFame === true;

  // Get border and background colors based on status
  const getBorderColor = () => {
    if (isHallOfFame) return PlayerStatusColors.hallOfFame.primary;
    return sportColor;
  };

  const getBackgroundColor = () => {
    if (isHallOfFame) return isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.1)';
    return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  };

  // Hide "N/A" team and position
  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          borderLeftColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        },
      ]}>
      {/* Player avatar */}
      {player.photoUrl && !imageError ? (
        <Image
          source={{ uri: player.photoUrl }}
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImageError(true)}
          transition={150}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: positionColor + '15' }]}>
          <Text style={[styles.avatarText, { color: positionColor }]}>{initials}</Text>
        </View>
      )}

      {/* Player info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
            isHallOfFame && { color: PlayerStatusColors.hallOfFame.primary },
          ]}
          numberOfLines={1}>
          {player.name}
        </Text>
        {(displayTeam || displayPosition) && (
          <Text
            style={[styles.team, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}
            numberOfLines={1}>
            {displayTeam && displayPosition
              ? displayTeam
              : displayTeam || displayPosition}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isHallOfFame ? PlayerStatusColors.hallOfFame.primary : isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.headline,
    marginBottom: 2,
  },
  team: {
    ...Typography.bodySmall,
  },
});
