import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { DesignTokens, PlayerStatusColors, SportColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAllPlayers } from '@/services/playerData';
import type { Player } from '@/types';

type AddPlayerSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddPlayer: (playerId: string) => void;
  existingPlayerIds: string[];
};

export function AddPlayerSearchModal({
  visible,
  onClose,
  onAddPlayer,
  existingPlayerIds,
}: AddPlayerSearchModalProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');

  // Helper to get composite ID for a player
  const getCompositeId = (player: Player) => `${player.sport}_${player.id}`;

  const results = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return getAllPlayers()
      .filter((player) => {
        // Exclude players already in list (check both composite and legacy IDs)
        const compositeId = getCompositeId(player);
        if (existingPlayerIds.includes(compositeId) || existingPlayerIds.includes(player.id)) {
          return false;
        }
        const haystack = `${player.name} ${player.team} ${player.position} ${player.sport}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 20); // Limit results
  }, [query, existingPlayerIds]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (player: Player) => {
    // Use composite ID for new players: sport_id
    const compositeId = getCompositeId(player);
    onAddPlayer(compositeId);
    setQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: isDark
                ? DesignTokens.backgroundSecondaryDark
                : DesignTokens.backgroundSecondary,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}>
              Add Player
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              },
            ]}>
            <Ionicons
              name="search"
              size={20}
              color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}
              placeholder="Search players..."
              placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <ScrollView
            style={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {query.trim().length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}>
                  Start typing to search for players
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}>
                  No players found
                </Text>
              </View>
            ) : (
              results.map((player) => (
                <PlayerSearchResult
                  key={`${player.sport}_${player.id}`}
                  player={player}
                  isDark={isDark}
                  onSelect={() => handleSelect(player)}
                />
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Player search result item
function PlayerSearchResult({
  player,
  isDark,
  onSelect,
}: {
  player: Player;
  isDark: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Determine player status styling
  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : null;

  // Get background color
  const getBackgroundColor = () => {
    if (isHallOfFame) return isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.1)';
    return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  };

  // Hide "N/A" team and position
  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  // Get sport color
  const sportColor = player.sport === 'NBA' ? SportColors.NBA.primary
    : player.sport === 'NFL' ? SportColors.NFL.primary
    : player.sport === 'MLB' ? SportColors.MLB.primary
    : SportColors.default.primary;

  return (
    <TouchableOpacity
      style={[
        styles.resultItem,
        { backgroundColor: getBackgroundColor() },
        accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}>
      {/* Avatar */}
      {player.photoUrl && !imageError ? (
        <Image
          source={{ uri: player.photoUrl }}
          style={[styles.avatar, accentColor && { borderWidth: 2, borderColor: accentColor }]}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: (accentColor || DesignTokens.accentPurple) + '15' },
          ]}>
          <Text style={[styles.avatarText, { color: accentColor || DesignTokens.accentPurple }]}>
            {initials}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.resultName,
              { color: accentColor || (isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary) },
            ]}
            numberOfLines={1}>
            {player.name}
          </Text>
          <View style={[styles.sportBadge, { backgroundColor: sportColor + '20' }]}>
            <Text style={[styles.sportBadgeText, { color: sportColor }]}>{player.sport}</Text>
          </View>
        </View>
        {(displayTeam || displayPosition) && (
          <Text
            style={[
              styles.resultMeta,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </Text>
        )}
      </View>

      {/* Add icon */}
      <Ionicons name="add-circle" size={24} color={accentColor || DesignTokens.accentPurple} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  title: {
    ...Typography.displaySmall,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: DesignTokens.spacing.xs,
  },
  resultsContainer: {
    maxHeight: 300,
  },
  emptyState: {
    paddingVertical: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    marginBottom: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  resultName: {
    ...Typography.headline,
    flexShrink: 1,
  },
  sportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultMeta: {
    ...Typography.caption,
  },
});
