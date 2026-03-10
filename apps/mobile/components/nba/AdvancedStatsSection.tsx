import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  isExpanded: boolean;
  stats: AdvancedStats | null;
  isLoading?: boolean;
}

const formatPct = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return (value * 100).toFixed(1) + '%';
};

const formatNumber = (value?: number, decimals = 1) => {
  if (value === undefined || value === null) return '-';
  return value.toFixed(decimals);
};

const formatRating = (value?: number) => {
  if (value === undefined || value === null) return '-';
  const prefix = value > 0 ? '+' : '';
  return prefix + value.toFixed(1);
};

function StatRow({
  label,
  value,
  description,
  isPositive,
  isNegative,
  isDark,
}: {
  label: string;
  value: string;
  description?: string;
  isPositive?: boolean;
  isNegative?: boolean;
  isDark: boolean;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statInfo}>
        <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{label}</Text>
        {description && (
          <Text style={[styles.statDescription, isDark && styles.statDescriptionDark]}>
            {description}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.statValueChip,
          isDark && styles.statValueChipDark,
          isPositive && styles.positiveChip,
          isNegative && styles.negativeChip,
        ]}
      >
        <Text
          style={[
            styles.statValue,
            isDark && styles.statValueDark,
            isPositive && styles.positiveValue,
            isNegative && styles.negativeValue,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
    </View>
  );
}

export function AdvancedStatsSection({
  isExpanded,
  stats,
  isLoading = false,
}: AdvancedStatsSectionProps) {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!isExpanded) {
      fadeAnim.setValue(0);
      translateYAnim.setValue(10);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, isExpanded, translateYAnim]);

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
        ]}
      >
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          Loading advanced stats...
        </Text>
      </Animated.View>
    );
  }

  if (!stats) {
    return (
      <Animated.View
        style={[
          styles.emptyContainer,
          { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
        ]}
      >
        <Ionicons name="stats-chart-outline" size={32} color={DesignTokens.textMuted} />
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          Advanced stats not available
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
      ]}
    >
      {/* Efficiency */}
      <SectionHeader title="Efficiency" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow
          label="PER"
          value={formatNumber(stats.per)}
          description="Player Efficiency Rating"
          isDark={isDark}
        />
        <StatRow
          label="TS%"
          value={formatPct(stats.ts_pct)}
          description="True Shooting % - accounts for FGs, 3Ps, and FTs"
          isDark={isDark}
        />
        <StatRow
          label="USG%"
          value={formatNumber(stats.usg_pct)}
          description="Usage Rate - % of team plays used"
          isDark={isDark}
        />
      </View>

      {/* Win Shares */}
      <SectionHeader title="Win Shares" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow label="WS" value={formatNumber(stats.ws)} description="Total Win Shares" isDark={isDark} />
        <StatRow label="OWS" value={formatNumber(stats.ows)} description="Offensive Win Shares" isDark={isDark} />
        <StatRow label="DWS" value={formatNumber(stats.dws)} description="Defensive Win Shares" isDark={isDark} />
      </View>

      {/* Box Plus/Minus */}
      <SectionHeader title="Box Plus/Minus" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow
          label="BPM"
          value={formatRating(stats.bpm)}
          description="Box Plus/Minus (points above average per 100 pos)"
          isPositive={(stats.bpm ?? 0) > 0}
          isNegative={(stats.bpm ?? 0) < 0}
          isDark={isDark}
        />
        <StatRow
          label="OBPM"
          value={formatRating(stats.obpm)}
          description="Offensive Box Plus/Minus"
          isPositive={(stats.obpm ?? 0) > 0}
          isNegative={(stats.obpm ?? 0) < 0}
          isDark={isDark}
        />
        <StatRow
          label="DBPM"
          value={formatRating(stats.dbpm)}
          description="Defensive Box Plus/Minus"
          isPositive={(stats.dbpm ?? 0) > 0}
          isNegative={(stats.dbpm ?? 0) < 0}
          isDark={isDark}
        />
        <StatRow label="VORP" value={formatNumber(stats.vorp)} description="Value Over Replacement Player" isDark={isDark} />
      </View>

      {/* Playmaking */}
      <SectionHeader title="Playmaking" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow
          label="AST%"
          value={formatNumber(stats.ast_pct)}
          description="% of teammate FGs assisted while on court"
          isDark={isDark}
        />
        <StatRow
          label="TOV%"
          value={formatNumber(stats.tov_pct)}
          description="Turnovers per 100 plays"
          isDark={isDark}
        />
      </View>

      {/* Rebounding */}
      <SectionHeader title="Rebounding" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow label="TRB%" value={formatNumber(stats.trb_pct)} description="Total Rebound %" isDark={isDark} />
        <StatRow label="ORB%" value={formatNumber(stats.orb_pct)} description="Offensive Rebound %" isDark={isDark} />
        <StatRow label="DRB%" value={formatNumber(stats.drb_pct)} description="Defensive Rebound %" isDark={isDark} />
      </View>

      {/* Defense */}
      <SectionHeader title="Defense" isDark={isDark} />
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <StatRow label="STL%" value={formatNumber(stats.stl_pct)} description="Steal %" isDark={isDark} />
        <StatRow label="BLK%" value={formatNumber(stats.blk_pct)} description="Block %" isDark={isDark} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: DesignTokens.spacing.sm,
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
  loadingTextDark: {
    color: DesignTokens.textSecondaryDark,
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
  emptyTextDark: {
    color: DesignTokens.textSecondaryDark,
  },
  sectionHeader: {
    paddingTop: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignTokens.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  sectionTitleDark: {
    color: DesignTokens.textSecondaryDark,
  },
  section: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 46, 0.06)',
    marginBottom: DesignTokens.spacing.sm,
  },
  sectionDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderColor: DesignTokens.borderDark,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: DesignTokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
    gap: DesignTokens.spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignTokens.textPrimary,
  },
  statLabelDark: {
    color: DesignTokens.textPrimaryDark,
  },
  statDescription: {
    fontSize: 13,
    color: DesignTokens.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statDescriptionDark: {
    color: DesignTokens.textSecondaryDark,
  },
  statValueChip: {
    minWidth: 72,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: 'rgba(26, 26, 46, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueChipDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statValueDark: {
    color: DesignTokens.textPrimaryDark,
  },
  positiveChip: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
  },
  negativeChip: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  positiveValue: {
    color: DesignTokens.accentSuccess,
  },
  negativeValue: {
    color: DesignTokens.accentError,
  },
});
