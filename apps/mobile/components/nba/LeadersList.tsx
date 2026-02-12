import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team: {
    id: number;
    abbreviation: string;
    full_name: string;
  };
}

interface Leader {
  player: Player;
  value: number;
  rank: number;
}

interface LeadersListProps {
  leaders: Leader[];
  statType: string;
  statLabel: string;
  onPlayerPress?: (player: Player) => void;
}

const STAT_PRECISION: Record<string, number> = {
  pts: 1,
  reb: 1,
  ast: 1,
  stl: 1,
  blk: 1,
  fg_pct: 1,
  fg3_pct: 1,
  ft_pct: 1,
};

export function LeadersList({ leaders, statType, statLabel, onPlayerPress }: LeadersListProps) {
  const { isDark } = useTheme();

  const formatValue = (value: number) => {
    const precision = STAT_PRECISION[statType] ?? 1;
    if (statType.includes('pct')) {
      return (value * 100).toFixed(precision) + '%';
    }
    return value.toFixed(precision);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.rank1;
    if (rank === 2) return styles.rank2;
    if (rank === 3) return styles.rank3;
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerText, isDark && styles.textDark]}>{statLabel}</Text>
      </View>

      {/* Leaders */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {leaders.map((leader, index) => (
          <Pressable
            key={leader.player.id}
            style={({ pressed }) => [
              styles.row,
              isDark && styles.rowDark,
              pressed && styles.rowPressed,
            ]}
            onPress={() => onPlayerPress?.(leader.player)}
          >
            {/* Rank */}
            <View style={[styles.rankContainer, getRankStyle(leader.rank)]}>
              <Text
                style={[
                  styles.rank,
                  leader.rank <= 3 && styles.rankTop3,
                ]}
              >
                {leader.rank}
              </Text>
            </View>

            {/* Player Info */}
            <View style={styles.playerInfo}>
              <Text
                style={[styles.playerName, isDark && styles.textDark]}
                numberOfLines={1}
              >
                {leader.player.first_name} {leader.player.last_name}
              </Text>
              <Text style={[styles.teamInfo, isDark && styles.textSecondary]}>
                {leader.player.team.abbreviation} · {leader.player.position || 'N/A'}
              </Text>
            </View>

            {/* Stat Value */}
            <Text style={[styles.statValue, isDark && styles.textDark]}>
              {formatValue(leader.value)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  headerDark: {
    backgroundColor: DesignTokens.backgroundSecondaryDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  headerText: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm + 2,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  rowDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rankContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.sm,
    backgroundColor: 'transparent',
  },
  rank1: {
    backgroundColor: '#FFD700', // Gold
  },
  rank2: {
    backgroundColor: '#C0C0C0', // Silver
  },
  rank3: {
    backgroundColor: '#CD7F32', // Bronze
  },
  rank: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
    fontWeight: '600',
  },
  rankTop3: {
    color: '#000000',
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
  },
  teamInfo: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 1,
  },
  statValue: {
    ...Typography.displaySmall,
    color: DesignTokens.textPrimary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
