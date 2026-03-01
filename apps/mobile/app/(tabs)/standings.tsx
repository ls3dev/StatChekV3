import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAction, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { GradientHeader } from '@/components/GradientHeader';
import { SportSelector } from '@/components/SportSelector';
import { StandingsTable } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSport } from '@/context/SportContext';
import { api } from '@statcheck/convex';

type Conference = 'East' | 'West';

interface Standing {
  team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
    conference: string;
    division: string;
  };
  season: number;
  wins: number;
  losses: number;
  conference_rank: number;
  conference_record: string;
  division_rank: number;
  division_record: string;
  home_record: string;
  road_record: string;
}

export default function StandingsScreen() {
  const { isDark } = useTheme();
  const { selectedSport } = useSport();
  const router = useRouter();
  const [selectedConference, setSelectedConference] = useState<Conference>('East');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const getStandings = useAction(api.nba.getStandings);
  const currentSeason = useQuery(api.nba.getCurrentSeason);

  const isNBA = selectedSport === 'NBA';

  const fetchStandings = useCallback(
    async (showRefreshing = false) => {
      // Only fetch for NBA - NFL/MLB coming soon
      if (!isNBA) {
        setStandings([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await getStandings({});
        setStandings(result.standings as Standing[]);
        setCachedAt(result.cachedAt);
      } catch (err: any) {
        console.error('Failed to fetch standings:', err);
        setError(err.message || 'Failed to load standings');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getStandings, isNBA]
  );

  // Fetch standings on mount and when sport changes
  React.useEffect(() => {
    fetchStandings();
  }, [selectedSport]);

  const handleRefresh = useCallback(() => {
    fetchStandings(true);
  }, [fetchStandings]);

  const handleTeamPress = useCallback(
    (team: Standing['team']) => {
      router.push(`/team/${team.id}`);
    },
    [router]
  );

  const seasonLabel = currentSeason
    ? `${currentSeason}-${(currentSeason + 1).toString().slice(-2)}`
    : '';

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
      <GradientHeader title={isNBA ? `Standings ${seasonLabel}` : 'Standings'} />

      {/* Sport Selector */}
      <SportSelector compact />

      {/* Coming Soon for non-NBA sports */}
      {!isNBA ? (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonIcon}>
            {selectedSport === 'NFL' ? '🏈' : '⚾'}
          </Text>
          <Text style={[styles.comingSoonTitle, isDark && styles.textDark]}>
            {selectedSport} Standings Coming Soon
          </Text>
          <Text style={[styles.comingSoonText, isDark && styles.textSecondary]}>
            We're working on bringing you {selectedSport} standings. Stay tuned!
          </Text>
        </View>
      ) : (
        <>
          {/* Conference Selector */}
          <View style={[styles.conferenceSelectorContainer, isDark && styles.conferenceSelectorContainerDark]}>
            {(['East', 'West'] as Conference[]).map((conf) => (
              <Pressable
                key={conf}
                style={[
                  styles.conferenceButton,
                  selectedConference === conf && styles.conferenceButtonSelected,
                ]}
                onPress={() => setSelectedConference(conf)}
              >
                <Text
                  style={[
                    styles.conferenceButtonText,
                    isDark && styles.textDark,
                    selectedConference === conf && styles.conferenceButtonTextSelected,
                  ]}
                >
                  {conf === 'East' ? 'Eastern' : 'Western'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignTokens.accentGreen} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={DesignTokens.accentError} />
          <Text style={[styles.errorText, isDark && styles.textSecondary]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchStandings()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
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
              tintColor={DesignTokens.accentGreen}
            />
          }
        >
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: DesignTokens.accentSuccess }]} />
              <Text style={[styles.legendText, isDark && styles.textSecondary]}>Playoff spot</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: DesignTokens.accentGreen }]} />
              <Text style={[styles.legendText, isDark && styles.textSecondary]}>Play-in (7-10)</Text>
            </View>
          </View>

          {/* Standings Table */}
          <View style={[styles.tableContainer, isDark && styles.tableContainerDark]}>
            <StandingsTable
              standings={standings}
              conference={selectedConference}
              onTeamPress={handleTeamPress}
            />
          </View>

          {/* Cache info */}
          {cachedAt && (
            <Text style={[styles.cacheInfo, isDark && styles.textMuted]}>
              Updated {new Date(cachedAt).toLocaleTimeString()}
            </Text>
          )}
        </ScrollView>
      )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conferenceSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.backgroundSecondary,
    gap: DesignTokens.spacing.sm,
  },
  conferenceSelectorContainerDark: {
    backgroundColor: DesignTokens.backgroundSecondaryDark,
  },
  conferenceButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
  },
  conferenceButtonSelected: {
    backgroundColor: DesignTokens.accentGreen,
  },
  conferenceButtonText: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
  },
  conferenceButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
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
    backgroundColor: DesignTokens.accentGreen,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
  },
  retryButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
  },
  tableContainer: {
    backgroundColor: DesignTokens.cardBackground,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  tableContainerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
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
