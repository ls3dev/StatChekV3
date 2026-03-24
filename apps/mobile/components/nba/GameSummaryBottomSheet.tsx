import React, { useEffect, useState, useCallback } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAction } from 'convex/react';

import { Ionicons } from '@expo/vector-icons';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
import { api } from '@statcheck/convex';
import { getAllPlayers } from '@/services/playerData';
import { usePlayerData } from '@/context/PlayerDataContext';
import type { Player } from '@/types';

interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  name: string;
}

interface Game {
  id: number;
  date: string;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: Team;
  home_team_score: number;
  visitor_team: Team;
  visitor_team_score: number;
}

interface PlayerBoxScore {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number | null;
  turnover: number;
  plus_minus: number | null;
}

interface BoxScoreTeam extends Team {
  players: PlayerBoxScore[];
}

interface BoxScore {
  date: string;
  datetime: string;
  home_team: BoxScoreTeam;
  home_team_score: number;
  visitor_team: BoxScoreTeam;
  visitor_team_score: number;
  home_q1: number;
  home_q2: number;
  home_q3: number;
  home_q4: number;
  home_ot1: number | null;
  home_ot2: number | null;
  home_ot3: number | null;
  visitor_q1: number;
  visitor_q2: number;
  visitor_q3: number;
  visitor_q4: number;
  visitor_ot1: number | null;
  visitor_ot2: number | null;
  visitor_ot3: number | null;
}

interface TeamStanding {
  wins: number;
  losses: number;
  conference_rank: number;
  conference_record: string;
  home_record: string;
  road_record: string;
}
interface GamePlay {
  id: number;
  description: string | null;
  clock: string | null;
  period: number;
  home_score: number | null;
  away_score: number | null;
  score_value: number | null;
  scoring_play: boolean;
  order: number;
  team: Team | null;
}

interface TeamSeasonStats {
  team_id: number;
  season: number;
  season_type: string;
  games: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  min: string;
  plus_minus: number;
  win_pct: number;
  losses: number;
  wins: number;
}

