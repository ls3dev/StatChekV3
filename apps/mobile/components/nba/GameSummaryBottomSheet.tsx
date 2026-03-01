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
} from 'react-native';
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

import { DesignTokens, Typography } from '@/constants/theme';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
import { api } from '@statcheck/convex';

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

type GameSummaryBottomSheetProps = {
  game: Game | null;
  isVisible: boolean;
  onDismiss: () => void;
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

export function GameSummaryBottomSheet({ game, isVisible, onDismiss }: GameSummaryBottomSheetProps) {
  const router = useRouter();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'visitor'>('visitor');
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBoxScore = useAction(api.nba.getBoxScore);

  const fetchBoxScore = useCallback(async () => {
    if (!game) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBoxScore({
        date: game.date.split('T')[0],
        homeTeamId: game.home_team.id,
        visitorTeamId: game.visitor_team.id,
      });

      setBoxScore(result.boxScore as BoxScore | null);
      setIsLive(result.isLive);
    } catch (err: any) {
      console.error('Failed to fetch box score:', err);
      setError(err.message || 'Failed to load box score');
    } finally {
      setIsLoading(false);
    }
  }, [game, getBoxScore]);

  useEffect(() => {
    if (isVisible && game) {
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
      fetchBoxScore();
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
      setBoxScore(null);
      setSelectedTeam('visitor');
    }
  }, [isVisible, game, translateY, backdropOpacity, fetchBoxScore]);

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

  const handleTeamPress = (teamId: number) => {
    onDismiss();
    router.push(`/team/${teamId}`);
  };

  if (!game) return null;

  // Game status can be: "Final", "1st Qtr", "2nd Qtr", "3rd Qtr", "4th Qtr", "Halftime", "In Progress", or a datetime string for scheduled
  const isFinal = game.status === 'Final';
  const isScheduled = !isFinal && (game.status.includes('T') || game.period === 0);
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

  const renderQuarterScores = () => {
    if (!boxScore) return null;

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
        </View>
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

  const renderPlayerRow = (player: PlayerBoxScore, index: number) => {
    const isEven = index % 2 === 0;
    return (
      <View
        key={player.player.id}
        style={[styles.playerRow, isEven && styles.playerRowAlt]}
      >
        <View style={styles.playerNameCell}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.player.first_name.charAt(0)}. {player.player.last_name}
          </Text>
          <Text style={styles.playerPosition}>{player.player.position}</Text>
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
              <View style={styles.scheduledContainer}>
                <Text style={styles.scheduledText}>Game has not started yet</Text>
                <Text style={styles.scheduledSubtext}>Box score will be available once the game begins</Text>
              </View>
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
              <View style={styles.boxScoreContent}>
                {/* Quarter Scores */}
                {renderQuarterScores()}

                {/* Team Tabs */}
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

                {/* Stats Table */}
                <ScrollView style={styles.statsScroll} showsVerticalScrollIndicator={false}>
                  {/* Header Row */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      <View style={styles.statsHeader}>
                        <View style={styles.playerNameCell}>
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
              </View>
            )}
          </Animated.View>
        </GestureDetector>
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
  scheduledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  quarterTotalScore: {
    fontWeight: '700',
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
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  statsHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playerRowAlt: {
    backgroundColor: COLORS.card,
  },
  playerNameCell: {
    width: 100,
    paddingRight: 8,
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
});
