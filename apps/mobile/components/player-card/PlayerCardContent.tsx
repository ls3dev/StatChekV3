import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useAction } from 'convex/react';
import { api } from '@statcheck/convex';

import { BrandGradient, DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useListsContext } from '@/context/ListsContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import type { Player, PlayerLink } from '@/types';

import { AddLinkModal } from '../AddLinkModal';
import { DraggableLinkList } from '../DraggableLinkList';
import { LinkItem } from '../LinkItem';
import { AddPlayerToListModal } from '../lists';
import { PlayerStatsCard } from '../nba/PlayerStatsCard';
import { ContractCard } from '../nba/ContractCard';
import { AdvancedStatsBottomSheet } from '../nba/AdvancedStatsBottomSheet';
import { PlayerCardTabs, type PlayerCardTab } from './PlayerCardTabs';

type PlayerCardContentProps = {
  player: Player;
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
  return positionColors[position] || DesignTokens.accentGreen;
};

// Generate Basketball Reference URL from player name
// Format: https://www.basketball-reference.com/players/[first-letter]/[last5][first2]01.html
const generateBasketballReferenceUrl = (playerName: string): string => {
  const normalized = playerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase();

  const parts = normalized.split(' ');
  if (parts.length < 2) return '';

  const firstName = parts[0];
  const lastName = parts[parts.length - 1]; // Use last part as last name

  const firstLetter = lastName[0];
  const lastNamePart = lastName.slice(0, 5);
  const firstNamePart = firstName.slice(0, 2);

  return `https://www.basketball-reference.com/players/${firstLetter}/${lastNamePart}${firstNamePart}01.html`;
};

interface BasicStats {
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
}

interface AdvancedStats {
  true_shooting_percentage: number;
  usage_percentage: number;
  net_rating: number;
  offensive_rating: number;
  defensive_rating: number;
  pie: number;
  pace: number;
  effective_field_goal_percentage: number;
  assist_percentage: number;
  rebound_percentage: number;
  offensive_rebound_percentage: number;
  defensive_rebound_percentage: number;
  turnover_ratio: number;
  assist_ratio: number;
  assist_to_turnover: number;
}

interface Contract {
  season: number;
  amount: number;
  currency: string;
}

