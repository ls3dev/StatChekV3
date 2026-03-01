import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

import { RecentPlayerCard } from './RecentPlayerCard';
import { SyncIndicator } from './SyncIndicator';

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
            <Text style={[styles.clearButton, { color: isDark ? DesignTokens.accentPrimary : DesignTokens.accentGreen }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal ScrollView with player cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={140 + DesignTokens.spacing.md} // Card width + gap
        snapToAlignment="start">
        {players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.cardWrapper,
              index === 0 && styles.firstCard,
              index === players.length - 1 && styles.lastCard,
            ]}>
            <RecentPlayerCard
              player={player}
              onPress={() => onPlayerSelect(player)}
              isFirst={index === 0}
              isLast={index === players.length - 1}
            />
          </View>
        ))}
      </ScrollView>

      {/* Sync status / player count indicator */}
      <View style={styles.syncStatus}>
        <SyncIndicator size={14} />
        <Text style={[styles.syncText, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
          {players.length} player{players.length !== 1 ? 's' : ''} • Swipe to see more
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
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
  scrollContainer: {
    flexGrow: 0, // Don't expand vertically
  },
  scrollContent: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  cardWrapper: {
    marginRight: DesignTokens.spacing.md,
  },
  firstCard: {
    // No additional left margin needed
  },
  lastCard: {
    marginRight: DesignTokens.spacing.md, // Keep right margin for last card
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
