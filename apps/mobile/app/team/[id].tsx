import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAction, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { ContractCard, InjuryBadge, InjuryBadgeLocked } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useListsContext } from '@/context/ListsContext';
import { api } from '@statcheck/convex';

// NBA Team names mapping (since the API returns team IDs)
const TEAM_NAMES: Record<number, { name: string; city: string; abbreviation: string }> = {
  1: { name: 'Hawks', city: 'Atlanta', abbreviation: 'ATL' },
  2: { name: 'Celtics', city: 'Boston', abbreviation: 'BOS' },
  3: { name: 'Nets', city: 'Brooklyn', abbreviation: 'BKN' },
  4: { name: 'Hornets', city: 'Charlotte', abbreviation: 'CHA' },
  5: { name: 'Bulls', city: 'Chicago', abbreviation: 'CHI' },
  6: { name: 'Cavaliers', city: 'Cleveland', abbreviation: 'CLE' },
  7: { name: 'Mavericks', city: 'Dallas', abbreviation: 'DAL' },
  8: { name: 'Nuggets', city: 'Denver', abbreviation: 'DEN' },
  9: { name: 'Pistons', city: 'Detroit', abbreviation: 'DET' },
  10: { name: 'Warriors', city: 'Golden State', abbreviation: 'GSW' },
  11: { name: 'Rockets', city: 'Houston', abbreviation: 'HOU' },
  12: { name: 'Pacers', city: 'Indiana', abbreviation: 'IND' },
  13: { name: 'Clippers', city: 'LA', abbreviation: 'LAC' },
  14: { name: 'Lakers', city: 'Los Angeles', abbreviation: 'LAL' },
  15: { name: 'Grizzlies', city: 'Memphis', abbreviation: 'MEM' },
  16: { name: 'Heat', city: 'Miami', abbreviation: 'MIA' },
  17: { name: 'Bucks', city: 'Milwaukee', abbreviation: 'MIL' },
  18: { name: 'Timberwolves', city: 'Minnesota', abbreviation: 'MIN' },
  19: { name: 'Pelicans', city: 'New Orleans', abbreviation: 'NOP' },
  20: { name: 'Knicks', city: 'New York', abbreviation: 'NYK' },
  21: { name: 'Thunder', city: 'Oklahoma City', abbreviation: 'OKC' },
  22: { name: 'Magic', city: 'Orlando', abbreviation: 'ORL' },
  23: { name: '76ers', city: 'Philadelphia', abbreviation: 'PHI' },
  24: { name: 'Suns', city: 'Phoenix', abbreviation: 'PHX' },
  25: { name: 'Trail Blazers', city: 'Portland', abbreviation: 'POR' },
  26: { name: 'Kings', city: 'Sacramento', abbreviation: 'SAC' },
  27: { name: 'Spurs', city: 'San Antonio', abbreviation: 'SAS' },
  28: { name: 'Raptors', city: 'Toronto', abbreviation: 'TOR' },
  29: { name: 'Jazz', city: 'Utah', abbreviation: 'UTA' },
  30: { name: 'Wizards', city: 'Washington', abbreviation: 'WAS' },
};

interface Contract {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  season: number;
  amount: number;
  currency: string;
}

interface Injury {
  player: {
    id: number;
    first_name: string;
    last_name: string;
  };
  status: string;
  description: string;
  return_date: string | null;
}

interface DraftPick {
  playerId: number;
  firstName: string;
  lastName: string;
  position: string;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
  college: string | null;
  country: string | null;
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { isProUser } = useRevenueCat();
  const { setShowPaywall } = useListsContext();