type ComparisonTeamStats = {
  pts: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  turnovers: number | null;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  record?: string | null;
};
type GameSummaryBottomSheetProps = {
  game: Game | null;
  isVisible: boolean;
  onDismiss: () => void;
  onOpenFullPlayerCard?: (player: Player) => void;
  homeStanding?: TeamStanding;
  visitorStanding?: TeamStanding;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = 150;

// Apple Sports-inspired dark colors
const COLORS = {
  background: '#1C1C1E',
  card: '#2C2C2E',
  cardAlt: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  divider: '#38383A',
  accent: '#30D158',
  live: '#FF3B30',
  tabActive: '#FFFFFF',
  tabInactive: '#8E8E93',
};

function isScheduledGameStatus(game: Game) {
  return game.status !== 'Final' && (game.status.includes('T') || game.period === 0);
}

function getSeasonForGameDate(dateString: string) {
  const gameDate = new Date(dateString);
  const year = gameDate.getFullYear();
  const month = gameDate.getMonth() + 1;
  return month >= 10 ? year : year - 1;
}

export function GameSummaryBottomSheet({ game, isVisible, onDismiss, onOpenFullPlayerCard, homeStanding, visitorStanding }: GameSummaryBottomSheetProps) {
  const router = useRouter();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const { isLoaded: playerDataLoaded } = usePlayerData();

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'visitor'>('visitor');
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [gamePlays, setGamePlays] = useState<GamePlay[]>([]);
  const [seasonTeamStats, setSeasonTeamStats] = useState<{
    home: TeamSeasonStats | null;
    visitor: TeamSeasonStats | null;
  }>({ home: null, visitor: null });
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSeasonStats, setIsLoadingSeasonStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonStatsError, setSeasonStatsError] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBoxScore | null>(null);

  const getBoxScore = useAction(api.nba.getBoxScore);
  const getGamePlays = useAction(api.nba.getGamePlays);
  const getTeamSeasonAverages = useAction(api.nba.getTeamSeasonAverages);

  // Helper to normalize names for matching (remove accents, suffixes, etc.)
  const normalizeName = useCallback((name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase()
      .replace(/\s+(jr\.?|sr\.?|ii|iii|iv)$/i, '') // Remove suffixes
      .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
      .trim();
  }, []);

  // Helper to get player photo URL from local data
  const getPlayerPhotoUrl = useCallback((firstName: string, lastName: string): string | null => {
    if (!playerDataLoaded) return null;

    const allPlayers = getAllPlayers();
    if (allPlayers.length === 0) return null;

    const normalizedFirst = normalizeName(firstName);
    const normalizedLast = normalizeName(lastName);
    const fullName = `${normalizedFirst} ${normalizedLast}`;

    // Try exact match first
    let player = allPlayers.find(p => normalizeName(p.name) === fullName);

    // Try first initial + last name match
    if (!player && normalizedFirst.length > 0) {
      player = allPlayers.find(p => {
        const normalized = normalizeName(p.name);
        const parts = normalized.split(' ');
        if (parts.length < 2) return false;
        const pFirst = parts[0];
        const pLast = parts[parts.length - 1];
        return pFirst[0] === normalizedFirst[0] && pLast === normalizedLast;
      });
    }

    // Try last name only match (be more careful - only if unique-ish)
    if (!player) {
      const lastNameMatches = allPlayers.filter(p => {
        const normalized = normalizeName(p.name);
        const parts = normalized.split(' ');
        return parts[parts.length - 1] === normalizedLast;
      });
      // Only use if there's exactly one match or first name also starts with same letter
      if (lastNameMatches.length === 1) {
        player = lastNameMatches[0];
      } else if (lastNameMatches.length > 1 && normalizedFirst.length > 0) {
        player = lastNameMatches.find(p => {
          const normalized = normalizeName(p.name);
          return normalized.startsWith(normalizedFirst[0]);
        });
      }
    }

    // Try contains match as last resort
    if (!player) {
      player = allPlayers.find(p => {
        const normalized = normalizeName(p.name);
        return normalized.includes(normalizedLast) && normalized.includes(normalizedFirst);
      });
    }

    return player?.photoUrl || null;
  }, [playerDataLoaded, normalizeName]);

  const handlePhotoError = useCallback((playerId: number) => {
    setFailedPhotos(prev => new Set(prev).add(String(playerId)));
  }, []);

  const fetchBoxScore = useCallback(async () => {
    if (!game) return;

    setIsLoading(true);
    setError(null);

    try {
      const canLoadPlays = getSeasonForGameDate(game.date) >= 2025;
      const [boxScoreResult, playsResult] = await Promise.all([
        getBoxScore({
          date: game.date.split('T')[0],
          homeTeamId: game.home_team.id,
          visitorTeamId: game.visitor_team.id,
        }),
        canLoadPlays
          ? getGamePlays({ gameId: game.id }).catch((playError) => {
              console.error('Failed to fetch play-by-play:', playError);
              return { plays: [] as GamePlay[] };
            })
          : Promise.resolve({ plays: [] as GamePlay[] }),
      ]);

      setBoxScore(boxScoreResult.boxScore as BoxScore | null);
      setIsLive(boxScoreResult.isLive);
      setGamePlays((playsResult.plays as GamePlay[]) ?? []);
    } catch (err: any) {
      console.error('Failed to fetch box score:', err);
      setError(err.message || 'Failed to load box score');
    } finally {
      setIsLoading(false);
    }
  }, [game, getBoxScore, getGamePlays]);

  const fetchSeasonTeamStats = useCallback(async () => {
    if (!game) return;

    setIsLoadingSeasonStats(true);
    setSeasonStatsError(null);

    try {
      const result = await getTeamSeasonAverages({
        teamIds: [game.home_team.id, game.visitor_team.id],
        season: getSeasonForGameDate(game.date),
        seasonType: game.postseason ? 'playoffs' : 'regular',
      });

      const stats = result.stats as TeamSeasonStats[];
      setSeasonTeamStats({
        home: stats.find((team) => team.team_id === game.home_team.id) ?? null,
        visitor: stats.find((team) => team.team_id === game.visitor_team.id) ?? null,
      });
    } catch (err: any) {
      console.error('Failed to fetch season team stats:', err);
      setSeasonStatsError(err.message || 'Failed to load season team stats');
    } finally {
      setIsLoadingSeasonStats(false);
    }
  }, [game, getTeamSeasonAverages]);

  useEffect(() => {
    if (isVisible && game) {
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
      if (isScheduledGameStatus(game)) {
        setBoxScore(null);
        setGamePlays([]);
        setIsLive(false);
        fetchSeasonTeamStats();
      } else {
        setSeasonTeamStats({ home: null, visitor: null });
        setSeasonStatsError(null);
        fetchBoxScore();
      }
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
      setBoxScore(null);
      setGamePlays([]);
      setSeasonTeamStats({ home: null, visitor: null });
      setIsLoadingSeasonStats(false);
      setSeasonStatsError(null);
      setSelectedTeam('visitor');
    }
  }, [isVisible, game, translateY, backdropOpacity, fetchBoxScore, fetchSeasonTeamStats]);

  // Auto-refresh for live games
  useEffect(() => {
    if (!isVisible || !isLive) return;

    const interval = setInterval(() => {
      fetchBoxScore();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isVisible, isLive, fetchBoxScore]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        backdropOpacity.value = 0.6 * (1 - event.translationY / SHEET_HEIGHT);
      }
    })
    .onEnd((event) => {
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
        });
        backdropOpacity.value = withTiming(0.6, { duration: 150 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const constructPlayerFromBoxScore = useCallback((boxPlayer: PlayerBoxScore): Player => {
    const teamData = selectedTeam === 'home' ? game!.home_team : game!.visitor_team;
    const photoUrl = getPlayerPhotoUrl(boxPlayer.player.first_name, boxPlayer.player.last_name);
    return {
      id: `nba-${boxPlayer.player.id}`,
      name: `${boxPlayer.player.first_name} ${boxPlayer.player.last_name}`,
      sport: 'NBA',
      team: teamData.abbreviation,
      position: boxPlayer.player.position,
      number: '',
      photoUrl: photoUrl ?? undefined,
    };
  }, [selectedTeam, game, getPlayerPhotoUrl]);

  const handleTeamPress = (teamId: number) => {
    onDismiss();
    router.push(`/team/${teamId}`);
  };

  if (!game) return null;

  // Game status can be: "Final", "1st Qtr", "2nd Qtr", "3rd Qtr", "4th Qtr", "Halftime", "In Progress", or a datetime string for scheduled
  const isFinal = game.status === 'Final';
  const isScheduledFromFeed = !isFinal && (game.status.includes('T') || game.period === 0);
  const hasBoxScoreData =
    !!boxScore &&
    ((boxScore.home_team.players?.length ?? 0) > 0 || (boxScore.visitor_team.players?.length ?? 0) > 0);
  const isScheduled = isScheduledFromFeed && !isLive && !hasBoxScoreData;
  const isLiveGame = !isFinal && !isScheduled;

  const homeWinning = game.home_team_score > game.visitor_team_score;
  const visitorWinning = game.visitor_team_score > game.home_team_score;

  const getStatusText = () => {
    if (isFinal) return 'Final';
    if (isLiveGame) {
      return game.time || game.status;
    }
    // Scheduled - format datetime nicely
    try {
      const date = new Date(game.status);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return game.status;
    }
  };

  const selectedTeamData = selectedTeam === 'home' ? boxScore?.home_team : boxScore?.visitor_team;
  const players = selectedTeamData?.players ?? [];

  // Sort players by minutes played (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const aMin = parseInt(a.min?.split(':')[0] || '0', 10);
    const bMin = parseInt(b.min?.split(':')[0] || '0', 10);
    return bMin - aMin;
  });

  const getTeamSide = (teamId: number | null | undefined): 'home' | 'visitor' | null => {
    if (!teamId) return null;
    if (teamId === game.home_team.id) return 'home';
    if (teamId === game.visitor_team.id) return 'visitor';
    return null;
  };

  const getPlayScoreValue = (play: GamePlay, previousPlay?: GamePlay): number => {
    if (typeof play.score_value === 'number' && play.score_value > 0) {
      return play.score_value;
    }

    const side = getTeamSide(play.team?.id);
    if (!side) return 0;

    if (side === 'home') {
      const currentScore = play.home_score ?? 0;
      const previousScore = previousPlay?.home_score ?? 0;
      return Math.max(0, currentScore - previousScore);
    }

    const currentScore = play.away_score ?? 0;
    const previousScore = previousPlay?.away_score ?? 0;
    return Math.max(0, currentScore - previousScore);
  };

  const getCurrentRun = () => {
    if (gamePlays.length === 0) return null;

    let activeTeam: 'home' | 'visitor' | null = null;
    let activePoints = 0;
    let previousScoringPlay: GamePlay | undefined;

    const scoringPlays = [...gamePlays]
      .filter((play) => play.scoring_play)
      .sort((a, b) => a.order - b.order);

    for (const play of scoringPlays) {
      const side = getTeamSide(play.team?.id);
      if (!side) continue;

      const points = getPlayScoreValue(play, previousScoringPlay);
      previousScoringPlay = play;

      if (points <= 0) continue;

      if (activeTeam === side) {
        activePoints += points;
      } else {
        activeTeam = side;
        activePoints = points;
      }
    }

    if (!activeTeam || activePoints <= 0) {
      return null;
    }

    return { team: activeTeam, points: activePoints };
  };

  const renderQuarterScores = () => {
    if (!boxScore) return null;

    const currentRun = getCurrentRun();
    const visitorRunText = currentRun
      ? currentRun.team === 'visitor'
        ? `🔥 ${currentRun.points}-0`
        : `🥶 0-${currentRun.points}`
      : '-';
    const homeRunText = currentRun
      ? currentRun.team === 'home'
        ? `🔥 ${currentRun.points}-0`
        : `🥶 0-${currentRun.points}`
      : '-';

    const quarters = [
      { label: 'Q1', home: boxScore.home_q1, visitor: boxScore.visitor_q1 },
      { label: 'Q2', home: boxScore.home_q2, visitor: boxScore.visitor_q2 },
      { label: 'Q3', home: boxScore.home_q3, visitor: boxScore.visitor_q3 },
      { label: 'Q4', home: boxScore.home_q4, visitor: boxScore.visitor_q4 },
    ];

    // Add overtime periods if they exist
    if (boxScore.home_ot1 !== null) {
      quarters.push({ label: 'OT1', home: boxScore.home_ot1, visitor: boxScore.visitor_ot1! });
    }
    if (boxScore.home_ot2 !== null) {
      quarters.push({ label: 'OT2', home: boxScore.home_ot2, visitor: boxScore.visitor_ot2! });
    }
    if (boxScore.home_ot3 !== null) {
      quarters.push({ label: 'OT3', home: boxScore.home_ot3, visitor: boxScore.visitor_ot3! });
    }

    return (
      <View style={styles.quarterContainer}>
        <View style={styles.quarterRow}>
          <View style={styles.quarterTeam}>
            <Text style={styles.quarterTeamText}>{game.visitor_team.abbreviation}</Text>
          </View>
          {quarters.map((q) => (
            <View key={q.label} style={styles.quarterCell}>
              <Text style={styles.quarterScore}>{q.visitor}</Text>
            </View>
          ))}
          <View style={styles.quarterTotal}>
            <Text style={[styles.quarterScore, styles.quarterTotalScore]}>
              {boxScore.visitor_team_score}
            </Text>
          </View>
          <View style={styles.quarterRun}>
            <View
              style={[
                styles.runBadge,
                currentRun
                  ? currentRun.team === 'visitor'
                    ? styles.runBadgeHot
                    : styles.runBadgeCold
                  : styles.runBadgeNeutral,
              ]}
            >
              <Text style={styles.runBadgeText}>{visitorRunText}</Text>
            </View>
          </View>
        </View>
        <View style={styles.quarterRow}>
          <View style={styles.quarterTeam}>
            <Text style={styles.quarterTeamText}>{game.home_team.abbreviation}</Text>
          </View>
          {quarters.map((q) => (
            <View key={q.label} style={styles.quarterCell}>
              <Text style={styles.quarterScore}>{q.home}</Text>
            </View>
          ))}
          <View style={styles.quarterTotal}>
            <Text style={[styles.quarterScore, styles.quarterTotalScore]}>
              {boxScore.home_team_score}
            </Text>
          </View>
          <View style={styles.quarterRun}>
            <View
              style={[
                styles.runBadge,
                currentRun
                  ? currentRun.team === 'home'
                    ? styles.runBadgeHot
                    : styles.runBadgeCold
                  : styles.runBadgeNeutral,
              ]}
            >
              <Text style={styles.runBadgeText}>{homeRunText}</Text>
            </View>
          </View>
        </View>
        <View style={styles.quarterLabels}>
          <View style={styles.quarterTeam} />
          {quarters.map((q) => (
            <View key={q.label} style={styles.quarterCell}>
              <Text style={styles.quarterLabel}>{q.label}</Text>
            </View>
          ))}
          <View style={styles.quarterTotal}>
            <Text style={styles.quarterLabel}>T</Text>
          </View>
          <View style={styles.quarterRun}>
            <Text style={styles.quarterLabel}>RUN</Text>
          </View>
        </View>
      </View>
    );
  };

  const computeTeamTotals = (players: PlayerBoxScore[]) => {
    return players.reduce(
      (acc, p) => ({
        pts: acc.pts + (p.pts || 0),
        reb: acc.reb + (p.reb || 0),
        ast: acc.ast + (p.ast || 0),
        stl: acc.stl + (p.stl || 0),
        blk: acc.blk + (p.blk || 0),
        turnover: acc.turnover + (p.turnover || 0),
        fgm: acc.fgm + (p.fgm || 0),
        fga: acc.fga + (p.fga || 0),
        fg3m: acc.fg3m + (p.fg3m || 0),
        fg3a: acc.fg3a + (p.fg3a || 0),
        ftm: acc.ftm + (p.ftm || 0),
        fta: acc.fta + (p.fta || 0),
      }),
      { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, turnover: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 }
    );
  };

  const formatTeamPct = (made: number, attempted: number) => {
    if (attempted === 0) return '-';
    return ((made / attempted) * 100).toFixed(1) + '%';
  };

  const renderTeamStats = () => {
    if (!boxScore) return null;

    const homeTotals = computeTeamTotals(boxScore.home_team.players);
    const visitorTotals = computeTeamTotals(boxScore.visitor_team.players);

    const rows: { label: string; home: string; visitor: string }[] = [
      { label: 'PTS', home: String(homeTotals.pts), visitor: String(visitorTotals.pts) },
      { label: 'REB', home: String(homeTotals.reb), visitor: String(visitorTotals.reb) },
      { label: 'AST', home: String(homeTotals.ast), visitor: String(visitorTotals.ast) },
      { label: 'STL', home: String(homeTotals.stl), visitor: String(visitorTotals.stl) },
      { label: 'BLK', home: String(homeTotals.blk), visitor: String(visitorTotals.blk) },
      { label: 'FG%', home: formatTeamPct(homeTotals.fgm, homeTotals.fga), visitor: formatTeamPct(visitorTotals.fgm, visitorTotals.fga) },
      { label: '3P%', home: formatTeamPct(homeTotals.fg3m, homeTotals.fg3a), visitor: formatTeamPct(visitorTotals.fg3m, visitorTotals.fg3a) },
      { label: 'FT%', home: formatTeamPct(homeTotals.ftm, homeTotals.fta), visitor: formatTeamPct(visitorTotals.ftm, visitorTotals.fta) },
    ];

    return (
      <View style={styles.teamStatsContainer}>
        {/* Header */}
        <View style={styles.teamStatsHeader}>
          <View style={styles.teamStatsLabelCol} />
          <Text style={styles.teamStatsTeamHeader}>{game.visitor_team.abbreviation}</Text>
          <Text style={styles.teamStatsTeamHeader}>{game.home_team.abbreviation}</Text>
        </View>
        {/* Rows */}
        {rows.map((row) => (
          <View key={row.label} style={styles.teamStatsRow}>
            <Text style={styles.teamStatsLabel}>{row.label}</Text>
            <Text style={styles.teamStatsValue}>{row.visitor}</Text>
            <Text style={styles.teamStatsValue}>{row.home}</Text>
          </View>
        ))}
      </View>
    );
  };

  const formatMinutes = (min: string) => {
    if (!min) return '-';
    const parts = min.split(':');
    return parts[0];
  };

  const formatStat = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toString();
  };

  const formatPlusMinus = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value > 0 ? `+${value}` : value.toString();
  };

  const formatTeamStatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    if (Math.abs(value - Math.round(value)) < 0.05) return Math.round(value).toString();
    return value.toFixed(1);
  };

  const formatTeamStatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getGameTeamStats = (team: BoxScoreTeam | undefined): ComparisonTeamStats | null => {
    if (!team) return null;

    const totals = team.players.reduce(
      (acc, player) => ({
        pts: acc.pts + (player.pts || 0),
        reb: acc.reb + (player.reb || 0),
        ast: acc.ast + (player.ast || 0),
        stl: acc.stl + (player.stl || 0),
        blk: acc.blk + (player.blk || 0),
        turnovers: acc.turnovers + (player.turnover || 0),
        fgm: acc.fgm + (player.fgm || 0),
        fga: acc.fga + (player.fga || 0),
        fg3m: acc.fg3m + (player.fg3m || 0),
        fg3a: acc.fg3a + (player.fg3a || 0),
        ftm: acc.ftm + (player.ftm || 0),
        fta: acc.fta + (player.fta || 0),
      }),
      {
        pts: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        turnovers: 0,
        fgm: 0,
        fga: 0,
        fg3m: 0,
        fg3a: 0,
        ftm: 0,
        fta: 0,
      }
    );

    return {
      pts: totals.pts,
      reb: totals.reb,
      ast: totals.ast,
      stl: totals.stl,
      blk: totals.blk,
      turnovers: totals.turnovers,
      fgPct: totals.fga > 0 ? totals.fgm / totals.fga : null,
      fg3Pct: totals.fg3a > 0 ? totals.fg3m / totals.fg3a : null,
      ftPct: totals.fta > 0 ? totals.ftm / totals.fta : null,
    };
  };

  const getSeasonComparisonStats = (team: TeamSeasonStats | null): ComparisonTeamStats | null => {
    if (!team) return null;

    return {
      record: `${team.wins}-${team.losses}`,
      pts: team.pts,
      reb: team.reb,
      ast: team.ast,
      stl: team.stl,
      blk: team.blk,
      turnovers: team.turnover,
      fgPct: team.fg_pct,
      fg3Pct: team.fg3_pct,
      ftPct: team.ft_pct,
    };
  };

  const renderTeamStatsSection = () => {
    const selectedTeamInfo = selectedTeam === 'home' ? game.home_team : game.visitor_team;
    const selectedStats = isScheduled
      ? getSeasonComparisonStats(
          selectedTeam === 'home' ? seasonTeamStats.home : seasonTeamStats.visitor
        )
      : getGameTeamStats(selectedTeam === 'home' ? boxScore?.home_team : boxScore?.visitor_team);

    if (!selectedStats) return null;

    const statCards = [
      isScheduled ? { label: 'REC', value: selectedStats.record ?? '-' } : null,
      { label: 'PTS', value: formatTeamStatNumber(selectedStats.pts) },
      { label: 'REB', value: formatTeamStatNumber(selectedStats.reb) },
      { label: 'AST', value: formatTeamStatNumber(selectedStats.ast) },
      { label: 'FG%', value: formatTeamStatPercent(selectedStats.fgPct) },
      { label: '3PT%', value: formatTeamStatPercent(selectedStats.fg3Pct) },
      { label: 'FT%', value: formatTeamStatPercent(selectedStats.ftPct) },
      { label: 'STL', value: formatTeamStatNumber(selectedStats.stl) },
      { label: 'BLK', value: formatTeamStatNumber(selectedStats.blk) },
      { label: 'TO', value: formatTeamStatNumber(selectedStats.turnovers) },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <View style={styles.teamStatsCard}>
        <View style={styles.teamStatsHeaderRow}>
          <View>
            <Text style={styles.teamStatsTitle}>
              {isScheduled ? 'Season Team Stats' : 'Game Team Stats'}
            </Text>
            <Text style={styles.teamStatsSubtitle}>
              {isScheduled ? 'Per-game averages' : 'Totals from this matchup'}
            </Text>
          </View>
          <View style={styles.teamStatsTeamPill}>
            <Image
              source={{ uri: getNBATeamLogoUrl(selectedTeamInfo.abbreviation) }}
              style={styles.teamStatsTeamPillLogo}
            />
            <Text style={styles.teamStatsTeamPillText}>{selectedTeamInfo.abbreviation}</Text>
          </View>
        </View>

        <View style={styles.teamStatsGrid}>
          {statCards.map((stat) => (
            <View key={`${selectedTeam}-${stat.label}`} style={styles.teamStatsTile}>
              <Text style={styles.teamStatsTileValue}>{stat.value}</Text>
              <Text style={styles.teamStatsTileLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTeamTabs = () => (
    <View style={styles.teamTabs}>
      <Pressable
        style={[styles.teamTab, selectedTeam === 'visitor' && styles.teamTabActive]}
        onPress={() => setSelectedTeam('visitor')}
      >
        <Image
          source={{ uri: getNBATeamLogoUrl(game.visitor_team.abbreviation) }}
          style={styles.tabLogo}
        />
        <Text style={[styles.teamTabText, selectedTeam === 'visitor' && styles.teamTabTextActive]}>
          {game.visitor_team.abbreviation}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.teamTab, selectedTeam === 'home' && styles.teamTabActive]}
        onPress={() => setSelectedTeam('home')}
      >
        <Image
          source={{ uri: getNBATeamLogoUrl(game.home_team.abbreviation) }}
          style={styles.tabLogo}
        />
        <Text style={[styles.teamTabText, selectedTeam === 'home' && styles.teamTabTextActive]}>
          {game.home_team.abbreviation}
        </Text>
      </Pressable>
    </View>
  );

  const renderPlayerRow = (player: PlayerBoxScore, index: number) => {
    const photoUrl = getPlayerPhotoUrl(player.player.first_name, player.player.last_name);
    const initials = `${player.player.first_name[0]}${player.player.last_name[0]}`;
    const playerId = String(player.player.id);
    const photoFailed = failedPhotos.has(playerId);

    return (
      <Pressable
        key={player.player.id}
        style={({ pressed }) => [
          styles.playerRow,
          pressed && styles.playerRowPressed,
        ]}
        onPress={() => setSelectedPlayer(player)}
      >
        <View style={styles.playerNameCell}>
          {photoFailed ? (
            <View style={[styles.boxScorePlayerPhoto, styles.boxScorePlayerInitials]}>
              <Text style={styles.boxScoreInitialsText}>{initials}</Text>
            </View>
          ) : photoUrl ? (
            <ExpoImage
              source={{ uri: photoUrl }}
              style={styles.boxScorePlayerPhoto}
              contentFit="cover"
              onError={() => handlePhotoError(player.player.id)}
            />
          ) : (
            <View style={[styles.boxScorePlayerPhoto, styles.boxScorePlayerInitials]}>
              <Text style={styles.boxScoreInitialsText}>{initials}</Text>
            </View>
          )}
          <View style={styles.playerNameInfo}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.player.first_name.charAt(0)}. {player.player.last_name}
            </Text>
            <Text style={styles.playerPosition}>{player.player.position}</Text>
          </View>
        </View>
        <Text style={styles.statCell}>{formatMinutes(player.min)}</Text>
        <Text style={[styles.statCell, styles.statCellHighlight]}>{formatStat(player.pts)}</Text>
        <Text style={styles.statCell}>{formatStat(player.reb)}</Text>
        <Text style={styles.statCell}>{formatStat(player.ast)}</Text>
        <Text style={styles.statCell}>{formatStat(player.stl)}</Text>
        <Text style={styles.statCell}>{formatStat(player.blk)}</Text>
        <Text style={styles.statCell}>{player.fgm}-{player.fga}</Text>
        <Text style={styles.statCell}>{player.fg3m}-{player.fg3a}</Text>
        <Text style={styles.statCell}>{player.ftm}-{player.fta}</Text>
        <Text style={styles.statCell}>{formatStat(player.turnover)}</Text>
        <Text style={[styles.statCell, player.plus_minus !== null && player.plus_minus > 0 ? styles.plusMinusPositive : player.plus_minus !== null && player.plus_minus < 0 ? styles.plusMinusNegative : null]}>
          {formatPlusMinus(player.plus_minus)}
        </Text>
      </Pressable>
    );
  };

  // Expanded player stats card
  const renderPlayerCard = () => {
    if (!selectedPlayer) return null;

    const photoUrl = getPlayerPhotoUrl(selectedPlayer.player.first_name, selectedPlayer.player.last_name);
    const initials = `${selectedPlayer.player.first_name[0]}${selectedPlayer.player.last_name[0]}`;
    const playerId = String(selectedPlayer.player.id);
    const photoFailed = failedPhotos.has(playerId);

    const fgPct = selectedPlayer.fga > 0 ? ((selectedPlayer.fgm / selectedPlayer.fga) * 100).toFixed(1) : '0.0';
    const fg3Pct = selectedPlayer.fg3a > 0 ? ((selectedPlayer.fg3m / selectedPlayer.fg3a) * 100).toFixed(1) : '0.0';
    const ftPct = selectedPlayer.fta > 0 ? ((selectedPlayer.ftm / selectedPlayer.fta) * 100).toFixed(1) : '0.0';

    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
        <Pressable style={styles.playerCardOverlay} onPress={() => setSelectedPlayer(null)}>
          <Pressable style={styles.playerCard} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.playerCardHeader}>
              {photoFailed ? (
                <View style={[styles.playerCardPhoto, styles.playerCardPhotoInitials]}>
                  <Text style={styles.playerCardInitialsText}>{initials}</Text>
                </View>
              ) : photoUrl ? (
                <ExpoImage
                  source={{ uri: photoUrl }}
                  style={styles.playerCardPhoto}
                  contentFit="cover"
                  onError={() => handlePhotoError(selectedPlayer.player.id)}
                />
              ) : (
                <View style={[styles.playerCardPhoto, styles.playerCardPhotoInitials]}>
                  <Text style={styles.playerCardInitialsText}>{initials}</Text>
                </View>
              )}
              <View style={styles.playerCardInfo}>
                <Text style={styles.playerCardName}>
                  {selectedPlayer.player.first_name} {selectedPlayer.player.last_name}
                </Text>
                <Text style={styles.playerCardPosition}>{selectedPlayer.player.position}</Text>
              </View>
              <Pressable style={styles.playerCardClose} onPress={() => setSelectedPlayer(null)}>
                <Text style={styles.playerCardCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Main Stats */}
            <View style={styles.playerCardMainStats}>
              <View style={styles.playerCardMainStat}>
                <Text style={styles.playerCardMainStatValue}>{formatStat(selectedPlayer.pts)}</Text>
                <Text style={styles.playerCardMainStatLabel}>PTS</Text>
              </View>
              <View style={styles.playerCardMainStat}>
                <Text style={styles.playerCardMainStatValue}>{formatStat(selectedPlayer.reb)}</Text>
                <Text style={styles.playerCardMainStatLabel}>REB</Text>
              </View>
              <View style={styles.playerCardMainStat}>
                <Text style={styles.playerCardMainStatValue}>{formatStat(selectedPlayer.ast)}</Text>
                <Text style={styles.playerCardMainStatLabel}>AST</Text>
              </View>
              <View style={styles.playerCardMainStat}>
                <Text style={[
                  styles.playerCardMainStatValue,
                  selectedPlayer.plus_minus !== null && selectedPlayer.plus_minus > 0 && styles.plusMinusPositive,
                  selectedPlayer.plus_minus !== null && selectedPlayer.plus_minus < 0 && styles.plusMinusNegative,
                ]}>
                  {formatPlusMinus(selectedPlayer.plus_minus)}
                </Text>
                <Text style={styles.playerCardMainStatLabel}>+/-</Text>
              </View>
            </View>

            {/* Detailed Stats */}
            <View style={styles.playerCardDetailedStats}>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Minutes</Text>
                <Text style={styles.playerCardStatValue}>{selectedPlayer.min || '-'}</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Field Goals</Text>
                <Text style={styles.playerCardStatValue}>{selectedPlayer.fgm}-{selectedPlayer.fga} ({fgPct}%)</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>3-Pointers</Text>
                <Text style={styles.playerCardStatValue}>{selectedPlayer.fg3m}-{selectedPlayer.fg3a} ({fg3Pct}%)</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Free Throws</Text>
                <Text style={styles.playerCardStatValue}>{selectedPlayer.ftm}-{selectedPlayer.fta} ({ftPct}%)</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Steals</Text>
                <Text style={styles.playerCardStatValue}>{formatStat(selectedPlayer.stl)}</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Blocks</Text>
                <Text style={styles.playerCardStatValue}>{formatStat(selectedPlayer.blk)}</Text>
              </View>
              <View style={styles.playerCardStatRow}>
                <Text style={styles.playerCardStatLabel}>Turnovers</Text>
                <Text style={styles.playerCardStatValue}>{formatStat(selectedPlayer.turnover)}</Text>
              </View>
            </View>

            {/* View Full Profile Button */}
            <Pressable
              style={styles.viewFullProfileButton}
              onPress={() => {
                const player = constructPlayerFromBoxScore(selectedPlayer);
                setSelectedPlayer(null);
                onDismiss();
                onOpenFullPlayerCard?.(player);
              }}
            >
              <Text style={styles.viewFullProfileText}>View Full Profile</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
            </Pressable>
          </Pressable>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header: Score & Status */}
            <View style={styles.header}>
              <View style={styles.headerTeams}>
                <Pressable
                  style={styles.headerTeam}
                  onPress={() => handleTeamPress(game.visitor_team.id)}
                >
                  <Image
                    source={{ uri: getNBATeamLogoUrl(game.visitor_team.abbreviation) }}
                    style={styles.headerLogo}
                  />
                  <Text style={styles.headerAbbr}>{game.visitor_team.abbreviation}</Text>
                  {!isScheduled && (
                    <Text style={[
                      styles.headerScore,
                      isFinal && visitorWinning && styles.winningScore,
                      isFinal && !visitorWinning && styles.losingScore,
                    ]}>
                      {game.visitor_team_score}
                    </Text>
                  )}
                </Pressable>

                <View style={styles.headerCenter}>
                  {(isLiveGame || isLive) && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                  <Text style={styles.headerStatus}>{getStatusText()}</Text>
                </View>

                <Pressable
                  style={styles.headerTeam}
                  onPress={() => handleTeamPress(game.home_team.id)}
                >
                  <Image
                    source={{ uri: getNBATeamLogoUrl(game.home_team.abbreviation) }}
                    style={styles.headerLogo}
                  />
                  <Text style={styles.headerAbbr}>{game.home_team.abbreviation}</Text>
                  {!isScheduled && (
                    <Text style={[
                      styles.headerScore,
                      isFinal && homeWinning && styles.winningScore,
                      isFinal && !homeWinning && styles.losingScore,
                    ]}>
                      {game.home_team_score}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Content */}
            {isScheduled ? (
              <ScrollView
                style={styles.boxScoreContent}
                contentContainerStyle={styles.scheduledContent}
                showsVerticalScrollIndicator={false}
              >
                {renderTeamTabs()}

                {isLoadingSeasonStats ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={styles.loadingText}>Loading season team stats...</Text>
                  </View>
                ) : seasonStatsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{seasonStatsError}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchSeasonTeamStats}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : (
                  renderTeamStatsSection()
                )}

                <View style={styles.scheduledNoticeCard}>
                  <Text style={styles.scheduledText}>Game has not started yet</Text>
                  <Text style={styles.scheduledSubtext}>
                    Player box score will appear here once the game tips off.
                  </Text>
                </View>

                {(homeStanding || visitorStanding) && (
                  <View style={styles.matchupContainer}>
                    <View style={styles.matchupTeamHeader}>
                      <Text style={styles.matchupTeamName} numberOfLines={1}>
                        {game.visitor_team.city}
                      </Text>
                      <Text style={styles.matchupVs}>vs</Text>
                      <Text style={styles.matchupTeamName} numberOfLines={1}>
                        {game.home_team.city}
                      </Text>
                    </View>

                    {[
                      {
                        label: 'RECORD',
                        visitor: visitorStanding ? `${visitorStanding.wins}-${visitorStanding.losses}` : '-',
                        home: homeStanding ? `${homeStanding.wins}-${homeStanding.losses}` : '-',
                        highlight: true,
                      },
                      {
                        label: 'CONF RANK',
                        visitor: visitorStanding ? `#${visitorStanding.conference_rank}` : '-',
                        home: homeStanding ? `#${homeStanding.conference_rank}` : '-',
                      },
                      {
                        label: 'CONF RECORD',
                        visitor: visitorStanding?.conference_record ?? '-',
                        home: homeStanding?.conference_record ?? '-',
                      },
                      {
                        label: 'HOME',
                        visitor: visitorStanding?.home_record ?? '-',
                        home: homeStanding?.home_record ?? '-',
                      },
                      {
                        label: 'AWAY',
                        visitor: visitorStanding?.road_record ?? '-',
                        home: homeStanding?.road_record ?? '-',
                      },
                    ].map((row) => (
                      <View key={row.label} style={styles.matchupRow}>
                        <Text style={[styles.matchupValue, row.highlight && styles.matchupValueHighlight]}>
                          {row.visitor}
                        </Text>
                        <Text style={styles.matchupLabel}>{row.label}</Text>
                        <Text style={[styles.matchupValue, row.highlight && styles.matchupValueHighlight]}>
                          {row.home}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Loading box score...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={fetchBoxScore}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : !boxScore ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Box score not available</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.boxScoreContent}
                contentContainerStyle={styles.boxScoreScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Quarter Scores */}
                {renderQuarterScores()}

                {/* Team Stats Totals */}
                {renderTeamStats()}

                {/* Team Tabs */}
                {renderTeamTabs()}

                {/* Team Stats */}
                {renderTeamStatsSection()}

                {/* Stats Table */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statsTableContainer}
                >
                  <View>
                    <View style={styles.statsHeader}>
                      <View style={styles.statsHeaderNameCell}>
                        <Text style={styles.statsHeaderText}>PLAYER</Text>
                      </View>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>MIN</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>PTS</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>REB</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>AST</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>STL</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>BLK</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>FG</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>3PT</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>FT</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>TO</Text>
                      <Text style={[styles.statCell, styles.statsHeaderText]}>+/-</Text>
                    </View>

                    {/* Player Rows */}
                    {sortedPlayers.map((player, index) => renderPlayerRow(player, index))}
                  </View>
                </ScrollView>
              </ScrollView>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Player Stats Card Overlay */}
        {selectedPlayer && renderPlayerCard()}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SHEET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  saveRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  headerTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTeam: {
    flex: 1,
    alignItems: 'center',
  },
  headerLogo: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  headerAbbr: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerScore: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  winningScore: {
    color: COLORS.text,
  },
  losingScore: {
    color: COLORS.textMuted,
  },
  headerCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.live,
  },
  headerStatus: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scheduledScroll: {
    flex: 1,
  },
  scheduledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  scheduledText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  scheduledSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  matchupContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  matchupTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.cardAlt,
  },
  matchupTeamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  matchupVs: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginHorizontal: 8,
    width: 70,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  matchupValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  matchupValueHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  matchupLabel: {
    width: 70,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  boxScoreContent: {
    flex: 1,
  },
  boxScoreScrollContent: {
    paddingBottom: 32,
  },
  scheduledContent: {
    paddingBottom: 32,
  },
  scheduledNoticeCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  teamStatsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  teamStatsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  teamStatsSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  teamStatsTeamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  teamStatsTeamPillLogo: {
    width: 20,
    height: 20,
  },
  teamStatsTeamPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  teamStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  teamStatsTile: {
    width: '31%',
    minHeight: 62,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  teamStatsTileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  teamStatsTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  quarterContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
  },
  quarterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  quarterLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    marginTop: 4,
    paddingTop: 4,
  },
  quarterTeam: {
    width: 40,
  },
  quarterTeamText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  quarterCell: {
    width: 32,
    alignItems: 'center',
  },
  quarterScore: {
    fontSize: 13,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  quarterLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  quarterTotal: {
    width: 36,
    alignItems: 'center',
    marginLeft: 4,
  },
  quarterRun: {
    width: 84,
    marginLeft: 8,
    alignItems: 'center',
  },
  quarterTotalScore: {
    fontWeight: '700',
  },
  teamStatsContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    marginBottom: 4,
  },
  teamStatsLabelCol: {
    flex: 1,
  },
  teamStatsTeamHeader: {
    width: 56,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  teamStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  teamStatsLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  teamStatsValue: {
    width: 56,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  runBadge: {
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBadgeHot: {
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.35)',
  },
  runBadgeCold: {
    backgroundColor: 'rgba(10, 132, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.28)',
  },
  runBadgeNeutral: {
    backgroundColor: COLORS.cardAlt,
  },
  runBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  teamTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 4,
  },
  teamTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  teamTabActive: {
    backgroundColor: COLORS.cardAlt,
  },
  tabLogo: {
    width: 20,
    height: 20,
  },
  teamTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tabInactive,
  },
  teamTabTextActive: {
    color: COLORS.tabActive,
    fontWeight: '600',
  },
  statsScroll: {
    flex: 1,
    marginTop: 16,
    paddingBottom: 16,
  },
  statsTableContainer: {
    marginTop: 12,
    paddingBottom: 32,
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 4,
  },
  statsHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statsHeaderNameCell: {
    width: 130,
    paddingRight: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  playerRowPressed: {
    backgroundColor: COLORS.cardAlt,
    transform: [{ scale: 0.98 }],
  },
  playerNameCell: {
    width: 130,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boxScorePlayerPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },
  boxScorePlayerInitials: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '30',
  },
  boxScoreInitialsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  playerNameInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  playerPosition: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statCell: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  statCellHighlight: {
    fontWeight: '600',
  },
  plusMinusPositive: {
    color: COLORS.accent,
  },
  plusMinusNegative: {
    color: COLORS.live,
  },
  // Player Card Modal Styles
  playerCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  playerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerCardPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardAlt,
  },
  playerCardPhotoInitials: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '30',
  },
  playerCardInitialsText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
  },
  playerCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  playerCardPosition: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  playerCardClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCardCloseText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  playerCardMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.divider,
    marginBottom: 16,
  },
  playerCardMainStat: {
    alignItems: 'center',
  },
  playerCardMainStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  playerCardMainStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  playerCardDetailedStats: {
    gap: 12,
  },
  playerCardStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerCardStatLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  playerCardStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  viewFullProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    gap: 6,
  },
  viewFullProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  listPickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  listPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  listPickerCard: {
    backgroundColor: COLORS.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: '70%',
    padding: 20,
  },
  listPickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  listPickerHeaderText: {
    flex: 1,
  },
  listPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listPickerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listPickerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardAlt,
  },
  listPickerList: {
    maxHeight: 360,
  },
  listPickerListContent: {
    gap: 10,
  },
  listPickerItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listPickerItemMain: {
    flex: 1,
  },
  listPickerItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  listPickerItemMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  listPickerBadge: {
    borderRadius: 999,
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listPickerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  listPickerEmpty: {
    gap: 14,
  },
  listPickerEmptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  listPickerCreateButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPickerCreateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#04130A',
  },
});
