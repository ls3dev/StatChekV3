import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '@statcheck/convex';

import { AddPlayerSearchModal } from '@/components/lists';
import { AddLinkModal } from '@/components/AddLinkModal';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { AgendaMode, VSMode, RankingMode } from '@/components/list-modes';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useListsContext } from '@/context/ListsContext';
import { useAuth } from '@/context/AuthContext';
import { usePlayerData } from '@/context/PlayerDataContext';
import { getPlayerById } from '@/services/playerData';
import type { Player, PlayerListItem } from '@/types';

const SHARE_BASE_URL = 'https://statcheck.app/list';

// Type for player with full data
type PlayerWithData = PlayerListItem & { player: Player };

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    getListById,
    deleteList,
    addPlayerToList,
    removePlayerFromList,
    reorderPlayersInList,
    addLinkToList,
    removeLinkFromList,
  } = useListsContext();
  const { isLoaded: isPlayerDataLoaded, isLoading: isPlayerDataLoading } = usePlayerData();

  const createSharedList = useMutation(api.sharedLists.createSharedList);

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const list = getListById(id);

  // Map player IDs to full player data
  const playersWithData = useMemo((): PlayerWithData[] => {
    if (!list) return [];
    if (!list.players || !Array.isArray(list.players)) return [];
    if (!isPlayerDataLoaded) return []; // Wait for player data to load
    return list.players
      .filter((item) => item && item.playerId) // Filter out invalid items
      .map((item) => ({
        ...item,
        player: getPlayerById(item.playerId),
      }))
      .filter((item): item is PlayerWithData => item.player !== undefined)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [list, isPlayerDataLoaded]);

  // Determine the current mode based on player count
  const currentMode = useMemo(() => {
    const count = playersWithData.length;
    if (count === 0) return 'empty';
    if (count === 1) return 'agenda';
    if (count === 2) return 'vs';
    return 'ranking';
  }, [playersWithData.length]);

  // Handle drag end for reordering players (Ranking mode)
  const handleReorderPlayers = useCallback(
    async (data: (PlayerListItem & { player: Player })[]) => {
      if (!list) return;
      const reorderedItems: PlayerListItem[] = data.map((item, index) => ({
        playerId: item.playerId,
        order: index,
        addedAt: item.addedAt,
      }));
      await reorderPlayersInList(list.id, reorderedItems);
    },
    [list, reorderPlayersInList]
  );

  const handleDeleteList = () => {
    const doDelete = async () => {
      await deleteList(list!.id);
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
    if (!list) return;
    await removePlayerFromList(list.id, playerId);
  };

  const handleAddPlayer = async (playerId: string) => {
    if (!list) return;
    await addPlayerToList(list.id, playerId);
    setShowAddPlayerModal(false);
  };

  const handleAddLink = async (url: string, title: string) => {
    if (!list) return;
    await addLinkToList(list.id, url, title);
  };

  const handleRemoveLink = async (linkId: string) => {
    if (!list) return;
    await removeLinkFromList(list.id, linkId);
  };

  const handleShareList = async () => {
    if (!list) return;
    setIsSharing(true);
    setShowOptions(false);

    try {
      // Create the shared list with all player data
      const { shareId } = await createSharedList({
        name: list.name,
        description: list.description,
        players: playersWithData.map((p, index) => ({
          playerId: p.playerId,
          order: index,
          name: p.player.name,
          team: p.player.team,
          position: p.player.position,
          photoUrl: p.player.photoUrl,
          sportsReferenceUrl: p.player.sportsReferenceUrl,
          hallOfFame: p.player.hallOfFame,
        })),
        links: (list.links ?? []).map((link) => ({
          id: link.id,
          url: link.url,
          title: link.title,
          order: link.order,
        })),
        originalCreatedAt: list.createdAt,
        originalUpdatedAt: list.updatedAt,
        sharedByName: user?.name || undefined,
      });

      // Create the shareable URL
      const shareUrl = `${SHARE_BASE_URL}/${shareId}`;

      // Share with Open Graph preview text
      const shareMessage = `${list.name}\n\nCheck out my list on StatCheck!\n${shareUrl}`;

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert('Copied!', 'Share link copied to clipboard');
      } else {
        await Share.share({
          message: shareMessage,
          url: shareUrl, // iOS will use this for rich preview
          title: list.name,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share list');
    } finally {
      setIsSharing(false);
    }
  };

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

  // Show loading state while player data is loading
  if (isPlayerDataLoading) {
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
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
            ]}
            numberOfLines={1}>
            {list.name}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignTokens.accentPurple} />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            Loading players...
          </Text>
        </View>
      </View>
    );
  }

  // Render content based on current mode
  const renderContent = () => {
    switch (currentMode) {
      case 'empty':
        return (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={48}
                color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                ]}
              >
                No players yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                ]}
              >
                Add a player to start building your take
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddButton, { backgroundColor: DesignTokens.accentPurple }]}
                onPress={() => setShowAddPlayerModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyAddButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'agenda':
        return (
          <View>
            <AgendaMode
              player={playersWithData[0].player}
              links={list?.links ?? []}
              isDark={isDark}
              onPlayerPress={() => setSelectedPlayer(playersWithData[0].player)}
              onAddPlayer={() => setShowAddPlayerModal(true)}
              onAddLink={() => setShowAddLinkModal(true)}
              onRemoveLink={handleRemoveLink}
              onRemovePlayer={() => handleRemovePlayer(playersWithData[0].playerId)}
            />
          </View>
        );

      case 'vs':
        return (
          <View>
            <VSMode
              player1={playersWithData[0].player}
              player2={playersWithData[1].player}
              links={list?.links ?? []}
              isDark={isDark}
              onPlayer1Press={() => setSelectedPlayer(playersWithData[0].player)}
              onPlayer2Press={() => setSelectedPlayer(playersWithData[1].player)}
              onAddPlayer={() => setShowAddPlayerModal(true)}
              onAddLink={() => setShowAddLinkModal(true)}
              onRemoveLink={handleRemoveLink}
              onRemovePlayer={handleRemovePlayer}
            />
          </View>
        );

      case 'ranking':
        return (
          <View>
            <RankingMode
              players={playersWithData}
              links={list?.links ?? []}
              isDark={isDark}
              onPlayerPress={(player) => setSelectedPlayer(player)}
              onAddPlayer={() => setShowAddPlayerModal(true)}
              onRemovePlayer={handleRemovePlayer}
              onReorderPlayers={handleReorderPlayers}
              onAddLink={() => setShowAddLinkModal(true)}
              onRemoveLink={handleRemoveLink}
            />
          </View>
        );
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

      {/* Content - scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Mode-specific content */}
        {renderContent()}
      </ScrollView>

      {/* Modals */}
      <AddPlayerSearchModal
        visible={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onAddPlayer={handleAddPlayer}
        existingPlayerIds={(list.players ?? []).map((p) => p.playerId)}
      />

      <AddLinkModal
        visible={showAddLinkModal}
        onClose={() => setShowAddLinkModal(false)}
        onSave={handleAddLink}
      />

      <PlayerCardBottomSheet
        player={selectedPlayer}
        isVisible={!!selectedPlayer}
        onDismiss={() => setSelectedPlayer(null)}
      />
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
    paddingBottom: DesignTokens.spacing.xxl,
  },
  description: {
    ...Typography.body,
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  emptyContainer: {
    padding: DesignTokens.spacing.lg,
  },
  emptyCard: {
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xxl,
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  emptyTitle: {
    ...Typography.headline,
    fontSize: 18,
    marginTop: DesignTokens.spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.md,
  },
  emptyAddButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
});
