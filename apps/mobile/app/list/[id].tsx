import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddPlayerSearchModal } from '@/components/lists';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import playersData from '@/data/nba_playersv2.json';
import { useLists } from '@/hooks/useLists';
import type { Player, PlayerListItem } from '@/types';

const allPlayers = playersData as Player[];

// Type for player with full data
type PlayerWithData = PlayerListItem & { player: Player };

// Get player by ID from static data
const getPlayerById = (id: string): Player | undefined => {
  return allPlayers.find((p) => p.id === id);
};

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    getListById,
    deleteList,
    addPlayerToList,
    removePlayerFromList,
    reorderPlayersInList,
  } = useLists();

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const list = getListById(id);

  // Map player IDs to full player data
  const playersWithData = useMemo((): PlayerWithData[] => {
    if (!list) return [];
    return list.players
      .map((item) => ({
        ...item,
        player: getPlayerById(item.playerId),
      }))
      .filter((item): item is PlayerWithData => item.player !== undefined)
      .sort((a, b) => a.order - b.order);
  }, [list]);

  // Handle drag end for reordering players
  const handleDragEnd = useCallback(
    async ({ data }: { data: PlayerWithData[] }) => {
      if (!list) return;
      // Update order values based on new positions
      const reorderedItems: PlayerListItem[] = data.map((item, index) => ({
        playerId: item.playerId,
        order: index,
        addedAt: item.addedAt,
      }));
      await reorderPlayersInList(list.id, reorderedItems);
    },
    [list, reorderPlayersInList]
  );

  if (!list) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
            paddingTop: insets.top,
          },
        ]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text
            style={[
              styles.notFoundText,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            List not found
          </Text>
        </View>
      </View>
    );
  }

  const handleDeleteList = () => {
    const doDelete = async () => {
      await deleteList(list.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this list?')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete List', 'Are you sure you want to delete this list?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    await removePlayerFromList(list.id, playerId);
  };

  const handleAddPlayer = async (playerId: string) => {
    await addPlayerToList(list.id, playerId);
  };

  const handleShareList = async () => {
    if (!list) return;
    setIsSharing(true);
    setShowOptions(false);

    try {
      // TODO: Replace with actual Convex mutation once deployed
      // For now, we'll create a shareable text format
      const playerNames = playersWithData.map((p, i) => `${i + 1}. ${p.player.name}`).join('\n');
      const shareText = `${list.name}\n\n${playerNames}\n\nShared from StatChek`;

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareText);
        Alert.alert('Copied!', 'List copied to clipboard');
      } else {
        await Share.share({
          message: shareText,
          title: list.name,
        });
      }

      // Future implementation with Convex:
      // const { shareId } = await createSharedList({ ... });
      // const shareUrl = `https://statchek.com/list/${shareId}`;
      // await Share.share({ url: shareUrl, title: list.name });

    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share list');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
          paddingTop: insets.top,
        },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}
          numberOfLines={1}>
          {list.name}
        </Text>
        <TouchableOpacity onPress={() => setShowOptions(!showOptions)} style={styles.optionsButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Options dropdown with backdrop */}
      {showOptions && (
        <>
          <TouchableOpacity
            style={styles.optionsBackdrop}
            activeOpacity={1}
            onPress={() => setShowOptions(false)}
          />
          <View
            style={[
              styles.optionsMenu,
              {
                backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
              },
            ]}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleShareList}
              disabled={isSharing}>
              {isSharing ? (
                <ActivityIndicator size="small" color={DesignTokens.accentPurple} />
              ) : (
                <Ionicons name="share-outline" size={20} color={DesignTokens.accentPurple} />
              )}
              <Text
                style={[
                  styles.optionText,
                  { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                ]}>
                Share List
              </Text>
            </TouchableOpacity>
            <View
              style={[
                styles.optionDivider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
              ]}
            />
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                handleDeleteList();
              }}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete List</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <DraggableFlatList
        data={playersWithData}
        keyExtractor={(item) => item.playerId}
        onDragEnd={handleDragEnd}
        containerStyle={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Description */}
            {list.description && (
              <Text
                style={[
                  styles.description,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                ]}>
                {list.description}
              </Text>
            )}

            {/* Players section header */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted },
                  ]}>
                  PLAYERS ({playersWithData.length})
                </Text>
                <TouchableOpacity onPress={() => setShowAddPlayerModal(true)}>
                  <Text style={[styles.addText, { color: DesignTokens.accentPurple }]}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {playersWithData.length === 0 && (
                <View
                  style={[
                    styles.emptyCard,
                    {
                      backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                    },
                  ]}>
                  <Ionicons
                    name="people-outline"
                    size={32}
                    color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                    ]}>
                    No players yet
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddPlayerModal(true)}>
                    <Text style={[styles.addLinkButton, { color: DesignTokens.accentPurple }]}>
                      + Add a player
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        }
        renderItem={({ item, drag, isActive, getIndex }) => {
          const index = getIndex() ?? 0;
          return (
            <ScaleDecorator>
              <PlayerRow
                player={item.player}
                rank={index + 1}
                isDark={isDark}
                onPress={() => setSelectedPlayer(item.player)}
                onRemove={() => handleRemovePlayer(item.playerId)}
                onLongPress={drag}
                isActive={isActive}
                isFirst={index === 0}
                isLast={index === playersWithData.length - 1}
              />
            </ScaleDecorator>
          );
        }}
        ListFooterComponent={<View style={{ height: DesignTokens.spacing.xl }} />}
      />

      <AddPlayerSearchModal
        visible={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onAddPlayer={handleAddPlayer}
        existingPlayerIds={list.players.map((p) => p.playerId)}
      />

      <PlayerCardBottomSheet
        player={selectedPlayer}
        isVisible={!!selectedPlayer}
        onDismiss={() => setSelectedPlayer(null)}
      />
    </View>
  );
}

