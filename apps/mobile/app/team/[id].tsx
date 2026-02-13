import React, { useState, useCallback, useMemo } from 'react';
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
import { Image } from 'expo-image';

import { ContractCard, InjuryBadge, InjuryBadgeLocked, ScoreCard } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
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

interface Game {
  id: number;
  date: string;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
  };
  home_team_score: number;
  visitor_team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
  };
  visitor_team_score: number;
}

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
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [contractsRequiresPro, setContractsRequiresPro] = useState(false);
  const [injuriesRequiresPro, setInjuriesRequiresPro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getTeamContracts = useAction(api.nba.getTeamContracts);
  const getInjuries = useAction(api.nba.getInjuries);
  const getGames = useAction(api.nba.getGames);

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      setError(null);

      // Fetch today's games for this team
      setIsLoadingGames(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const result = await getGames({ date: today });
        const teamGames = (result.games as Game[]).filter(
          (g) => g.home_team.id === teamId || g.visitor_team.id === teamId
        );
        setGames(teamGames);
      } catch (err: any) {
        console.error('Failed to fetch games:', err);
      } finally {
        setIsLoadingGames(false);
      }

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
        setIsRefreshing(false);
      }
    },
    [getTeamContracts, getInjuries, getGames, teamId]
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

  // Separate games by status
  const { liveGames, scheduledGames, completedGames } = useMemo(() => {
    const live: Game[] = [];
    const scheduled: Game[] = [];
    const completed: Game[] = [];
    games.forEach((game) => {
      if (game.status === 'In Progress') {
        live.push(game);
      } else if (game.status === 'Final') {
        completed.push(game);
      } else {
        scheduled.push(game);
      }
    });
    return { liveGames: live, scheduledGames: scheduled, completedGames: completed };
  }, [games]);

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
          <Image
            source={{ uri: getNBATeamLogoUrl(teamInfo.abbreviation) }}
            style={styles.teamHeaderLogo}
            contentFit="contain"
            transition={200}
          />
          <Text style={[styles.teamAbbr, isDark && styles.textDark]}>{teamInfo.abbreviation}</Text>
          <Text style={[styles.teamFullName, isDark && styles.textDark]}>
            {teamInfo.city} {teamInfo.name}
          </Text>
        </View>

        {/* Live Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basketball" size={20} color={DesignTokens.accentPurple} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Today's Games</Text>
          </View>

          {isLoadingGames ? (
            <ActivityIndicator size="small" color={DesignTokens.accentPurple} />
          ) : games.length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Ionicons name="calendar-outline" size={24} color={DesignTokens.textMuted} />
              <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
                No games today
              </Text>
            </View>
          ) : (
            <View style={styles.gamesList}>
              {liveGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
              {scheduledGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
              {completedGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
            </View>
          )}
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
  teamHeaderLogo: {
    width: 80,
    height: 80,
    marginBottom: DesignTokens.spacing.sm,
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
  gamesList: {
    gap: DesignTokens.spacing.sm,
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
