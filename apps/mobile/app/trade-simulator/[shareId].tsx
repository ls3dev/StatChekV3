import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAction } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { DesignTokens, Typography } from '@/constants/theme';
import { NBA_TEAMS } from '@/constants/nbaTeams';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@statcheck/convex';

type TeamResult = {
  teamId: number;
  payrollBefore: number;
  payrollAfter: number;
  delta: number;
  rosterBefore: number;
  rosterAfter: number;
};

type SimulationResult = {
  isValid: boolean;
  reasons: string[];
  season: number;
  teamA: TeamResult;
  teamB: TeamResult;
};

type SharedScenario = {
  shareId: string;
  result: SimulationResult;
  createdAt: number;
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export default function SharedTradeScenarioScreen() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>();
  const { isDark } = useTheme();

  const getTradeScenarioByShareId = useAction(api.tradeSimulator.getTradeScenarioByShareId);

  const [scenario, setScenario] = useState<SharedScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shareId) return;
      try {
        const response = (await getTradeScenarioByShareId({ shareId })) as SharedScenario | null;
        setScenario(response);
      } catch (error) {
        console.error('Failed loading shared trade scenario', error);
        setScenario(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shareId, getTradeScenarioByShareId]);

  return (
    <>
      <Stack.Screen options={{ title: 'Shared Trade' }} />
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary },
        ]}
        contentContainerStyle={styles.content}
      >
        {isLoading ? (
          <ActivityIndicator color={DesignTokens.accentGreen} />
        ) : !scenario ? (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.title, isDark && styles.textDark]}>Trade scenario not found</Text>
            <Text style={[styles.body, isDark && styles.textSecondary]}>
              This link may be invalid, private, or expired.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.headerRow}>
              <Ionicons
                name={scenario.result.isValid ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={scenario.result.isValid ? DesignTokens.accentSuccess : DesignTokens.accentError}
              />
              <Text style={[styles.title, isDark && styles.textDark]}>
                {scenario.result.isValid ? 'Valid trade' : 'Invalid trade'}
              </Text>
            </View>

            <Text style={[styles.body, isDark && styles.textSecondary]}>
              Season: {scenario.result.season}
            </Text>

            {scenario.result.reasons.length > 0 && (
              <View style={styles.reasonList}>
                {scenario.result.reasons.map((reason, index) => (
                  <Text key={`${reason}-${index}`} style={[styles.body, isDark && styles.textSecondary]}>
                    • {reason}
                  </Text>
                ))}
              </View>
            )}

            {[scenario.result.teamA, scenario.result.teamB].map((team) => {
              const info = NBA_TEAMS[team.teamId];
              const label = info ? `${info.city} ${info.name}` : `Team ${team.teamId}`;
              return (
                <View key={team.teamId} style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                  <Text style={[styles.summaryTitle, isDark && styles.textDark]}>{label}</Text>
                  <Text style={[styles.body, isDark && styles.textSecondary]}>
                    Payroll: {formatCurrency(team.payrollBefore)} → {formatCurrency(team.payrollAfter)}
                  </Text>
                  <Text style={[styles.body, isDark && styles.textSecondary]}>
                    Delta: {formatCurrency(team.delta)}
                  </Text>
                  <Text style={[styles.body, isDark && styles.textSecondary]}>
                    Roster: {team.rosterBefore} → {team.rosterAfter}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: DesignTokens.spacing.md },
  card: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  cardDark: { backgroundColor: DesignTokens.cardBackgroundDark },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignTokens.spacing.xs },
  title: { ...Typography.headline, color: DesignTokens.textPrimary },
  body: { ...Typography.bodySmall, color: DesignTokens.textSecondary },
  reasonList: { gap: 4 },
  summaryCard: {
    marginTop: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    padding: DesignTokens.spacing.sm,
    gap: 2,
  },
  summaryCardDark: { borderColor: DesignTokens.borderDark },
  summaryTitle: { ...Typography.body, color: DesignTokens.textPrimary, fontWeight: '700' },
  textDark: { color: DesignTokens.textPrimaryDark },
  textSecondary: { color: DesignTokens.textSecondaryDark },
});
