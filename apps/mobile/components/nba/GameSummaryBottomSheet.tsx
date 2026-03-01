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

import { DesignTokens, Typography } from '@/constants/theme';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
import { api } from '@statcheck/convex';
import { getAllPlayers } from '@/services/playerData';
import { usePlayerData } from '@/context/PlayerDataContext';

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
  const { isLoaded: playerDataLoaded } = usePlayerData();

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'visitor'>('visitor');
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBoxScore | null>(null);

  const getBoxScore = useAction(api.nba.getBoxScore);

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
      <Modal visible={!!selectedPlayer} transparent animationType="fade" onRequestClose={() => setSelectedPlayer(null)}>
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
          </Pressable>
        </Pressable>
      </Modal>
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
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Player Stats Card Modal */}
        {renderPlayerCard()}
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
    paddingBottom: 16,
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
});
