import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

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
  per: number;
  ts_pct: number;
  usg_pct: number;
  net_rating: number;
  off_rating: number;
  def_rating: number;
}

interface PlayerStatsCardProps {
  basicStats?: BasicStats | null;
  advancedStats?: AdvancedStats | null;
  season?: number;
  isLoading?: boolean;
  isProUser?: boolean;
  onUnlockPress?: () => void;
}

interface StatItemProps {
  label: string;
  value: string | number;
  isPrimary?: boolean;
  isDark: boolean;
}

function StatItem({ label, value, isPrimary = false, isDark }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, isPrimary && styles.primaryStat, isDark && styles.textDark]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, isDark && styles.textSecondary]}>{label}</Text>
    </View>
  );
}

export function PlayerStatsCard({
  basicStats,
  advancedStats,
  season,
  isLoading = false,
  isProUser = false,
  onUnlockPress,
}: PlayerStatsCardProps) {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.textSecondary]}>
            Loading stats...
          </Text>
        </View>
      </View>
    );
  }

  if (!basicStats) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="stats-chart-outline"
            size={32}
            color={DesignTokens.textMuted}
          />
          <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
            No stats available
          </Text>
        </View>
      </View>
    );
  }

  const formatPct = (pct: number) => (pct * 100).toFixed(1) + '%';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="stats-chart" size={18} color={DesignTokens.accentPurple} />
        </View>
        <Text style={[styles.headerText, isDark && styles.textDark]}>
          {season ? `${season}-${(season + 1).toString().slice(-2)} ` : ''}Season Stats
        </Text>
        <Text style={[styles.gamesPlayed, isDark && styles.textSecondary]}>
          {basicStats.games_played} GP
        </Text>
      </View>

      {/* Primary Stats */}
      <View style={styles.primaryStatsRow}>
        <StatItem label="PPG" value={basicStats.pts.toFixed(1)} isPrimary isDark={isDark} />
        <StatItem label="RPG" value={basicStats.reb.toFixed(1)} isPrimary isDark={isDark} />
        <StatItem label="APG" value={basicStats.ast.toFixed(1)} isPrimary isDark={isDark} />
        <StatItem label="MPG" value={parseFloat(basicStats.min).toFixed(1)} isPrimary isDark={isDark} />
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStatsRow}>
        <StatItem label="STL" value={basicStats.stl.toFixed(1)} isDark={isDark} />
        <StatItem label="BLK" value={basicStats.blk.toFixed(1)} isDark={isDark} />
        <StatItem label="TOV" value={basicStats.turnover.toFixed(1)} isDark={isDark} />
      </View>

      {/* Shooting Stats */}
      <View style={[styles.shootingSection, isDark && styles.shootingSectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>Shooting</Text>
        <View style={styles.shootingRow}>
          <View style={styles.shootingStat}>
            <Text style={[styles.shootingValue, isDark && styles.textDark]}>
              {formatPct(basicStats.fg_pct)}
            </Text>
            <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>FG%</Text>
          </View>
          <View style={styles.shootingStat}>
            <Text style={[styles.shootingValue, isDark && styles.textDark]}>
              {formatPct(basicStats.fg3_pct)}
            </Text>
            <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>3P%</Text>
          </View>
          <View style={styles.shootingStat}>
            <Text style={[styles.shootingValue, isDark && styles.textDark]}>
              {formatPct(basicStats.ft_pct)}
            </Text>
            <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>FT%</Text>
          </View>
        </View>
      </View>

      {/* Advanced Stats Section */}
      {isProUser && advancedStats ? (
        <View style={styles.advancedSection}>
          <View style={styles.advancedHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>Advanced</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
          <View style={styles.advancedRow}>
            <View style={styles.advancedStat}>
              <Text style={[styles.advancedValue, isDark && styles.textDark]}>
                {advancedStats.per.toFixed(1)}
              </Text>
              <Text style={[styles.advancedLabel, isDark && styles.textSecondary]}>PER</Text>
            </View>
            <View style={styles.advancedStat}>
              <Text style={[styles.advancedValue, isDark && styles.textDark]}>
                {formatPct(advancedStats.ts_pct)}
              </Text>
              <Text style={[styles.advancedLabel, isDark && styles.textSecondary]}>TS%</Text>
            </View>
            <View style={styles.advancedStat}>
              <Text style={[styles.advancedValue, isDark && styles.textDark]}>
                {formatPct(advancedStats.usg_pct)}
              </Text>
              <Text style={[styles.advancedLabel, isDark && styles.textSecondary]}>USG%</Text>
            </View>
            <View style={styles.advancedStat}>
              <Text
                style={[
                  styles.advancedValue,
                  isDark && styles.textDark,
                  advancedStats.net_rating > 0 && styles.positiveRating,
                  advancedStats.net_rating < 0 && styles.negativeRating,
                ]}
              >
                {advancedStats.net_rating > 0 ? '+' : ''}
                {advancedStats.net_rating.toFixed(1)}
              </Text>
              <Text style={[styles.advancedLabel, isDark && styles.textSecondary]}>NET RTG</Text>
            </View>
          </View>
        </View>
      ) : (
        <Pressable style={styles.lockedSection} onPress={onUnlockPress}>
          <View style={styles.lockedContent}>
            <Ionicons name="lock-closed" size={16} color={DesignTokens.accentPurple} />
            <Text style={[styles.lockedText, isDark && styles.textSecondary]}>
              Advanced stats (PER, TS%, USG%)
            </Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
    ...DesignTokens.shadow.sm,
  },
  containerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
    marginTop: DesignTokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  headerIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  headerText: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    flex: 1,
  },
  gamesPlayed: {
    ...Typography.caption,
    color: DesignTokens.textSecondary,
  },
  primaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  primaryStat: {
    ...Typography.displaySmall,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 2,
  },
  shootingSection: {
    padding: DesignTokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  shootingSectionDark: {
    borderBottomColor: DesignTokens.borderDark,
  },
  sectionTitle: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  shootingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shootingStat: {
    alignItems: 'center',
  },
  shootingValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  shootingLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 2,
  },
  advancedSection: {
    padding: DesignTokens.spacing.md,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  advancedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  advancedStat: {
    alignItems: 'center',
  },
  advancedValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  advancedLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 2,
  },
  positiveRating: {
    color: DesignTokens.accentSuccess,
  },
  negativeRating: {
    color: DesignTokens.accentError,
  },
  lockedSection: {
    padding: DesignTokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DesignTokens.border,
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    opacity: 0.7,
  },
  lockedText: {
    ...Typography.bodySmall,
    color: DesignTokens.textSecondary,
    flex: 1,
  },
  proBadge: {
    backgroundColor: DesignTokens.accentPurple,
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  proBadgeText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 9,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
