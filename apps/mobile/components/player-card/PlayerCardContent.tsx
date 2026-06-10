import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Alert, Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '@statcheck/convex';

import { BrandGradient, DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { usePaywall } from '@/context/PaywallContext';
import { useAuth } from '@/context/AuthContext';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import type { Player, PlayerLink } from '@/types';

import { AddLinkModal } from '../AddLinkModal';
import { DraggableLinkList } from '../DraggableLinkList';
import { LinkItem } from '../LinkItem';
import { AddPlayerToListModal } from '../lists';

type PlayerCardContentProps = {
  player: Player;
  onDismiss?: () => void;
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
// Format: https://www.basketball-reference.com/players/[first-letter]/[last5][first2]XX.html
// Known conflicts: when multiple players share the same URL pattern, Basketball Reference uses 01, 02, 03, etc.
const BASKETBALL_REFERENCE_OVERRIDES: Record<string, string> = {
  'jaylen brown': 'brownja02',      // brownja01 is Jabari Brown
  'marcus morris': 'morrima03',     // Earlier Marcus Morris players exist
  'gary payton ii': 'paytoga02',    // Gary Payton Sr is 01
  'tim hardaway jr.': 'hardati02',  // Tim Hardaway Sr is 01
  'larry nance jr.': 'nancela02',   // Larry Nance Sr is 01
  'gary trent jr.': 'trentga02',    // Gary Trent Sr is 01
  'kenyon martin jr.': 'martike04', // Earlier Kenyon Martins exist
  'scottie barnes': 'barnesc01',    // Correct - just verifying format
  'victor wembanyama': 'wembavi01', // Explicitly pin Wemby since this link is user-visible
};

const generateBasketballReferenceUrl = (playerName: string): string => {
  const normalized = playerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim();

  // Check for known overrides first
  const override = BASKETBALL_REFERENCE_OVERRIDES[normalized];
  if (override) {
    const firstLetter = override[0];
    return `https://www.basketball-reference.com/players/${firstLetter}/${override}.html`;
  }

  const parts = normalized.split(' ');
  if (parts.length < 2) return '';

  const firstName = parts[0];
  const lastName = parts[parts.length - 1]; // Use last part as last name

  const firstLetter = lastName[0];
  const lastNamePart = lastName.slice(0, 5);
  const firstNamePart = firstName.slice(0, 2);

  return `https://www.basketball-reference.com/players/${firstLetter}/${lastNamePart}${firstNamePart}01.html`;
};

export function PlayerCardContent({ player, onDismiss }: PlayerCardContentProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const { openPaywall } = usePaywall();
  const [imageError, setImageError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlayerLink | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Reset state when player changes
  useEffect(() => {
    setImageError(false);
  }, [player.id]);

  // Convex mutations
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

  const isNBA = player.sport?.toUpperCase() === 'NBA';

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
  const hasSportsReferenceLink = Boolean(sportsReferenceLink.url);

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
            { text: 'Upgrade', onPress: () => openPaywall() },
          ]
        );
      }
      return;
    }
    setShowAddModal(true);
  };

  const handleSaveLink = async (url: string, title: string) => {
    if (editingLink) {
      await updateLink(editingLink.id, { url, title });
    } else {
      await addLink(player.id, url, title);
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

      const shareUrl = `https://www.statcheckapp.com/player/${shareId}`;

      // Use native share sheet
      await Share.share({
        message: `Check out ${player.name} on StatCheck!\n${shareUrl}`,
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

  // Render links content
  const renderLinksContent = () => (
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
        {hasSportsReferenceLink && (
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
        {playerLinks.length === 0 && !hasSportsReferenceLink && (
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
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        bounces={true}>
        {/* Player Info Section */}
        <View style={styles.playerSection}>
          {/* Player photo */}
          {player.photoUrl && !imageError ? (
            <Image
              source={{ uri: player.photoUrl }}
              style={[styles.photo, accentColor && { borderWidth: 3, borderColor: accentColor }]}
              resizeMode="cover"
              onError={() => setImageError(true)}
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

        {/* Links Content */}
        <View style={styles.tabContent}>
          {renderLinksContent()}
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
