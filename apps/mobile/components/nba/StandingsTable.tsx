import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  name: string;
  conference: string;
  division: string;
}

interface Standing {
  team: Team;
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

interface StandingsTableProps {
  standings: Standing[];
  conference: 'East' | 'West';
  onTeamPress?: (team: Team) => void;
}

export function StandingsTable({ standings, conference, onTeamPress }: StandingsTableProps) {
  const { isDark } = useTheme();

  // Filter by conference (from team object) and sort by conference rank
  const conferenceStandings = standings
    .filter((s) => s.team.conference === conference)
    .sort((a, b) => a.conference_rank - b.conference_rank);

  // Calculate win percentage
  const getWinPct = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? wins / total : 0;
  };

  // Calculate games behind leader
  const getGamesBehind = (standing: Standing, index: number) => {
    if (index === 0) return '-';
    const leader = conferenceStandings[0];
    const leaderWinDiff = leader.wins - standing.wins;
    const leaderLossDiff = standing.losses - leader.losses;
    const gb = (leaderWinDiff + leaderLossDiff) / 2;
    return gb.toFixed(1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRow, isDark && styles.headerRowDark]}>
        <Text style={[styles.rankHeader, isDark && styles.textDark]}>#</Text>
        <Text style={[styles.teamHeader, isDark && styles.textDark]}>Team</Text>
        <Text style={[styles.statHeader, isDark && styles.textDark]}>W</Text>
        <Text style={[styles.statHeader, isDark && styles.textDark]}>L</Text>
        <Text style={[styles.statHeader, isDark && styles.textDark]}>PCT</Text>
        <Text style={[styles.statHeader, isDark && styles.textDark]}>GB</Text>
      </View>

      {/* Rows */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {conferenceStandings.map((standing, index) => {
          const isPlayoffSpot = index < 10;
          const isPlayIn = index >= 6 && index < 10;

          return (
            <Pressable
              key={standing.team.id}
              style={({ pressed }) => [
                styles.row,
                isDark && styles.rowDark,
                isPlayIn && styles.playInRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() => onTeamPress?.(standing.team)}
            >
              <Text
                style={[
                  styles.rank,
                  isDark && styles.textDark,
                  !isPlayoffSpot && styles.textMuted,
                ]}
              >
                {index + 1}
              </Text>
              <View style={styles.teamCell}>
                <Text
                  style={[styles.teamAbbr, isDark && styles.textDark]}
                  numberOfLines={1}
                >
                  {standing.team.abbreviation}
                </Text>
                <Text
                  style={[styles.teamName, isDark && styles.textSecondary]}
                  numberOfLines={1}
                >
                  {standing.team.city}
                </Text>
              </View>
              <Text style={[styles.stat, isDark && styles.textDark]}>
                {standing.wins}
              </Text>
              <Text style={[styles.stat, isDark && styles.textSecondary]}>
                {standing.losses}
              </Text>
              <Text style={[styles.stat, isDark && styles.textDark]}>
                {getWinPct(standing.wins, standing.losses).toFixed(3).replace('0.', '.')}
              </Text>
              <Text style={[styles.stat, isDark && styles.textSecondary]}>
                {getGamesBehind(standing, index)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  headerRowDark: {
    backgroundColor: DesignTokens.backgroundSecondaryDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm + 2,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  rowDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderBottomColor: DesignTokens.borderDark,
  },
  rowPressed: {
    opacity: 0.7,
  },
  playInRow: {
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  rankHeader: {
    width: 24,
    ...Typography.label,
    color: DesignTokens.textSecondary,
    textAlign: 'center',
  },
  teamHeader: {
    flex: 1,
    ...Typography.label,
    color: DesignTokens.textSecondary,
  },
  statHeader: {
    width: 36,
    ...Typography.label,
    color: DesignTokens.textSecondary,
    textAlign: 'center',
  },
  rank: {
    width: 24,
    ...Typography.body,
    color: DesignTokens.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  teamCell: {
    flex: 1,
    paddingLeft: DesignTokens.spacing.xs,
  },
  teamAbbr: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
  },
  teamName: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginTop: 1,
  },
  stat: {
    width: 36,
    ...Typography.body,
    color: DesignTokens.textPrimary,
    textAlign: 'center',
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
  textMuted: {
    color: DesignTokens.textMuted,
  },
});
