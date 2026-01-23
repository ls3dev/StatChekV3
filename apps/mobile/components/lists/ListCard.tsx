import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { usePlayerData } from '@/context/PlayerDataContext';
import { getPlayerById } from '@/services/playerData';
import { getListSport, getSportTheme } from '@/utils/sportUtils';
import type { PlayerList } from '@/types';

type ListCardProps = {
  list: PlayerList;
  onPress: () => void;
};

export function ListCard({ list, onPress }: ListCardProps) {
  const { isDark } = useTheme();
  const { isLoaded: isPlayerDataLoaded } = usePlayerData();

  // Determine sport from players in the list
  const sport = useMemo(() => {
    if (!list.players || list.players.length === 0) return null;
    if (!isPlayerDataLoaded) return null; // Wait for player data

    // Get player data to access sport field
    const playersWithData = list.players
      .map((item) => getPlayerById(item.playerId))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    return getListSport(playersWithData);
  }, [list.players, isPlayerDataLoaded]);

  const theme = getSportTheme(sport);
  const playerCount = list.players?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
          borderLeftColor: theme.primary,
          opacity: pressed ? 0.8 : 1,
        },
        isDark ? styles.cardShadowDark : styles.cardShadow,
      ]}>
      {/* Sport Badge - Top Right */}
      <View
        style={[
          styles.sportBadge,
          { backgroundColor: isDark ? theme.backgroundDark : theme.background },
        ]}>
        <Text style={styles.sportIcon}>{theme.icon}</Text>
        <Text style={[styles.sportLabel, { color: theme.primary }]}>{theme.label}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}
          numberOfLines={2}>
          {list.name}
        </Text>

        {list.description && (
          <Text
            style={[
              styles.description,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}
            numberOfLines={2}>
            {list.description}
          </Text>
        )}

        {/* Meta Row */}
        <View style={styles.metaRow}>
          <View style={styles.playerCount}>
            <Ionicons name="people-outline" size={14} color={theme.primary} />
            <Text style={[styles.playerCountText, { color: theme.primary }]}>
              {playerCount} {playerCount === 1 ? 'player' : 'players'}
            </Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: DesignTokens.spacing.lg,
    paddingRight: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.xl,
    borderLeftWidth: 4,
    marginBottom: DesignTokens.spacing.md,
    position: 'relative',
    minHeight: 100,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sportBadge: {
    position: 'absolute',
    top: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    gap: 4,
  },
  sportIcon: {
    fontSize: 14,
  },
  sportLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingRight: 80, // Space for badge
  },
  name: {
    ...Typography.headline,
    fontSize: 18,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    ...Typography.body,
    lineHeight: 20,
    marginBottom: DesignTokens.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerCountText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: '500',
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: DesignTokens.spacing.xs,
  },
});
