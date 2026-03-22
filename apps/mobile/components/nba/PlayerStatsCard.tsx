import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { AdvancedStatsSection, type AdvancedStats as FullAdvancedStats } from './AdvancedStatsSection';

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
  fgm?: number;
  fga?: number;
  fg3m?: number;
  fg3a?: number;
  fta?: number;
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
  onAdvancedPress?: () => void;
  isAdvancedExpanded?: boolean;
  fullAdvancedStats?: FullAdvancedStats | null;
  isAdvancedLoading?: boolean;
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

function StatsToggle({
  isAdvanced,
  isProUser,
  onPress,
  isDark,
}: {
  isAdvanced: boolean;
  isProUser: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
      <Pressable
        style={[styles.toggleSegment, !isAdvanced && styles.toggleSegmentActive]}
        onPress={() => isAdvanced && onPress()}
      >
        <Text
          style={[
            styles.toggleText,
            isDark && styles.textSecondary,
            !isAdvanced && styles.toggleTextActive,
          ]}
        >
          Basic
        </Text>
      </Pressable>
      <Pressable
        style={[styles.toggleSegment, isAdvanced && styles.toggleSegmentActive]}
        onPress={() => !isAdvanced && onPress()}
      >
        <Text
          style={[
            styles.toggleText,
            isDark && styles.textSecondary,
            isAdvanced && styles.toggleTextActive,
          ]}
        >
          Adv
        </Text>
        {!isProUser && (
          <Ionicons
            name="lock-closed"
            size={10}
            color={isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary}
            style={{ marginLeft: 3 }}
          />
        )}
      </Pressable>
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
  onAdvancedPress,
  isAdvancedExpanded = false,
  fullAdvancedStats,
  isAdvancedLoading = false,
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

  const formatPct = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return '-';
    return (pct * 100).toFixed(1) + '%';
  };

  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(1);
  };

  const formatMin = (min: string | undefined) => {
    if (!min) return '-';
    const parts = min.split(':');
    return parts[0] || '-';
  };

  const handleTogglePress = () => {
    if (!isProUser && !isAdvancedExpanded) {
      onUnlockPress?.();
    } else {
      onAdvancedPress?.();
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="stats-chart" size={18} color={DesignTokens.accentGreen} />
        </View>
        <Text style={[styles.headerText, isDark && styles.textDark]}>
          {season ? `${season}-${(season + 1).toString().slice(-2)} ` : ''}Season Stats
        </Text>
        <Text style={[styles.gamesPlayed, isDark && styles.textSecondary]}>
          {basicStats.games_played ?? 0} GP
        </Text>
        <StatsToggle
          isAdvanced={isAdvancedExpanded}
          isProUser={isProUser}
          onPress={handleTogglePress}
          isDark={isDark}
        />
      </View>

      {/* Conditional: Basic OR Advanced */}
      {!isAdvancedExpanded ? (
        <Animated.View key="basic" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {/* Primary Stats */}
          <View style={styles.primaryStatsRow}>
            <StatItem label="PPG" value={formatStat(basicStats.pts)} isPrimary isDark={isDark} />
            <StatItem label="RPG" value={formatStat(basicStats.reb)} isPrimary isDark={isDark} />
            <StatItem label="APG" value={formatStat(basicStats.ast)} isPrimary isDark={isDark} />
            <StatItem label="MPG" value={formatMin(basicStats.min)} isPrimary isDark={isDark} />
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStatsRow}>
            <StatItem label="STL" value={formatStat(basicStats.stl)} isDark={isDark} />
            <StatItem label="BLK" value={formatStat(basicStats.blk)} isDark={isDark} />
            <StatItem label="TOV" value={formatStat(basicStats.turnover)} isDark={isDark} />
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
            {(basicStats.fgm !== undefined || basicStats.fg3m !== undefined || basicStats.fta !== undefined) && (
              <View style={[styles.shootingRow, styles.shootingVolumeRow]}>
                <View style={styles.shootingStat}>
                  <Text style={[styles.shootingVolumeValue, isDark && styles.textSecondary]}>
                    {basicStats.fgm !== undefined && basicStats.fga !== undefined
                      ? `${formatStat(basicStats.fgm)} / ${formatStat(basicStats.fga)}`
                      : '-'}
                  </Text>
                  <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>FGM / FGA</Text>
                </View>
                <View style={styles.shootingStat}>
                  <Text style={[styles.shootingVolumeValue, isDark && styles.textSecondary]}>
                    {basicStats.fg3m !== undefined && basicStats.fg3a !== undefined
                      ? `${formatStat(basicStats.fg3m)} / ${formatStat(basicStats.fg3a)}`
                      : '-'}
                  </Text>
                  <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>3PM / 3PA</Text>
                </View>
                <View style={styles.shootingStat}>
                  <Text style={[styles.shootingVolumeValue, isDark && styles.textSecondary]}>
                    {basicStats.fta !== undefined ? formatStat(basicStats.fta) : '-'}
                  </Text>
                  <Text style={[styles.shootingLabel, isDark && styles.textSecondary]}>FTA</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="advanced" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <AdvancedStatsSection
            stats={fullAdvancedStats ?? null}
            isLoading={isAdvancedLoading}
          />
        </Animated.View>
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
    marginRight: DesignTokens.spacing.sm,
  },
  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.06)',
    borderRadius: DesignTokens.radius.sm,
    padding: 2,
  },
  toggleContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm - 1,
  },
  toggleSegmentActive: {
    backgroundColor: '#7C3AED',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignTokens.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  // Stats
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
  shootingVolumeRow: {
    marginTop: DesignTokens.spacing.sm,
    paddingTop: DesignTokens.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DesignTokens.border,
  },
  shootingVolumeValue: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