export function PlayerCardContent({ player }: PlayerCardContentProps) {
  const { isDark } = useTheme();
  const { isProUser } = useRevenueCat();
  const { setShowPaywall } = useListsContext();
  const [imageError, setImageError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlayerLink | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Tab state
  const isNBA = player.sport?.toUpperCase() === 'NBA';
  const [activeTab, setActiveTab] = useState<PlayerCardTab>(isNBA ? 'stats' : 'links');

  // Ball Don't Lie player data
  const [bdlPlayerId, setBdlPlayerId] = useState<number | null>(null);
  const [isSearchingPlayer, setIsSearchingPlayer] = useState(false);
  const [playerNotFound, setPlayerNotFound] = useState(false);

  // Stats state
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Contract state
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  // Advanced stats bottom sheet state
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Reset state when player changes
  useEffect(() => {
    setImageError(false);
    setBdlPlayerId(null);
    setBasicStats(null);
    setAdvancedStats(null);
    setContracts([]);
    setPlayerNotFound(false);
    setShowAdvancedStats(false);
  }, [player.id]);

  // Convex actions
  const searchPlayerByName = useAction(api.nba.searchPlayerByName);
  const getPlayerStats = useAction(api.nba.getPlayerStats);
  const getAdvancedStats = useAction(api.nba.getAdvancedStats);
  const getPlayerContract = useAction(api.nba.getPlayerContract);
  const createSharedPlayer = useMutation(api.sharedPlayers.createSharedPlayer);

  const {
    getLinksForPlayer,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    isAtLimit,
  } = usePlayerLinks();

  const playerLinks = getLinksForPlayer(player.id);
  const positionColor = getPositionColor(player.position);

  // For NBA players, always generate Basketball Reference URL (stored URLs may be wrong)
  const getSportsReferenceUrl = () => {
    if (isNBA) {
      return generateBasketballReferenceUrl(player.name);
    }
    return player.sportsReferenceUrl || '';
  };

  const sportsReferenceLink: PlayerLink = {
    id: 'sports-reference',
    playerId: player.id,
    url: getSportsReferenceUrl(),
    title: isNBA ? 'Basketball Reference' : 'Sports Reference',
    order: -1,
    createdAt: 0,
  };

  // Search for player in Ball Don't Lie API on mount (NBA only)
  useEffect(() => {
    if (!isNBA) return;

    const searchPlayer = async () => {
      setIsSearchingPlayer(true);
      setPlayerNotFound(false);

      try {
        // Normalize name: remove accents and special characters
        const normalizedName = player.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        console.log('[PlayerCard] Searching for player:', normalizedName);
        const result = await searchPlayerByName({ name: normalizedName });
        console.log('[PlayerCard] Search result:', result);

        if (result.playerId) {
          setBdlPlayerId(result.playerId);
        } else {
          console.log('[PlayerCard] Player not found in API');
          setPlayerNotFound(true);
        }
      } catch (error) {
        console.error('Failed to search player:', error);
        setPlayerNotFound(true);
      } finally {
        setIsSearchingPlayer(false);
      }
    };

    searchPlayer();
  }, [player.name, isNBA, searchPlayerByName]);

  // Fetch stats when tab changes to 'stats' and we have playerId
  useEffect(() => {
    if (activeTab !== 'stats' || !bdlPlayerId || basicStats) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        // Fetch basic stats
        const basicResult = await getPlayerStats({ playerId: bdlPlayerId });
        if (basicResult.stats) {
          setBasicStats(basicResult.stats as unknown as BasicStats);
        }

        // Fetch advanced stats if Pro user (wrapped in try-catch since this can fail)
        if (isProUser) {
          try {
            const advancedResult = await getAdvancedStats({ playerId: bdlPlayerId });
            if (advancedResult.stats && !advancedResult.requiresPro) {
              setAdvancedStats(advancedResult.stats as unknown as AdvancedStats);
            }
          } catch (advError) {
            // Advanced stats failed but basic stats still work - don't show error
            console.warn('Advanced stats unavailable:', advError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStatsError('Failed to load stats');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [activeTab, bdlPlayerId, basicStats, isProUser, getPlayerStats, getAdvancedStats]);

  // Fetch contracts when tab changes to 'contract' and user is Pro
  useEffect(() => {
    if (activeTab !== 'contract' || !bdlPlayerId || contracts.length > 0) return;

    const fetchContracts = async () => {
      if (!isProUser) return; // Don't fetch if not Pro

      setIsLoadingContracts(true);

      try {
        const result = await getPlayerContract({ playerId: bdlPlayerId });
        if (result.contracts && !result.requiresPro) {
          setContracts(
            result.contracts.map((c: any) => ({
              season: c.season,
              amount: c.base_salary || c.cap_hit || c.total_cash || 0,
              currency: 'USD',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
      } finally {
        setIsLoadingContracts(false);
      }
    };

    fetchContracts();
  }, [activeTab, bdlPlayerId, contracts.length, isProUser, getPlayerContract]);

  const handleUnlockPress = useCallback(() => {
    setShowPaywall(true);
  }, [setShowPaywall]);

  const handleAdvancedPress = useCallback(() => {
    setShowAdvancedStats(true);
  }, []);

  const handleAddPress = () => {
    if (isAtLimit(player.id)) {
      if (Platform.OS === 'web') {
        window.alert("Upgrade to Pro for unlimited links! You've reached the free limit of 3 links.");
      } else {
        Alert.alert(
          'Upgrade to Pro',
          "You've reached the free limit of 3 links. Upgrade to Pro for unlimited links!",
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => setShowPaywall(true) },
          ]
        );
      }
      return;
    }
    setShowAddModal(true);
  };

  const handleAddLink = async (url: string, title: string): Promise<boolean> => {
    return await addLink(player.id, url, title);
  };

  const handleSaveLink = async (url: string, title: string) => {
    if (editingLink) {
      await updateLink(editingLink.id, { url, title });
    } else {
      await handleAddLink(url, title);
    }
    setShowAddModal(false);
    setEditingLink(null);
  };

  const handleEdit = (link: PlayerLink) => {
    setEditingLink(link);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLink(null);
  };

  const handleReorderLinks = async (newOrder: typeof playerLinks) => {
    await reorderLinks(player.id, newOrder);
  };

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const atLimit = isAtLimit(player.id);

  const handleSharePlayer = async () => {
    try {
      setIsSharing(true);

      // Create shared player with current links
      const links = playerLinks.map((link, index) => ({
        id: link.id,
        url: link.url,
        title: link.title,
        order: index,
      }));

      const { shareId } = await createSharedPlayer({
        playerId: player.id,
        name: player.name,
        sport: player.sport || 'NFL',
        team: player.team,
        position: player.position,
        number: player.number || '',
        photoUrl: player.photoUrl,
        sportsReferenceUrl: player.sportsReferenceUrl,
        stats: player.stats,
        hallOfFame: player.hallOfFame,
        links,
      });

      const shareUrl = `https://statcheck.app/player/${shareId}`;

      // Use native share sheet
      await Share.share({
        message: `Check out ${player.name} on StatCheck!\n${shareUrl}`,
        url: shareUrl,
        title: `${player.name} - StatCheck`,
      });
    } catch (error) {
      console.error('Failed to share player:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to share player. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to share player. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Determine player status styling
  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : null;

  // Hide "N/A" team and position
  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  // Get gradient colors based on status
  const getGradientColors = (): [string, string] => {
    if (isHallOfFame) return ['#FFD700', '#FFA500'];
    return [BrandGradient.start, BrandGradient.end];
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        if (isSearchingPlayer) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
              <Text style={[styles.loadingText, isDark && styles.textSecondary]}>
                Finding player...
              </Text>
            </View>
          );
        }

        if (playerNotFound) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="stats-chart-outline"
                size={32}
                color={DesignTokens.textMuted}
              />
              <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
                Stats not available for this player
              </Text>
            </View>
          );
        }

        return (
          <PlayerStatsCard
            basicStats={basicStats}
            advancedStats={advancedStats}
            isLoading={isLoadingStats}
            isProUser={isProUser}
            onUnlockPress={handleUnlockPress}
            onAdvancedPress={handleAdvancedPress}
          />
        );

      case 'contract':
        if (isSearchingPlayer) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
              <Text style={[styles.loadingText, isDark && styles.textSecondary]}>
                Finding player...
              </Text>
            </View>
          );
        }

        if (playerNotFound) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color={DesignTokens.textMuted}
              />
              <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
                Contract not available for this player
              </Text>
            </View>
          );
        }

        if (!isProUser) {
          return (
            <ContractCard
              contracts={[]}
              isLocked={true}
              onUnlockPress={handleUnlockPress}
            />
          );
        }

        if (isLoadingContracts) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
              <Text style={[styles.loadingText, isDark && styles.textSecondary]}>
                Loading contract...
              </Text>
            </View>
          );
        }

        return (
          <ContractCard
            contracts={contracts}
            playerName={player.name}
            isLocked={false}
          />
        );

      case 'links':
      default:
        return (
          <>
            {/* Links Section */}
            <View style={styles.linksSection}>
              <Text
                style={[
                  styles.linksLabel,
                  { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted },
                ]}>
                QUICK LINKS
              </Text>

              {/* Sports Reference Link (default) */}
              {player.sportsReferenceUrl && (
                <View style={styles.linkItem}>
                  <LinkItem link={sportsReferenceLink} onEdit={() => {}} onDelete={() => {}} isDefault />
                </View>
              )}

              {/* Custom Links */}
              {playerLinks.length > 0 && (
                <DraggableLinkList
                  links={playerLinks}
                  onReorder={handleReorderLinks}
                  onEdit={handleEdit}
                  onDelete={deleteLink}
                />
              )}

              {/* Empty State */}
              {playerLinks.length === 0 && !player.sportsReferenceUrl && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="link-outline"
                    size={32}
                    color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                    ]}>
                    No links yet
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted },
                    ]}>
                    Add custom links to this player
                  </Text>
                </View>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Add Link Button */}
              <TouchableOpacity
                style={[styles.addButton, atLimit && styles.addButtonDisabled]}
                onPress={handleAddPress}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={atLimit ? ['#9CA3AF', '#9CA3AF'] : [BrandGradient.start, BrandGradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Link</Text>
                </LinearGradient>
              </TouchableOpacity>

              {atLimit && (
                <Text
                  style={[
                    styles.limitText,
                    { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted },
                  ]}>
                  Free limit reached (3/3)
                </Text>
              )}

              {/* Add to List Button */}
              <TouchableOpacity
                style={[
                  styles.addToListButton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                ]}
                onPress={() => setShowAddToListModal(true)}
                activeOpacity={0.8}>
                <Ionicons
                  name="list"
                  size={20}
                  color={isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary}
                />
                <Text
                  style={[
                    styles.addToListButtonText,
                    { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                  ]}>
                  Add to List
                </Text>
              </TouchableOpacity>

              {/* Share Player Button */}
              <TouchableOpacity
                style={[
                  styles.addToListButton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                ]}
                onPress={handleSharePlayer}
                disabled={isSharing}
                activeOpacity={0.8}>
                <Ionicons
                  name={isSharing ? 'hourglass-outline' : 'share-outline'}
                  size={20}
                  color={isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary}
                />
                <Text
                  style={[
                    styles.addToListButtonText,
                    { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                  ]}>
                  {isSharing ? 'Sharing...' : 'Share Player'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
        },
      ]}>
      {/* Header gradient accent */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerAccent}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Player Info Section */}
        <View style={styles.playerSection}>
          {/* Player photo */}
          {player.photoUrl && !imageError ? (
            <Image
              source={{ uri: player.photoUrl }}
              style={[styles.photo, accentColor && { borderWidth: 3, borderColor: accentColor }]}
              contentFit="cover"
              onError={() => setImageError(true)}
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: (accentColor || positionColor) + '15' },
                accentColor && { borderWidth: 3, borderColor: accentColor },
              ]}>
              <Text style={[styles.placeholderText, { color: accentColor || positionColor }]}>
                {initials}
              </Text>
            </View>
          )}

          {/* Player name */}
          <Text
            style={[
              styles.playerName,
              { color: accentColor || (isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary) },
            ]}
            numberOfLines={2}>
            {player.name}
          </Text>

          {/* Team and position */}
          <View style={styles.metaRow}>
            {displayTeam && (
              <Text
                style={[
                  styles.teamName,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                ]}>
                {displayTeam}
              </Text>
            )}
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
          </View>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
          ]}
        />

        {/* Tabs (NBA only shows all tabs, others just Links) */}
        <View style={styles.tabsContainer}>
          <PlayerCardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            sport={player.sport}
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>

      <AddLinkModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />

      <AddPlayerToListModal
        visible={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        player={player}
      />

      <AdvancedStatsBottomSheet
        isVisible={showAdvancedStats}
        onDismiss={() => setShowAdvancedStats(false)}
        stats={advancedStats ? {
          true_shooting_percentage: advancedStats.true_shooting_percentage,
          usage_percentage: advancedStats.usage_percentage,
          net_rating: advancedStats.net_rating,
          offensive_rating: advancedStats.offensive_rating,
          defensive_rating: advancedStats.defensive_rating,
          pie: advancedStats.pie,
          pace: advancedStats.pace,
          effective_field_goal_percentage: advancedStats.effective_field_goal_percentage,
          assist_percentage: advancedStats.assist_percentage,
          rebound_percentage: advancedStats.rebound_percentage,
          offensive_rebound_percentage: advancedStats.offensive_rebound_percentage,
          defensive_rebound_percentage: advancedStats.defensive_rebound_percentage,
          turnover_ratio: advancedStats.turnover_ratio,
          assist_ratio: advancedStats.assist_ratio,
          assist_to_turnover: advancedStats.assist_to_turnover,
        } : null}
        playerName={player.name}
        isLoading={isLoadingStats && !advancedStats}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: DesignTokens.radius.xl,
    overflow: 'hidden',
  },
  headerAccent: {
    height: 4,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing.lg,
  },
  playerSection: {
    alignItems: 'center',
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: DesignTokens.spacing.md,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playerName: {
    ...Typography.displayMedium,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  teamName: {
    ...Typography.bodyLarge,
  },
  positionBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  positionText: {
    ...Typography.label,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: DesignTokens.spacing.lg,
  },
  tabsContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
  },
  tabContent: {
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  loadingText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  linksSection: {
    paddingTop: DesignTokens.spacing.md,
  },
  linksLabel: {
    ...Typography.captionSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: DesignTokens.spacing.md,
  },
  linkItem: {
    marginBottom: DesignTokens.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    marginTop: DesignTokens.spacing.sm,
  },
  emptySubtext: {
    ...Typography.caption,
  },
  buttonContainer: {
    paddingTop: DesignTokens.spacing.lg,
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  addButton: {
    width: '100%',
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  addButtonText: {
    color: '#fff',
    ...Typography.headline,
    fontSize: 15,
  },
  limitText: {
    ...Typography.captionSmall,
  },
  addToListButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.sm,
  },
  addToListButtonText: {
    ...Typography.headline,
    fontSize: 15,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
