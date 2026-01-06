import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BrandGradient, DesignTokens, PlayerStatusColors, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import type { Player, PlayerLink } from '@/types';

import { AddLinkModal } from '../AddLinkModal';
import { DraggableLinkList } from '../DraggableLinkList';
import { LinkItem } from '../LinkItem';
import { AddPlayerToListModal } from '../lists';

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
  return positionColors[position] || DesignTokens.accentPurple;
};

export function PlayerCardContent({ player }: PlayerCardContentProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlayerLink | null>(null);

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

  const sportsReferenceLink: PlayerLink = {
    id: 'sports-reference',
    playerId: player.id,
    url: player.sportsReferenceUrl || '',
    title: 'Sports Reference',
    order: -1,
    createdAt: 0,
  };

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
            { text: 'Upgrade', onPress: () => console.log('Navigate to Pro') },
          ]
        );
      }
      return;
    }
    setShowAddModal(true);
  };

  const handleAddLink = (url: string, title: string): boolean => {
    return addLink(player.id, url, title);
  };

  const handleSaveLink = (url: string, title: string) => {
    if (editingLink) {
      updateLink(editingLink.id, { url, title });
    } else {
      handleAddLink(url, title);
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

  const handleReorderLinks = (newOrder: typeof playerLinks) => {
    reorderLinks(player.id, newOrder);
  };

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const atLimit = isAtLimit(player.id);

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
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: DesignTokens.spacing.md,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  placeholderText: {
    fontSize: 40,
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
  linksSection: {
    paddingHorizontal: DesignTokens.spacing.lg,
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
    paddingHorizontal: DesignTokens.spacing.lg,
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
});
