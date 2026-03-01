import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { NBA_TEAM_LIST } from '@/constants/nbaTeams';
import { getNBATeamLogoUrl } from '@/constants/nbaTeamLogos';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const LOGO_SIZE = 48;
const COLUMNS = 5;

export function TeamsGrid() {
  const { isDark } = useTheme();
  const router = useRouter();

  const handleTeamPress = (teamId: number) => {
    router.push(`/team/${teamId}`);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
        ]}>
        NBA Teams
      </Text>
      <View style={styles.grid}>
        {NBA_TEAM_LIST.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={styles.teamItem}
            onPress={() => handleTeamPress(team.id)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
              ]}>
              <Image
                source={{ uri: getNBATeamLogoUrl(team.abbreviation) }}
                style={styles.logo}
                contentFit="contain"
                transition={200}
              />
            </View>
            <Text
              style={[
                styles.abbreviation,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              {team.abbreviation}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 18,
    marginBottom: DesignTokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamItem: {
    width: `${100 / COLUMNS}%`,
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  logoContainer: {
    width: LOGO_SIZE + 8,
    height: LOGO_SIZE + 8,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  abbreviation: {
    ...Typography.captionSmall,
    marginTop: 4,
    fontWeight: '600',
  },
});
