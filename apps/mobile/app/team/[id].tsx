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

import { ContractCard, InjuryBadge, InjuryBadgeLocked, ScoreCard, FutureDraftPicksCard } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
import { NBA_TEAMS } from '@/constants/nbaTeams';
import { useTheme } from '@/context/ThemeContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useListsContext } from '@/context/ListsContext';
import { api } from '@statcheck/convex';
import { getAllPlayers } from '@/services/playerData';
import { usePlayerData } from '@/context/PlayerDataContext';

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
  base_salary: number;
  cap_hit: number;
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

interface FuturePick {
  year: number;
  round: number;
  originalTeam: string;
  conditions?: string;
  swapRights?: boolean;
  viaTradeWith?: string;
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { isProUser } = useRevenueCat();
  const { setShowPaywall } = useListsContext();
  const { isLoaded: playerDataLoaded } = usePlayerData();

  const teamId = parseInt(id || '0', 10);
  const teamInfo = NBA_TEAMS[teamId];

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
  const futurePicks = useQuery(api.nba.getTeamFuturePicks, { teamId });

  // Store failed photo URLs to show initials fallback
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());

  // Helper to get player photo URL from local data
  const getPlayerPhotoUrl = useCallback((firstName: string, lastName: string): string | null => {
    if (!playerDataLoaded) return null;

    const allPlayers = getAllPlayers();
    if (allPlayers.length === 0) return null;

    const fullName = `${firstName} ${lastName}`.toLowerCase().trim();

    // Try exact match first
    let player = allPlayers.find(p => p.name.toLowerCase().trim() === fullName);

    // Try last name match if exact fails
    if (!player) {
      player = allPlayers.find(p => {
        const nameParts = p.name.toLowerCase().split(' ');
        return nameParts[nameParts.length - 1] === lastName.toLowerCase();
      });
    }

    return player?.photoUrl || null;
  }, [playerDataLoaded]);

  const handlePhotoError = useCallback((playerId: number) => {
    setFailedPhotos(prev => new Set(prev).add(String(playerId)));
  }, []);

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

  const handleOpenTradeSimulator = () => {
    if (!isProUser) {
      setShowPaywall(true);
      return;
    }
    router.push(`/trade-simulator?fromTeamId=${teamId}` as any);
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

  // Find the most recent season from contracts
  const currentSeason = React.useMemo(() => {
    const seasons = [...new Set(contracts.map(c => c.season))].sort((a, b) => b - a);
    return seasons.length > 0 ? seasons[0] : new Date().getFullYear();
  }, [contracts]);

  // Group contracts by player
  const playerContracts = React.useMemo(() => {
    const grouped: Record<number, { player: Contract['player']; contracts: Contract[] }> = {};
    contracts.forEach((contract) => {
      if (!grouped[contract.player.id]) {
        grouped[contract.player.id] = { player: contract.player, contracts: [] };
      }
      grouped[contract.player.id].contracts.push(contract);
    });
    // Sort by current season salary
    return Object.values(grouped).sort((a, b) => {
      const aCurrentSalary = a.contracts.find((c) => c.season === currentSeason)?.base_salary || 0;
      const bCurrentSalary = b.contracts.find((c) => c.season === currentSeason)?.base_salary || 0;
      return bCurrentSalary - aCurrentSalary;
    });
  }, [contracts, currentSeason]);

  // Calculate team totals
  const teamTotals = React.useMemo(() => {
    let totalSalary = 0;
    contracts.forEach((contract) => {
      if (contract.season === currentSeason) {
        totalSalary += contract.base_salary || 0;
      }
    });
    return { totalSalary, playerCount: playerContracts.length };
  }, [contracts, playerContracts, currentSeason]);

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
          headerBackTitle: 'Back',
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
            tintColor={DesignTokens.accentGreen}
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

        <Pressable
          style={[styles.tradeSimulatorButton, isDark && styles.tradeSimulatorButtonDark]}
          onPress={handleOpenTradeSimulator}
        >
          <Ionicons name="swap-horizontal" size={18} color={DesignTokens.accentGreen} />
          <Text style={[styles.tradeSimulatorButtonText, isDark && styles.textDark]}>
            Trade Simulator
          </Text>
          {!isProUser && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </Pressable>

        {/* Live Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basketball" size={20} color={DesignTokens.accentGreen} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Today's Games</Text>
          </View>

          {isLoadingGames ? (
            <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
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
            <Ionicons name="medical" size={20} color={DesignTokens.accentGreen} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Injury Report</Text>
            {!injuriesRequiresPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {isLoadingInjuries ? (
            <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
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
              {injuries.map((injury, index) => {
                const photoUrl = getPlayerPhotoUrl(injury.player.first_name, injury.player.last_name);
                const initials = `${injury.player.first_name[0]}${injury.player.last_name[0]}`;
                const playerId = String(injury.player.id);
                const photoFailed = failedPhotos.has(playerId);

                return (
                  <View key={`${injury.player.id}-${index}`} style={styles.injuryItem}>
                    <View style={styles.injuryHeader}>
                      {photoFailed ? (
                        <View style={[styles.injuryPlayerPhoto, styles.injuryPlayerInitials]}>
                          <Text style={styles.initialsText}>{initials}</Text>
                        </View>
                      ) : photoUrl ? (
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.injuryPlayerPhoto}
                          contentFit="cover"
                          onError={() => handlePhotoError(injury.player.id)}
                        />
                      ) : (
                        <View style={[styles.injuryPlayerPhoto, styles.injuryPlayerInitials]}>
                          <Text style={styles.initialsText}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.injuryPlayerInfo}>
                        <Text style={[styles.injuryPlayerName, isDark && styles.textDark]}>
                          {injury.player.first_name} {injury.player.last_name}
                        </Text>
                        <InjuryBadge
                          status={injury.status}
                          description={injury.description}
                          returnDate={injury.return_date}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Contracts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={DesignTokens.accentGreen} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Team Payroll</Text>
            {!contractsRequiresPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {isLoadingContracts ? (
            <ActivityIndicator size="small" color={DesignTokens.accentGreen} />
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
                const currentSalaryContract = pc.contracts.find(
                  (c) => c.season === currentSeason
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
                      {currentSalaryContract ? formatCurrency(currentSalaryContract.base_salary) : 'N/A'}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>

        {/* Draft Picks Section */}
        <View style={styles.section}>
          <FutureDraftPicksCard
            picks={futurePicks?.picks ?? []}
            teamAbbreviation={teamInfo.abbreviation}
            lastUpdated={futurePicks?.lastUpdated ?? null}
            isLoading={futurePicks === undefined}
          />
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
    color: DesignTokens.accentGreen,
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
  tradeSimulatorButton: {
    marginHorizontal: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  tradeSimulatorButtonDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderColor: DesignTokens.borderDark,
  },
  tradeSimulatorButtonText: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
    fontWeight: '600',
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
    backgroundColor: DesignTokens.accentGreen,
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
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.sm,
  },
  injuryPlayerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignTokens.cardBackground,
  },
  injuryPlayerInitials: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.accentGreen + '20',
  },
  initialsText: {
    ...Typography.headline,
    color: DesignTokens.accentGreen,
    fontWeight: '700',
  },
  injuryPlayerInfo: {
    flex: 1,
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
