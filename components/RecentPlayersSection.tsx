import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

import { RecentPlayerItem } from './RecentPlayerItem';

type RecentPlayersSectionProps = {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  onClear?: () => void;
};

export function RecentPlayersSection({ players, onPlayerSelect, onClear }: RecentPlayersSectionProps) {
  const { isDark } = useTheme();

  if (players.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
          RECENTLY VIEWED
        </Text>
        {onClear && players.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearButton, { color: isDark ? DesignTokens.accentPrimary : DesignTokens.accentPurple }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Players card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
          },
          isDark ? styles.cardShadowDark : styles.cardShadow,
        ]}>
        {players.slice(0, 5).map((player, index) => (
          <RecentPlayerItem
            key={player.id}
            player={player}
            onPress={() => onPlayerSelect(player)}
            isLast={index === Math.min(players.length, 5) - 1}
          />
        ))}
      </View>

      {/* Sync status / last updated indicator */}
      <View style={styles.syncStatus}>
        <Ionicons
          name="time-outline"
          size={14}
          color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
        />
        <Text style={[styles.syncText, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
          {players.length} player{players.length !== 1 ? 's' : ''} saved
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
  },
  headerLabel: {
    ...Typography.captionSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clearButton: {
    ...Typography.caption,
    fontWeight: '600',
  },
  card: {
    borderRadius: DesignTokens.radius.xl,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: DesignTokens.spacing.md,
  },
  syncText: {
    ...Typography.caption,
  },
});
