import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens, Typography, PlayerStatusColors } from '@/constants/theme';
import type { Player, PlayerListLink } from '@/types';

interface VSModeProps {
  player1: Player;
  player2: Player;
  links: PlayerListLink[];
  isDark: boolean;
  onPlayer1Press: () => void;
  onPlayer2Press: () => void;
  onAddPlayer: () => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

function PlayerCard({
  player,
  isDark,
  onPress,
  onRemove,
  side,
}: {
  player: Player;
  isDark: boolean;
  onPress: () => void;
  onRemove: () => void;
  side: 'left' | 'right';
}) {
  const [imageError, setImageError] = useState(false);

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : DesignTokens.accentPurple;

  const displayTeam = player.team === 'N/A' ? null : player.team;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.playerCard,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
        },
      ]}
    >
      {/* Remove button */}
      <TouchableOpacity
        style={[styles.removeButton, side === 'left' ? { left: 8 } : { right: 8 }]}
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={20} color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted} />
      </TouchableOpacity>

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
            <Ionicons name="star" size={10} color="#FFD700" />
          </View>
        )}
      </View>

      {/* Player Name */}
      <Text
        style={[styles.playerName, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}
        numberOfLines={2}
      >
        {player.name}
      </Text>

      {/* Team */}
      {displayTeam && (
        <Text style={[styles.playerTeam, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
          {displayTeam}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function VSMode({
  player1,
  player2,
  links,
  isDark,
  onPlayer1Press,
  onPlayer2Press,
  onAddPlayer,
  onAddLink,
  onRemoveLink,
  onRemovePlayer,
}: VSModeProps) {
  return (
    <View style={styles.container}>
      {/* VS Header */}
      <View style={styles.vsContainer}>
        {/* Player 1 */}
        <PlayerCard
          player={player1}
          isDark={isDark}
          onPress={onPlayer1Press}
          onRemove={() => onRemovePlayer(player1.id)}
          side="left"
        />

        {/* VS Badge */}
        <View style={styles.vsBadge}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.vsGradient}
          >
            <Text style={styles.vsText}>VS</Text>
          </LinearGradient>
        </View>

        {/* Player 2 */}
        <PlayerCard
          player={player2}
          isDark={isDark}
          onPress={onPlayer2Press}
          onRemove={() => onRemovePlayer(player2.id)}
          side="right"
        />
      </View>

      {/* Add to Ranking Button - transitions to Ranking mode */}
      <TouchableOpacity onPress={onAddPlayer} activeOpacity={0.8}>
        <LinearGradient
          colors={[DesignTokens.accentPurple, DesignTokens.accentPurple + 'CC']}
          style={styles.addRankingButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addRankingText}>Add to Ranking</Text>
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
                <Ionicons name="link" size={16} color={DesignTokens.accentPurple} />
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
          <Ionicons name="add" size={20} color={DesignTokens.accentPurple} />
          <Text style={[styles.addReceiptText, { color: DesignTokens.accentPurple }]}>Add Receipt</Text>
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
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
  },
  playerCard: {
    flex: 1,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    zIndex: 1,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: DesignTokens.spacing.sm,
  },
  playerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 24,
    fontWeight: '700',
  },
  hofBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 3,
  },
  playerName: {
    ...Typography.headline,
    fontSize: 14,
    textAlign: 'center',
  },
  playerTeam: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  vsBadge: {
    zIndex: 1,
    marginHorizontal: -DesignTokens.spacing.md,
  },
  vsGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  vsText: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontSize: 14,
  },
  addRankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  addRankingText: {
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
