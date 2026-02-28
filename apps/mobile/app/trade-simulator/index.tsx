import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAction, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { DesignTokens, Typography } from '@/constants/theme';
import { NBA_TEAMS, NBA_TEAM_LIST } from '@/constants/nbaTeams';
import { useTheme } from '@/context/ThemeContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useListsContext } from '@/context/ListsContext';
import { api } from '@statcheck/convex';

type Contract = {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  season: number;
  amount: number;
};

type TeamResult = {
  teamId: number;
  payrollBefore: number;
  payrollAfter: number;
  delta: number;
  rosterBefore: number;
  rosterAfter: number;
  salaryIn: number;
  salaryOut: number;
};

type SimulationResult = {
  isValid: boolean;
  requiresPro: boolean;
  reasons: string[];
  season: number;
  teamA: TeamResult;
  teamB: TeamResult;
};

const SHARE_BASE_URL = 'https://statcheck.app/trade';

function getCurrentNBASeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 10 ? year : year - 1;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function currentSeasonSalaries(contracts: Contract[], season: number) {
  const map = new Map<number, { id: number; name: string; position: string; amount: number }>();
  for (const contract of contracts) {
    if (contract.season !== season) continue;
    const existing = map.get(contract.player.id);
    const name = `${contract.player.first_name} ${contract.player.last_name}`;
    if (!existing || contract.amount > existing.amount) {
      map.set(contract.player.id, {
        id: contract.player.id,
        name,
        position: contract.player.position || 'N/A',
        amount: contract.amount,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export default function TradeSimulatorScreen() {
  const { fromTeamId } = useLocalSearchParams<{ fromTeamId?: string }>();
  const { isDark } = useTheme();
  const { isProUser } = useRevenueCat();
  const { setShowPaywall } = useListsContext();

  const teamAId = useMemo(() => {
    const parsed = Number(fromTeamId);
    return Number.isFinite(parsed) && NBA_TEAMS[parsed] ? parsed : 1;
  }, [fromTeamId]);

  const [teamBId, setTeamBId] = useState(() => (teamAId === 2 ? 1 : 2));
  const [teamAOutgoing, setTeamAOutgoing] = useState<number[]>([]);
  const [teamBOutgoing, setTeamBOutgoing] = useState<number[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const simulateTrade = useAction(api.tradeSimulator.simulateTrade);
  const createTradeScenarioShare = useMutation(api.tradeSimulator.createTradeScenarioShare);

  const season = getCurrentNBASeason();

  const teamContractsAction = useAction(api.nba.getTeamContracts);

  const [teamAData, setTeamAData] = useState<Contract[]>([]);
  const [teamBData, setTeamBData] = useState<Contract[]>([]);

  const loadContracts = useCallback(async () => {
    if (!isProUser) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      const [a, b] = await Promise.all([
        teamContractsAction({ teamId: teamAId }),
        teamContractsAction({ teamId: teamBId }),
      ]);

      if (a.requiresPro || b.requiresPro) {
        setShowPaywall(true);
        setIsLoading(false);
        return;
      }

      setTeamAData((a.contracts ?? []) as Contract[]);
      setTeamBData((b.contracts ?? []) as Contract[]);
    } catch (error) {
      console.error('Failed loading contracts', error);
      Alert.alert('Error', 'Failed to load team contracts.');
    } finally {
      setIsLoading(false);
    }
  }, [isProUser, setShowPaywall, teamContractsAction, teamAId, teamBId]);

  React.useEffect(() => {
    setTeamAOutgoing([]);
    setTeamBOutgoing([]);
    setResult(null);
    loadContracts();
  }, [teamAId, teamBId, loadContracts]);

  const teamAPlayers = useMemo(() => currentSeasonSalaries(teamAData, season), [teamAData, season]);
  const teamBPlayers = useMemo(() => currentSeasonSalaries(teamBData, season), [teamBData, season]);

  const toggleOutgoing = (team: 'A' | 'B', playerId: number) => {
    if (team === 'A') {
      setTeamAOutgoing((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    } else {
      setTeamBOutgoing((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const validateTrade = async () => {
    if (!isProUser) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      const simulation = (await simulateTrade({
        teamA: { teamId: teamAId, outgoingPlayerIds: teamAOutgoing },
        teamB: { teamId: teamBId, outgoingPlayerIds: teamBOutgoing },
        season,
      })) as SimulationResult;

      if (simulation.requiresPro) {
        setShowPaywall(true);
      }

      setResult(simulation);
    } catch (error) {
      console.error('Trade simulation failed', error);
      Alert.alert('Error', 'Could not validate this trade.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareScenario = async () => {
    if (!result) return;

    setIsSharing(true);
    try {
      const { shareId } = await createTradeScenarioShare({
        request: {
          teamA: { teamId: teamAId, outgoingPlayerIds: teamAOutgoing },
          teamB: { teamId: teamBId, outgoingPlayerIds: teamBOutgoing },
          season,
        },
        result,
      });

      const shareUrl = `${SHARE_BASE_URL}/${shareId}`;

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert('Copied', 'Trade share link copied to clipboard.');
      } else {
        await Share.share({
          title: 'StatCheck Trade Simulation',
          message: `Check out this NBA trade simulation\n${shareUrl}`,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error('Sharing trade failed', error);
      Alert.alert('Error', 'Could not create a share link.');
    } finally {
      setIsSharing(false);
    }
  };

  const teamAInfo = NBA_TEAMS[teamAId];
  const teamBInfo = NBA_TEAMS[teamBId];

  return (
    <>
      <Stack.Screen options={{ title: 'Trade Simulator' }} />
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary },
        ]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Counterpart Team</Text>
          <View style={styles.teamPickerWrap}>
            {NBA_TEAM_LIST.filter((team) => team.id !== teamAId).map((team) => {
              const isSelected = team.id === teamBId;
              return (
                <Pressable
                  key={team.id}
                  style={[
                    styles.teamChip,
                    isSelected && styles.teamChipSelected,
                    isDark && !isSelected && styles.teamChipDark,
                  ]}
                  onPress={() => setTeamBId(team.id)}
                >
                  <Text
                    style={[
                      styles.teamChipText,
                      isSelected && styles.teamChipTextSelected,
                      isDark && !isSelected && styles.textDark,
                    ]}
                  >
                    {team.abbreviation}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            {teamAInfo.city} {teamAInfo.name} outgoing
          </Text>
          {isLoading ? (
            <ActivityIndicator color={DesignTokens.accentPurple} />
          ) : (
            teamAPlayers.map((player) => {
              const selected = teamAOutgoing.includes(player.id);
              return (
                <Pressable
                  key={player.id}
                  style={[styles.playerRow, isDark && styles.playerRowDark, selected && styles.playerRowSelected]}
                  onPress={() => toggleOutgoing('A', player.id)}
                >
                  <View style={styles.playerMeta}>
                    <Text style={[styles.playerName, isDark && styles.textDark]}>{player.name}</Text>
                    <Text style={[styles.playerSub, isDark && styles.textSecondary]}>{player.position}</Text>
                  </View>
                  <Text style={[styles.playerSalary, isDark && styles.textDark]}>{formatCurrency(player.amount)}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            {teamBInfo.city} {teamBInfo.name} outgoing
          </Text>
          {isLoading ? (
            <ActivityIndicator color={DesignTokens.accentPurple} />
          ) : (
            teamBPlayers.map((player) => {
              const selected = teamBOutgoing.includes(player.id);
              return (
                <Pressable
                  key={player.id}
                  style={[styles.playerRow, isDark && styles.playerRowDark, selected && styles.playerRowSelected]}
                  onPress={() => toggleOutgoing('B', player.id)}
                >
                  <View style={styles.playerMeta}>
                    <Text style={[styles.playerName, isDark && styles.textDark]}>{player.name}</Text>
                    <Text style={[styles.playerSub, isDark && styles.textSecondary]}>{player.position}</Text>
                  </View>
                  <Text style={[styles.playerSalary, isDark && styles.textDark]}>{formatCurrency(player.amount)}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Pressable style={styles.validateButton} onPress={validateTrade}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.validateButtonText}>{isLoading ? 'Validating...' : 'Validate Trade'}</Text>
        </Pressable>

        {result && (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={result.isValid ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={result.isValid ? DesignTokens.accentSuccess : DesignTokens.accentError}
              />
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                {result.isValid ? 'Trade Valid' : 'Trade Invalid'}
              </Text>
            </View>

            {result.reasons.length > 0 && (
              <View style={styles.reasonList}>
                {result.reasons.map((reason, index) => (
                  <Text key={`${reason}-${index}`} style={[styles.reasonText, isDark && styles.textSecondary]}>
                    • {reason}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                <Text style={[styles.summaryTitle, isDark && styles.textDark]}>{teamAInfo.abbreviation}</Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Payroll: {formatCurrency(result.teamA.payrollBefore)} → {formatCurrency(result.teamA.payrollAfter)}
                </Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Delta: {formatCurrency(result.teamA.delta)}
                </Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Roster: {result.teamA.rosterBefore} → {result.teamA.rosterAfter}
                </Text>
              </View>

              <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                <Text style={[styles.summaryTitle, isDark && styles.textDark]}>{teamBInfo.abbreviation}</Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Payroll: {formatCurrency(result.teamB.payrollBefore)} → {formatCurrency(result.teamB.payrollAfter)}
                </Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Delta: {formatCurrency(result.teamB.delta)}
                </Text>
                <Text style={[styles.summaryText, isDark && styles.textSecondary]}>
                  Roster: {result.teamB.rosterBefore} → {result.teamB.rosterAfter}
                </Text>
              </View>
            </View>

            <Pressable style={styles.shareButton} onPress={shareScenario}>
              <Ionicons name="share-social" size={16} color="#fff" />
              <Text style={styles.shareButtonText}>{isSharing ? 'Sharing...' : 'Create Share Link'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: DesignTokens.spacing.md, gap: DesignTokens.spacing.md, paddingBottom: 48 },
  card: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  cardDark: { backgroundColor: DesignTokens.cardBackgroundDark },
  sectionTitle: { ...Typography.headline, color: DesignTokens.textPrimary },
  teamPickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignTokens.spacing.xs },
  teamChip: {
    borderRadius: DesignTokens.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
  },
  teamChipDark: { borderColor: DesignTokens.borderDark },
  teamChipSelected: {
    backgroundColor: DesignTokens.accentPurple,
    borderColor: DesignTokens.accentPurple,
  },
  teamChipText: { ...Typography.caption, color: DesignTokens.textPrimary },
  teamChipTextSelected: { color: '#fff', fontWeight: '700' },
  playerRow: {
    borderRadius: DesignTokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    padding: DesignTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerRowDark: { borderColor: DesignTokens.borderDark },
  playerRowSelected: {
    borderColor: DesignTokens.accentPurple,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  playerMeta: { flex: 1, paddingRight: 8 },
  playerName: { ...Typography.body, color: DesignTokens.textPrimary },
  playerSub: { ...Typography.captionSmall, color: DesignTokens.textSecondary },
  playerSalary: { ...Typography.caption, color: DesignTokens.textPrimary, fontWeight: '700' },
  validateButton: {
    backgroundColor: DesignTokens.accentPurple,
    borderRadius: DesignTokens.radius.md,
    paddingVertical: DesignTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
  },
  validateButtonText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignTokens.spacing.xs },
  reasonList: { gap: 4 },
  reasonText: { ...Typography.caption, color: DesignTokens.textSecondary },
  summaryGrid: { gap: DesignTokens.spacing.sm },
  summaryCard: {
    borderRadius: DesignTokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    padding: DesignTokens.spacing.sm,
    gap: 2,
  },
  summaryCardDark: { borderColor: DesignTokens.borderDark },
  summaryTitle: { ...Typography.body, color: DesignTokens.textPrimary, fontWeight: '700' },
  summaryText: { ...Typography.caption, color: DesignTokens.textSecondary },
  shareButton: {
    marginTop: DesignTokens.spacing.sm,
    backgroundColor: '#4B5563',
    borderRadius: DesignTokens.radius.md,
    paddingVertical: DesignTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
  },
  shareButtonText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  textDark: { color: DesignTokens.textPrimaryDark },
  textSecondary: { color: DesignTokens.textSecondaryDark },
});
