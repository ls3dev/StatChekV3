import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface AdvancedStats {
  season?: string;
  per?: number;
  ts_pct?: number;
  efg_pct?: number;
  usg_pct?: number;
  ows?: number;
  dws?: number;
  ws?: number;
  obpm?: number;
  dbpm?: number;
  bpm?: number;
  vorp?: number;
  ast_pct?: number;
  tov_pct?: number;
  orb_pct?: number;
  drb_pct?: number;
  trb_pct?: number;
  stl_pct?: number;
  blk_pct?: number;
}

interface AdvancedStatsSectionProps {
  stats: AdvancedStats | null;
  isLoading?: boolean;
}

const formatPct = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return (value * 100).toFixed(1);
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return value.toFixed(1);
};

const formatRating = (value?: number) => {
  if (value === undefined || value === null) return '-';
  const prefix = value > 0 ? '+' : '';
  return prefix + value.toFixed(1);
};

function GridStat({
  label,
  value,
  isPositive,
  isNegative,
  isDark,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
  isNegative?: boolean;
  isDark: boolean;
}) {
  return (
    <View style={styles.gridStat}>
      <Text
        style={[
          styles.gridValue,
          isDark && styles.textDark,
          isPositive && styles.positiveValue,
          isNegative && styles.negativeValue,
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.gridLabel, isDark && styles.textSecondary]}>{label}</Text>
    </View>
  );
}

export function AdvancedStatsSection({
  stats,
  isLoading = false,
}: AdvancedStatsSectionProps) {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, isDark && styles.textSecondary]}>
          Loading advanced stats...
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={32} color={DesignTokens.textMuted} />
        <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
          Advanced stats not available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Efficiency */}
      <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>EFFICIENCY</Text>
      <View style={styles.gridRow}>
        <GridStat label="PER" value={formatNumber(stats.per)} isDark={isDark} />
        <GridStat label="TS%" value={formatPct(stats.ts_pct)} isDark={isDark} />
        <GridStat label="USG%" value={formatNumber(stats.usg_pct)} isDark={isDark} />
      </View>

      {/* Win Shares */}
      <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>WIN SHARES</Text>
      <View style={styles.gridRow}>
        <GridStat label="WS" value={formatNumber(stats.ws)} isDark={isDark} />
        <GridStat label="OWS" value={formatNumber(stats.ows)} isDark={isDark} />
        <GridStat label="DWS" value={formatNumber(stats.dws)} isDark={isDark} />
      </View>

      {/* Box Plus/Minus */}
      <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>BOX PLUS/MINUS</Text>
      <View style={styles.gridRow}>
        <GridStat
          label="BPM"
          value={formatRating(stats.bpm)}
          isPositive={(stats.bpm ?? 0) > 0}
          isNegative={(stats.bpm ?? 0) < 0}
          isDark={isDark}
        />
        <GridStat
          label="OBPM"
          value={formatRating(stats.obpm)}
          isPositive={(stats.obpm ?? 0) > 0}
          isNegative={(stats.obpm ?? 0) < 0}
          isDark={isDark}
        />
        <GridStat
          label="DBPM"
          value={formatRating(stats.dbpm)}
          isPositive={(stats.dbpm ?? 0) > 0}
          isNegative={(stats.dbpm ?? 0) < 0}
          isDark={isDark}
        />
        <GridStat label="VORP" value={formatNumber(stats.vorp)} isDark={isDark} />
      </View>

      {/* Rates */}
      <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>RATES</Text>
      <View style={styles.gridRow}>
        <GridStat label="AST%" value={formatNumber(stats.ast_pct)} isDark={isDark} />
        <GridStat label="TOV%" value={formatNumber(stats.tov_pct)} isDark={isDark} />
        <GridStat label="TRB%" value={formatNumber(stats.trb_pct)} isDark={isDark} />
      </View>

      {/* Defense */}
      <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>DEFENSE</Text>
      <View style={styles.gridRow}>
        <GridStat label="STL%" value={formatNumber(stats.stl_pct)} isDark={isDark} />
        <GridStat label="BLK%" value={formatNumber(stats.blk_pct)} isDark={isDark} />
        <GridStat label="ORB%" value={formatNumber(stats.orb_pct)} isDark={isDark} />
        <GridStat label="DRB%" value={formatNumber(stats.drb_pct)} isDark={isDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignTokens.textSecondary,
    letterSpacing: 0.8,
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: DesignTokens.spacing.sm,
  },
  gridStat: {
    alignItems: 'center',
    minWidth: 56,
  },
  gridValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  gridLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 2,
  },
  positiveValue: {
    color: DesignTokens.accentSuccess,
  },
  negativeValue: {
    color: DesignTokens.accentError,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
