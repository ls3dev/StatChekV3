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
import { useAction } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { GradientHeader } from '@/components/GradientHeader';
import { SportSelector } from '@/components/SportSelector';
import { ScoreCard } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSport } from '@/context/SportContext';
import { api } from '@statcheck/convex';

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

type DateOffset = -1 | 0 | 1;

function formatDate(offset: DateOffset): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(offset: DateOffset): string {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return '';
}

export default function ScoresScreen() {
  const { isDark } = useTheme();
  const { selectedSport } = useSport();
  const [selectedDate, setSelectedDate] = useState<DateOffset>(0);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const getGames = useAction(api.nba.getGames);

  const fetchGames = useCallback(
    async (showRefreshing = false) => {
      // Only fetch for NBA - NFL/MLB coming soon
      if (selectedSport !== 'NBA') {
        setGames([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const date = formatDate(selectedDate);
        const result = await getGames({ date });
        setGames(result.games as Game[]);
        setCachedAt(result.cachedAt);
      } catch (err: any) {
        console.error('Failed to fetch games:', err);
        setError(err.message || 'Failed to load games');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getGames, selectedDate, selectedSport]
  );

  // Fetch games on mount and when date/sport changes
  React.useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleRefresh = useCallback(() => {
    fetchGames(true);
  }, [fetchGames]);

  // Separate games by status
  const { liveGames, completedGames, scheduledGames } = useMemo(() => {
    const live: Game[] = [];
    const completed: Game[] = [];
    const scheduled: Game[] = [];

    games.forEach((game) => {
      if (game.status === 'In Progress') {
        live.push(game);
      } else if (game.status === 'Final') {
        completed.push(game);
      } else {
        scheduled.push(game);
      }
    });

    return { liveGames: live, completedGames: completed, scheduledGames: scheduled };
  }, [games]);

  const hasLiveGames = liveGames.length > 0;

  // Check if current sport is supported
  const isNBA = selectedSport === 'NBA';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? DesignTokens.backgroundPrimaryDark
            : DesignTokens.backgroundPrimary,
        },
      ]}
    >
      <GradientHeader title="Scores" />

      {/* Sport Selector */}
      <SportSelector compact />

      {/* Date Selector - Only show for NBA */}
      {isNBA && (
        <View style={[styles.dateSelectorContainer, isDark && styles.dateSelectorContainerDark]}>
          {([-1, 0, 1] as DateOffset[]).map((offset) => (
            <Pressable
              key={offset}
              style={[
                styles.dateButton,
                selectedDate === offset && styles.dateButtonSelected,
              ]}
              onPress={() => setSelectedDate(offset)}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  isDark && styles.textDark,
                  selectedDate === offset && styles.dateButtonTextSelected,
                ]}
              >
                {formatDisplayDate(offset)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Coming Soon for non-NBA sports */}
      {!isNBA ? (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonIcon}>
            {selectedSport === 'NFL' ? '🏈' : '⚾'}
          </Text>
          <Text style={[styles.comingSoonTitle, isDark && styles.textDark]}>
            {selectedSport} Scores Coming Soon
          </Text>
          <Text style={[styles.comingSoonText, isDark && styles.textSecondary]}>
            We're working on bringing you live {selectedSport} scores. Stay tuned!
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignTokens.accentPurple} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={DesignTokens.accentError} />
          <Text style={[styles.errorText, isDark && styles.textSecondary]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchGames()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : games.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="basketball-outline"
            size={48}
            color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
          />
          <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
            No games {formatDisplayDate(selectedDate).toLowerCase()}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
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
          {/* Live Games */}
          {hasLiveGames && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              {liveGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
            </View>
          )}

          {/* Scheduled Games */}
          {scheduledGames.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>
                Upcoming
              </Text>
              {scheduledGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
            </View>
          )}

          {/* Completed Games */}
          {completedGames.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textSecondary]}>
                Final
              </Text>
              {completedGames.map((game) => (
                <ScoreCard key={game.id} game={game} />
              ))}
            </View>
          )}

          {/* Cache info */}
          {cachedAt && (
            <Text style={[styles.cacheInfo, isDark && styles.textMuted]}>
              Updated {new Date(cachedAt).toLocaleTimeString()}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.backgroundSecondary,
    gap: DesignTokens.spacing.sm,
  },
  dateSelectorContainerDark: {
    backgroundColor: DesignTokens.backgroundSecondaryDark,
  },
  dateButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
  },
  dateButtonSelected: {
    backgroundColor: DesignTokens.accentPurple,
  },
  dateButtonText: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
  },
  dateButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  retryButton: {
    backgroundColor: DesignTokens.accentPurple,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
  },
  retryButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
    marginTop: DesignTokens.spacing.md,
  },
  section: {
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.accentError,
    marginRight: 6,
  },
  liveText: {
    ...Typography.label,
    color: DesignTokens.accentError,
    fontWeight: '700',
  },
  cacheInfo: {
    ...Typography.captionSmall,
    color: DesignTokens.textMuted,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
  textMuted: {
    color: DesignTokens.textMutedDark,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: DesignTokens.spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.displaySmall,
    color: DesignTokens.textPrimary,
    marginBottom: DesignTokens.spacing.sm,
  },
  comingSoonText: {
    ...Typography.body,
    color: DesignTokens.textSecondary,
    textAlign: 'center',
  },
});
