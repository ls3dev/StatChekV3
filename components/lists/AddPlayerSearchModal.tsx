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

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import playersData from '@/data/players.json';
import type { Player } from '@/types';

const allPlayers = playersData as Player[];

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

  const results = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return allPlayers
      .filter((player) => {
        // Exclude players already in list
        if (existingPlayerIds.includes(player.id)) return false;
        const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 20); // Limit results
  }, [query, existingPlayerIds]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (playerId: string) => {
    onAddPlayer(playerId);
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
              autoFocus
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
                  key={player.id}
                  player={player}
                  isDark={isDark}
                  onSelect={() => handleSelect(player.id)}
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

  return (
    <TouchableOpacity
      style={[
        styles.resultItem,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}>
      {/* Avatar */}
      {player.photoUrl && !imageError ? (
        <Image
          source={{ uri: player.photoUrl }}
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: DesignTokens.accentPurple + '15' }]}>
          <Text style={[styles.avatarText, { color: DesignTokens.accentPurple }]}>{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.resultInfo}>
        <Text
          style={[
            styles.resultName,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}
          numberOfLines={1}>
          {player.name}
        </Text>
        <Text
          style={[
            styles.resultMeta,
            { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
          ]}>
          {player.team} · {player.position}
        </Text>
      </View>

      {/* Add icon */}
      <Ionicons name="add-circle" size={24} color={DesignTokens.accentPurple} />
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
  resultName: {
    ...Typography.headline,
    marginBottom: 2,
  },
  resultMeta: {
    ...Typography.caption,
  },
});
