import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { DesignTokens, Typography, PlayerStatusColors } from '@/constants/theme';
import type { Player, PlayerListItem, PlayerListLink } from '@/types';

type PlayerWithData = PlayerListItem & { player: Player };

interface RankingModeProps {
  players: PlayerWithData[];
  links: PlayerListLink[];
  isDark: boolean;
  onPlayerPress: (player: Player) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
}

function RankPlayerRow({
  item,
  index,
  totalCount,
  isDark,
  onPress,
  onRemove,
}: {
  item: PlayerWithData;
  index: number;
  totalCount: number;
  isDark: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const player = item.player;

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isHallOfFame = player.hallOfFame === true;
  const accentColor = isHallOfFame ? PlayerStatusColors.hallOfFame.primary : null;

  const displayTeam = player.team === 'N/A' ? null : player.team;
  const displayPosition = player.position === 'N/A' ? null : player.position;

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  // Rank styling
  const getRankStyle = () => {
    if (index === 0) return { backgroundColor: '#FFD700', color: '#000' }; // Gold
    if (index === 1) return { backgroundColor: '#C0C0C0', color: '#000' }; // Silver
    if (index === 2) return { backgroundColor: '#CD7F32', color: '#FFF' }; // Bronze
    return { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary };
  };

  const rankStyle = getRankStyle();

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
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={22} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.rowContainer,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
      ]}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={[
            styles.row,
            {
              backgroundColor: accentColor
                ? isDark
                  ? 'rgba(255, 215, 0, 0.08)'
                  : 'rgba(255, 215, 0, 0.1)'
                : isDark
                  ? DesignTokens.cardBackgroundDark
                  : DesignTokens.cardBackground,
            },
            !isLast && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >

            {/* Rank Badge */}
            <View style={[styles.rankBadge, { backgroundColor: rankStyle.backgroundColor }]}>
              <Text style={[styles.rankText, { color: rankStyle.color }]}>{index + 1}</Text>
            </View>

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
                ]}
              >
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
                numberOfLines={1}
              >
                {player.name}
              </Text>
              {(displayTeam || displayPosition) && (
                <Text
                  style={[
                    styles.playerMeta,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}
                >
                  {displayTeam && displayPosition
                    ? `${displayTeam} · ${displayPosition}`
                    : displayTeam || displayPosition}
                </Text>
              )}
            </View>

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

export function RankingMode({
  players,
  links,
  isDark,
  onPlayerPress,
  onAddPlayer,
  onRemovePlayer,
  onAddLink,
  onRemoveLink,
}: RankingModeProps) {
  return (
    <View style={styles.container}>
      {/* Rankings Header */}
      <View style={styles.rankingsHeader}>
        <Text style={[styles.rankingsTitle, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
          Rankings
        </Text>
        <TouchableOpacity onPress={onAddPlayer}>
          <Text style={[styles.addText, { color: DesignTokens.accentPurple }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Rankings List */}
      <View>
        {players.map((item, index) => (
          <RankPlayerRow
            key={item.playerId}
            item={item}
            index={index}
            totalCount={players.length}
            isDark={isDark}
            onPress={() => onPlayerPress(item.player)}
            onRemove={() => onRemovePlayer(item.playerId)}
          />
        ))}
      </View>

      {/* Add More Players */}
      <TouchableOpacity onPress={onAddPlayer} activeOpacity={0.8}>
        <LinearGradient
          colors={[DesignTokens.accentPurple, DesignTokens.accentPurple + 'CC']}
          style={styles.addPlayerButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addPlayerText}>Add Player</Text>
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
              Add evidence to support your rankings
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
  rankingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.xs,
  },
  rankingsTitle: {
    ...Typography.headline,
  },
  addText: {
    ...Typography.body,
    fontWeight: '600',
  },
  rowContainer: {
    overflow: 'hidden',
  },
  rowFirst: {
    borderTopLeftRadius: DesignTokens.radius.lg,
    borderTopRightRadius: DesignTokens.radius.lg,
  },
  rowLast: {
    borderBottomLeftRadius: DesignTokens.radius.lg,
    borderBottomRightRadius: DesignTokens.radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  rowActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    padding: DesignTokens.spacing.xs,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
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
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  addPlayerText: {
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