  const teamId = parseInt(id || '0', 10);
  const teamInfo = TEAM_NAMES[teamId];

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(true);
  const [isLoadingDraftPicks, setIsLoadingDraftPicks] = useState(true);
  const [contractsRequiresPro, setContractsRequiresPro] = useState(false);
  const [injuriesRequiresPro, setInjuriesRequiresPro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getTeamContracts = useAction(api.nba.getTeamContracts);
  const getInjuries = useAction(api.nba.getInjuries);
  const getTeamDraftPicks = useAction(api.nba.getTeamDraftPicks);

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      setError(null);

      // Fetch contracts
      setIsLoadingContracts(true);
      try {
        const result = await getTeamContracts({ teamId });
        if (result.requiresPro) {
          setContractsRequiresPro(true);
        } else {
          setContracts(result.contracts as Contract[]);
          setContractsRequiresPro(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch contracts:', err);
      } finally {
        setIsLoadingContracts(false);
      }

      // Fetch injuries
      setIsLoadingInjuries(true);
      try {
        const result = await getInjuries({ teamId });
        if (result.requiresPro) {
          setInjuriesRequiresPro(true);
        } else {
          setInjuries(result.injuries as Injury[]);
          setInjuriesRequiresPro(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch injuries:', err);
      } finally {
        setIsLoadingInjuries(false);
      }

      // Fetch draft picks
      setIsLoadingDraftPicks(true);
      try {
        const result = await getTeamDraftPicks({ teamId });
        setDraftPicks(result.draftPicks as DraftPick[]);
      } catch (err: any) {
        console.error('Failed to fetch draft picks:', err);
      } finally {
        setIsLoadingDraftPicks(false);
        setIsRefreshing(false);
      }
    },
    [getTeamContracts, getInjuries, getTeamDraftPicks, teamId]
  );

  React.useEffect(() => {
    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleUnlockPress = () => {
    setShowPaywall(true);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  // Group contracts by player
  const playerContracts = React.useMemo(() => {
    const grouped: Record<number, { player: Contract['player']; contracts: Contract[] }> = {};
    contracts.forEach((contract) => {
      if (!grouped[contract.player.id]) {
        grouped[contract.player.id] = { player: contract.player, contracts: [] };
      }
      grouped[contract.player.id].contracts.push(contract);
    });
    // Sort by current year salary
    return Object.values(grouped).sort((a, b) => {
      const aCurrentSalary = a.contracts.find((c) => c.season === new Date().getFullYear())?.amount || 0;
      const bCurrentSalary = b.contracts.find((c) => c.season === new Date().getFullYear())?.amount || 0;
      return bCurrentSalary - aCurrentSalary;
    });
  }, [contracts]);

  // Calculate team totals
  const teamTotals = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    let totalSalary = 0;
    contracts.forEach((contract) => {
      if (contract.season === currentYear) {
        totalSalary += contract.amount;
      }
    });
    return { totalSalary, playerCount: playerContracts.length };
  }, [contracts, playerContracts]);

  if (!teamInfo) {
    return (
      <>
        <Stack.Screen options={{ title: 'Team not found' }} />
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="alert-circle" size={48} color={DesignTokens.textMuted} />
          <Text style={styles.errorText}>Team not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${teamInfo.city} ${teamInfo.name}`,
          headerStyle: {
            backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
          },
          headerTintColor: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
        }}
      />
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={DesignTokens.accentPurple}
          />
        }
      >
        {/* Team Header */}
        <View style={[styles.teamHeader, isDark && styles.teamHeaderDark]}>
          <Text style={[styles.teamAbbr, isDark && styles.textDark]}>{teamInfo.abbreviation}</Text>
          <Text style={[styles.teamFullName, isDark && styles.textDark]}>
            {teamInfo.city} {teamInfo.name}
          </Text>
        </View>

        {/* Injuries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color={DesignTokens.accentPurple} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Injury Report</Text>
            {!injuriesRequiresPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {isLoadingInjuries ? (
            <ActivityIndicator size="small" color={DesignTokens.accentPurple} />
          ) : injuriesRequiresPro ? (
            <InjuryBadgeLocked onUnlockPress={handleUnlockPress} />
          ) : injuries.length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Ionicons name="checkmark-circle" size={24} color={DesignTokens.accentSuccess} />
              <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
                No reported injuries
              </Text>
            </View>
          ) : (
            <View style={styles.injuriesList}>
              {injuries.map((injury, index) => (
                <View key={`${injury.player.id}-${index}`} style={styles.injuryItem}>
                  <Text style={[styles.injuryPlayerName, isDark && styles.textDark]}>
                    {injury.player.first_name} {injury.player.last_name}
                  </Text>
                  <InjuryBadge
                    status={injury.status}
                    description={injury.description}
                    returnDate={injury.return_date}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Draft Picks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={DesignTokens.accentPurple} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Draft Picks</Text>
          </View>

          {isLoadingDraftPicks ? (
            <ActivityIndicator size="small" color={DesignTokens.accentPurple} />
          ) : draftPicks.filter((p) => p.draftYear).length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Ionicons name="information-circle" size={24} color={DesignTokens.textMuted} />
              <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
                No draft pick data available
              </Text>
            </View>
          ) : (
            <>
              {/* Draft Summary */}
              {(() => {
                const drafted = draftPicks.filter((p) => p.draftYear);
                const undrafted = draftPicks.filter((p) => !p.draftYear);
                const lotteryPicks = drafted.filter(
                  (p) => p.draftRound === 1 && (p.draftNumber ?? 999) <= 14
                );
                return (
                  <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
                        Drafted
                      </Text>
                      <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                        {drafted.length}
                      </Text>
                    </View>
                    <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
                        Lottery
                      </Text>
                      <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                        {lotteryPicks.length}
                      </Text>
                    </View>
                    <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
                        Undrafted
                      </Text>
                      <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                        {undrafted.length}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Draft Picks List */}
              {draftPicks
                .filter((p) => p.draftYear)
                .map((pick) => (
                  <View
                    key={pick.playerId}
                    style={[styles.draftPickRow, isDark && styles.draftPickRowDark]}
                  >
                    <View style={styles.draftPickNumber}>
                      <Text style={styles.draftPickNumberText}>
                        #{pick.draftNumber}
                      </Text>
                    </View>
                    <View style={styles.draftPickInfo}>
                      <Text style={[styles.playerName, isDark && styles.textDark]}>
                        {pick.firstName} {pick.lastName}
                      </Text>
                      <Text style={[styles.draftPickMeta, isDark && styles.textSecondary]}>
                        {pick.draftYear} · Rd {pick.draftRound}
                        {pick.college ? ` · ${pick.college}` : pick.country ? ` · ${pick.country}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.draftPickPosition, isDark && styles.textSecondary]}>
                      {pick.position || 'N/A'}
                    </Text>
                  </View>
                ))}

              {/* Undrafted Players */}
              {draftPicks.filter((p) => !p.draftYear).length > 0 && (
                <>
                  <Text style={[styles.draftSubheading, isDark && styles.textSecondary]}>
                    Undrafted
                  </Text>
                  {draftPicks
                    .filter((p) => !p.draftYear)
                    .map((pick) => (
                      <View
                        key={pick.playerId}
                        style={[styles.draftPickRow, isDark && styles.draftPickRowDark]}
                      >
                        <View style={[styles.draftPickNumber, styles.draftPickUndrafted]}>
                          <Text style={[styles.draftPickNumberText, styles.draftPickUndraftedText]}>
                            UD
                          </Text>
                        </View>
                        <View style={styles.draftPickInfo}>
                          <Text style={[styles.playerName, isDark && styles.textDark]}>
                            {pick.firstName} {pick.lastName}
                          </Text>
                          <Text style={[styles.draftPickMeta, isDark && styles.textSecondary]}>
                            {pick.college ? pick.college : pick.country || ''}
                          </Text>
                        </View>
                        <Text style={[styles.draftPickPosition, isDark && styles.textSecondary]}>
                          {pick.position || 'N/A'}
                        </Text>
                      </View>
                    ))}
                </>
              )}
            </>
          )}
        </View>

        {/* Contracts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={DesignTokens.accentPurple} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Team Payroll</Text>
            {!contractsRequiresPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {isLoadingContracts ? (
            <ActivityIndicator size="small" color={DesignTokens.accentPurple} />
          ) : contractsRequiresPro ? (
            <ContractCard contracts={[]} isLocked onUnlockPress={handleUnlockPress} />
          ) : (
            <>
              {/* Team Summary */}
              <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
                    Total Payroll
                  </Text>
                  <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                    {formatCurrency(teamTotals.totalSalary)}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
                    Players
                  </Text>
                  <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                    {teamTotals.playerCount}
                  </Text>
                </View>
              </View>

              {/* Player Contracts List */}
              {playerContracts.map((pc) => {
                const currentSalary = pc.contracts.find(
                  (c) => c.season === new Date().getFullYear()
                );
                return (
                  <Pressable
                    key={pc.player.id}
                    style={[styles.playerContractRow, isDark && styles.playerContractRowDark]}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, isDark && styles.textDark]}>
                        {pc.player.first_name} {pc.player.last_name}
                      </Text>
                      <Text style={[styles.playerPosition, isDark && styles.textSecondary]}>
                        {pc.player.position || 'N/A'}
                      </Text>
                    </View>
                    <Text style={[styles.playerSalary, isDark && styles.textDark]}>
                      {currentSalary ? formatCurrency(currentSalary.amount) : 'N/A'}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingBottom: DesignTokens.spacing.xxl,
  },
  teamHeader: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    backgroundColor: DesignTokens.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  teamHeaderDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  teamAbbr: {
    ...Typography.displayLarge,
    color: DesignTokens.accentPurple,
    fontWeight: '800',
  },
  teamFullName: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
    marginTop: DesignTokens.spacing.xs,
  },
  section: {
    padding: DesignTokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
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
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.md,
  },
  emptyCardDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  emptyText: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
  },
  injuriesList: {
    gap: DesignTokens.spacing.sm,
  },
  injuryItem: {
    marginBottom: DesignTokens.spacing.sm,
  },
  injuryPlayerName: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  summaryCardDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: DesignTokens.border,
  },
  summaryDividerDark: {
    backgroundColor: DesignTokens.borderDark,
  },
  summaryLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
  },
  playerContractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  playerContractRowDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
    fontWeight: '500',
  },
  playerPosition: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
  },
  playerSalary: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  draftPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  draftPickRowDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  draftPickNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignTokens.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.sm,
  },
  draftPickNumberText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  draftPickUndrafted: {
    backgroundColor: DesignTokens.textMuted,
  },
  draftPickUndraftedText: {
    fontSize: 10,
  },
  draftPickInfo: {
    flex: 1,
  },
  draftPickMeta: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 1,
  },
  draftPickPosition: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    fontWeight: '600',
    marginLeft: DesignTokens.spacing.sm,
  },
  draftSubheading: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
    marginTop: DesignTokens.spacing.md,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
