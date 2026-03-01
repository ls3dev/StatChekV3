import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens, Typography, PlayerStatusColors } from '@/constants/theme';
import type { Player, PlayerListLink } from '@/types';

interface AgendaModeProps {
  player: Player;
  links: PlayerListLink[];
  isDark: boolean;
  onPlayerPress: () => void;
  onAddPlayer: () => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
  onRemovePlayer: () => void;
}

export function AgendaMode({
  player,
  links,
  isDark,
  onPlayerPress,
  onAddPlayer,
  onAddLink,
  onRemoveLink,
  onRemovePlayer,
}: AgendaModeProps) {
  const [imageError, setImageError] = useState(false);

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : DesignTokens.accentGreen;

  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  return (
    <View style={styles.container}>
      {/* Player Spotlight Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPlayerPress}
        style={[
          styles.spotlightCard,
          {
            backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
            borderColor: accentColor + '30',
          },
        ]}
      >
        {/* Player Photo */}
        <View style={styles.photoContainer}>
          {player.photoUrl && !imageError ? (
            <Image
              source={{ uri: player.photoUrl }}
              style={[styles.playerPhoto, { borderColor: accentColor }]}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.photoInitials, { color: accentColor }]}>{initials}</Text>
            </View>
          )}
          {isHallOfFame && (
            <View style={styles.hofBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
        </View>

        {/* Player Info */}
        <Text style={[styles.playerName, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
          {player.name}
        </Text>
        {(displayTeam || displayPosition) && (
          <Text style={[styles.playerMeta, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </Text>
        )}

        {/* Remove button */}
        <TouchableOpacity style={styles.removeButton} onPress={onRemovePlayer}>
          <Ionicons name="close-circle" size={24} color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Add Opponent Button - transitions to VS mode */}
      <TouchableOpacity onPress={onAddPlayer} activeOpacity={0.8}>
        <LinearGradient
          colors={[accentColor, accentColor + 'CC']}
          style={styles.addOpponentButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addOpponentText}>Add Opponent</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receipts Section */}
      <View style={styles.receiptsSection}>
        <View style={styles.receiptHeader}>
          <Ionicons name="document-text-outline" size={20} color={isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary} />
          <Text style={[styles.receiptTitle, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
            Receipts
          </Text>
        </View>

        {links.length === 0 ? (
          <View style={[styles.emptyReceipts, { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground }]}>
            <Text style={[styles.emptyReceiptsText, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
              Add evidence to support your take
            </Text>
          </View>
        ) : (
          <View style={[styles.linksList, { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground }]}>
            {links.map((link, index) => (
              <View
                key={link.id}
                style={[
                  styles.linkItem,
                  index < links.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
              >
                <Ionicons name="link" size={16} color={DesignTokens.accentGreen} />
                <View style={styles.linkContent}>
                  <Text
                    style={[styles.linkTitle, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}
                    numberOfLines={1}
                  >
                    {link.title}
                  </Text>
                  <Text
                    style={[styles.linkUrl, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}
                    numberOfLines={1}
                  >
                    {link.url}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onRemoveLink(link.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addReceiptButton, { borderColor: isDark ? DesignTokens.borderDark : DesignTokens.border }]}
          onPress={onAddLink}
        >
          <Ionicons name="add" size={20} color={DesignTokens.accentGreen} />
          <Text style={[styles.addReceiptText, { color: DesignTokens.accentGreen }]}>Add Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.lg,
  },
  spotlightCard: {
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: DesignTokens.spacing.md,
  },
  playerPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 36,
    fontWeight: '700',
  },
  hofBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
  },
  playerName: {
    ...Typography.displaySmall,
    textAlign: 'center',
  },
  playerMeta: {
    ...Typography.body,
    marginTop: DesignTokens.spacing.xs,
  },
  removeButton: {
    position: 'absolute',
    top: DesignTokens.spacing.sm,
    right: DesignTokens.spacing.sm,
  },
  addOpponentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  addOpponentText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  receiptsSection: {
    gap: DesignTokens.spacing.sm,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
  },
  receiptTitle: {
    ...Typography.headline,
  },
  emptyReceipts: {
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
  },
  emptyReceiptsText: {
    ...Typography.body,
  },
  linksList: {
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    ...Typography.body,
    fontWeight: '500',
  },
  linkUrl: {
    ...Typography.caption,
  },
  addReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: DesignTokens.spacing.sm,
  },
  addReceiptText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
