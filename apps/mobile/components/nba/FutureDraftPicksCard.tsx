import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface FuturePick {
  year: number;
  round: number;
  originalTeam: string;
  conditions?: string;
  swapRights?: boolean;
  viaTradeWith?: string;
}

interface FutureDraftPicksCardProps {
  picks: FuturePick[];
  teamAbbreviation: string;
  lastUpdated: number | null;
  isLoading?: boolean;
}

export function FutureDraftPicksCard({
  picks,
  teamAbbreviation,
  lastUpdated,
  isLoading = false,
}: FutureDraftPicksCardProps) {
  const { isDark } = useTheme();

  // Group picks by year
  const picksByYear = useMemo(() => {
    const grouped: Record<number, FuturePick[]> = {};
    picks.forEach((pick) => {
      if (!grouped[pick.year]) {
        grouped[pick.year] = [];
      }
      grouped[pick.year].push(pick);
    });
    // Sort years ascending (2025, 2026, etc.)
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, yearPicks]) => ({
        year: Number(year),
        picks: yearPicks.sort((a, b) => a.round - b.round),
      }));
  }, [picks]);

  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={18} color={DesignTokens.accentGreen} />
          </View>
          <Text style={[styles.headerText, isDark && styles.textDark]}>Future Draft Picks</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
        </View>
      </View>
    );
  }

  if (picks.length === 0) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={18} color={DesignTokens.accentGreen} />
          </View>
          <Text style={[styles.headerText, isDark && styles.textDark]}>Future Draft Picks</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={32} color={DesignTokens.textMuted} />
          <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
            No future draft pick data available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={18} color={DesignTokens.accentGreen} />
        </View>
        <Text style={[styles.headerText, isDark && styles.textDark]}>Future Draft Picks</Text>
      </View>

      {/* Picks by year */}
      <View style={styles.content}>
        {picksByYear.map(({ year, picks: yearPicks }) => (
          <View key={year} style={styles.yearSection}>
            <View style={[styles.yearHeader, isDark && styles.yearHeaderDark]}>
              <Text style={[styles.yearText, isDark && styles.textDark]}>{year}</Text>
              <Text style={[styles.pickCount, isDark && styles.textSecondary]}>
                {yearPicks.length} pick{yearPicks.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {yearPicks.map((pick, index) => (
              <View
                key={`${pick.year}-${pick.round}-${index}`}
                style={[styles.pickRow, isDark && styles.pickRowDark]}
              >
                <View style={styles.roundBadge}>
                  <Text style={styles.roundText}>R{pick.round}</Text>
                </View>
                <View style={styles.pickDetails}>
                  <View style={styles.pickMainInfo}>
                    {pick.swapRights ? (
                      <View style={styles.swapContainer}>
                        <Ionicons
                          name="swap-horizontal"
                          size={14}
                          color={DesignTokens.accentWarning}
                        />
                        <Text style={[styles.swapText, isDark && styles.textDark]}>
                          Swap rights with {pick.originalTeam}
                        </Text>
                      </View>
                    ) : pick.originalTeam === teamAbbreviation ? (
                      <Text style={[styles.ownPickText, isDark && styles.textDark]}>Own pick</Text>
                    ) : (
                      <Text style={[styles.tradePickText, isDark && styles.textDark]}>
                        {pick.originalTeam}'s pick
                        {pick.viaTradeWith ? ` (via ${pick.viaTradeWith})` : ''}
                      </Text>
                    )}
                  </View>
                  {pick.conditions && (
                    <View style={styles.conditionsContainer}>
                      <Ionicons
                        name="shield-outline"
                        size={12}
                        color={isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary}
                      />
                      <Text style={[styles.conditionsText, isDark && styles.textSecondary]}>
                        {pick.conditions}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Last Updated Footer */}
      {lastUpdated && (
        <View style={[styles.footer, isDark && styles.footerDark]}>
          <Ionicons
            name="time-outline"
            size={12}
            color={isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary}
          />
          <Text style={[styles.footerText, isDark && styles.textSecondary]}>
            Updated {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
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
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
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
  content: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.sm,
  },
  yearSection: {
    marginBottom: DesignTokens.spacing.xs,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: DesignTokens.radius.sm,
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  yearHeaderDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  yearText: {
    ...Typography.label,
    color: DesignTokens.textPrimary,
    fontWeight: '700',
  },
  pickCount: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: DesignTokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  pickRowDark: {
    borderBottomColor: DesignTokens.borderDark,
  },
  roundBadge: {
    width: 36,
    height: 24,
    backgroundColor: DesignTokens.accentGreen,
    borderRadius: DesignTokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.sm,
  },
  roundText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickDetails: {
    flex: 1,
  },
  pickMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownPickText: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
  },
  tradePickText: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  swapText: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
  },
  conditionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  conditionsText: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DesignTokens.border,
    gap: DesignTokens.spacing.xs,
  },
  footerDark: {
    borderTopColor: DesignTokens.borderDark,
  },
  footerText: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
