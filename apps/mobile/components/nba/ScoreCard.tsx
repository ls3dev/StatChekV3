import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';

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

interface ScoreCardProps {
  game: Game;
  onPress?: () => void;
}

export function ScoreCard({ game, onPress }: ScoreCardProps) {
  const { isDark } = useTheme();

  // Game status can be: "Final", "1st Qtr", "2nd Qtr", "3rd Qtr", "4th Qtr", "Halftime", or a datetime string
  const isFinal = game.status === 'Final';
  const isScheduled = !isFinal && (game.status.includes('T') || game.period === 0);
  const isLive = !isFinal && !isScheduled;

  const homeWinning = game.home_team_score > game.visitor_team_score;
  const visitorWinning = game.visitor_team_score > game.home_team_score;

  const getStatusText = () => {
    if (isFinal) {
      return 'Final';
    }
    if (isLive) {
      // Use time if available, otherwise use status (e.g., "4th Qtr")
      return game.time || game.status;
    }
    // Scheduled - parse datetime to show local time
    try {
      const date = new Date(game.status);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return game.status;
    }
  };

  const getStatusColor = () => {
    if (isLive) return DesignTokens.accentError;
    if (isFinal) return DesignTokens.textMuted;
    return DesignTokens.textSecondary;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isDark && styles.containerDark,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* Live indicator */}
      {isLive && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {game.postseason && (
          <View style={styles.playoffBadge}>
            <Text style={styles.playoffText}>PLAYOFFS</Text>
          </View>
        )}
      </View>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        {/* Visitor Team */}
        <View style={styles.teamRow}>
          <Image
            source={{ uri: getNBATeamLogoUrl(game.visitor_team.abbreviation) }}
            style={styles.teamLogo}
          />
          <View style={styles.teamInfo}>
            <Text
              style={[
                styles.teamAbbr,
                isDark && styles.textDark,
                isFinal && visitorWinning && styles.winningTeam,
              ]}
            >
              {game.visitor_team.abbreviation}
            </Text>
            <Text style={[styles.teamName, isDark && styles.textSecondary]}>
              {game.visitor_team.city}
            </Text>
          </View>
          {!isScheduled && (
            <Text
              style={[
                styles.score,
                isDark && styles.textDark,
                isFinal && visitorWinning && styles.winningScore,
                isFinal && !visitorWinning && styles.losingScore,
              ]}
            >
              {game.visitor_team_score}
            </Text>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, isDark && styles.dividerDark]} />

        {/* Home Team */}
        <View style={styles.teamRow}>
          <Image
            source={{ uri: getNBATeamLogoUrl(game.home_team.abbreviation) }}
            style={styles.teamLogo}
          />
          <View style={styles.teamInfo}>
            <Text
              style={[
                styles.teamAbbr,
                isDark && styles.textDark,
                isFinal && homeWinning && styles.winningTeam,
              ]}
            >
              {game.home_team.abbreviation}
            </Text>
            <Text style={[styles.teamName, isDark && styles.textSecondary]}>
              {game.home_team.city}
            </Text>
          </View>
          {!isScheduled && (
            <Text
              style={[
                styles.score,
                isDark && styles.textDark,
                isFinal && homeWinning && styles.winningScore,
                isFinal && !homeWinning && styles.losingScore,
              ]}
            >
              {game.home_team_score}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
    ...DesignTokens.shadow.sm,
  },
  containerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  liveIndicator: {
    position: 'absolute',
    top: DesignTokens.spacing.sm,
    right: DesignTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignTokens.accentError,
    marginRight: 4,
  },
  liveText: {
    ...Typography.captionSmall,
    color: DesignTokens.accentError,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  status: {
    ...Typography.caption,
    fontWeight: '500',
  },
  playoffBadge: {
    backgroundColor: '#30D158',
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
    marginLeft: DesignTokens.spacing.sm,
  },
  playoffText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  teamsContainer: {
    gap: DesignTokens.spacing.xs,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignTokens.spacing.xs,
  },
  teamLogo: {
    width: 32,
    height: 32,
    marginRight: DesignTokens.spacing.sm,
  },
  teamInfo: {
    flex: 1,
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
  score: {
    ...Typography.displaySmall,
    color: DesignTokens.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  winningTeam: {
    color: DesignTokens.textPrimary,
    fontWeight: '700',
  },
  winningScore: {
    fontWeight: '700',
  },
  losingScore: {
    color: DesignTokens.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DesignTokens.border,
    marginVertical: DesignTokens.spacing.xs,
  },
  dividerDark: {
    backgroundColor: DesignTokens.borderDark,
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