// Player row component with swipe-to-delete and drag-to-reorder
function PlayerRow({
  player,
  rank,
  isDark,
  onPress,
  onRemove,
  onLongPress,
  isActive,
  isFirst,
  isLast,
}: {
  player: Player;
  rank: number;
  isDark: boolean;
  onPress: () => void;
  onRemove: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
  isFirst?: boolean;
  isLast: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onRemove();
        }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={22} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.playerRowContainer,
        { marginHorizontal: DesignTokens.spacing.lg },
        isFirst && styles.playerRowFirst,
        isLast && styles.playerRowLast,
        accentColor && {
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        },
      ]}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
        enabled={!isActive}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={200}
          style={[
            styles.playerRow,
            {
              backgroundColor: accentColor
                ? isDark
                  ? 'rgba(255, 215, 0, 0.08)'
                  : 'rgba(255, 215, 0, 0.1)'
                : isDark
                  ? DesignTokens.cardBackgroundDark
                  : DesignTokens.cardBackground,
            },
            isActive && styles.playerRowActive,
            !isLast && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}>
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <Ionicons
              name="menu"
              size={18}
              color={accentColor || (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted)}
            />
          </View>

          {/* Rank */}
          <Text
            style={[
              styles.rank,
              { color: accentColor || (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted) },
            ]}>
            {rank}
          </Text>

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
          <View style={styles.playerInfo}>
            <Text
              style={[
                styles.playerName,
                { color: accentColor || (isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary) },
              ]}
              numberOfLines={1}>
              {player.name}
            </Text>
            {(displayTeam || displayPosition) && (
              <Text
                style={[
                  styles.playerMeta,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                ]}>
                {displayTeam && displayPosition
                  ? `${displayTeam} · ${displayPosition}`
                  : displayTeam || displayPosition}
              </Text>
            )}
          </View>

          {/* Chevron indicator */}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={accentColor || (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted)}
          />
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  backButton: {
    padding: DesignTokens.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    ...Typography.headline,
    fontSize: 18,
  },
  optionsButton: {
    padding: DesignTokens.spacing.xs,
  },
  optionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  optionsMenu: {
    position: 'absolute',
    top: 100,
    right: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.xs,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  optionText: {
    ...Typography.body,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: DesignTokens.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  description: {
    ...Typography.body,
    marginBottom: DesignTokens.spacing.lg,
  },
  section: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
  },
  sectionLabel: {
    ...Typography.captionSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  card: {
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  emptyCard: {
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  emptyText: {
    ...Typography.body,
  },
  emptySubtext: {
    ...Typography.caption,
    textAlign: 'center',
  },
  addLinkButton: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: DesignTokens.spacing.sm,
  },
  playerRowContainer: {
    overflow: 'hidden',
  },
  playerRowFirst: {
    borderTopLeftRadius: DesignTokens.radius.lg,
    borderTopRightRadius: DesignTokens.radius.lg,
  },
  playerRowLast: {
    borderBottomLeftRadius: DesignTokens.radius.lg,
    borderBottomRightRadius: DesignTokens.radius.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  playerRowActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    padding: DesignTokens.spacing.xs,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  rank: {
    width: 24,
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Typography.headline,
    marginBottom: 2,
  },
  playerMeta: {
    ...Typography.caption,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
  },
});
