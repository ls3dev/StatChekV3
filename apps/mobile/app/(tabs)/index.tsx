import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { HeroSearchCard } from '@/components/HeroSearchCard';
import { LeagueLeadersSection } from '@/components/LeagueLeadersSection';
import { RecentPlayersSection } from '@/components/RecentPlayersSection';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { DesignTokens, Typography } from '@/constants/theme';
import { useRecentPlayers } from '@/context/RecentPlayersContext';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { recentPlayers, addRecentPlayer, clearRecentPlayers } = useRecentPlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerSelect = async (player: Player) => {
    await addRecentPlayer(player);
    setSelectedPlayer(player);
  };

  const handleClearRecentPlayers = async () => {
    await clearRecentPlayers();
  };

  const handleDismiss = () => {
    setSelectedPlayer(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
        },
      ]}>
      {/* Gradient header with app title */}
      <GradientHeader title="StatCheck" overlapPadding={50} />

      {/* Floating search card with dropdown */}
      <HeroSearchCard onPlayerSelect={handlePlayerSelect} />

      {/* Content below search */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Create Your List CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            onPress={() => router.push('/(tabs)/lists')}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}>
              <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.ctaText}>Create Your List</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recent players section */}
        <RecentPlayersSection
          players={recentPlayers}
          onPlayerSelect={handlePlayerSelect}
          onClear={handleClearRecentPlayers}
        />

        {/* League Leaders */}
        <LeagueLeadersSection onPlayerSelect={handlePlayerSelect} />
      </ScrollView>

      {/* Bottom sheet for player details */}
      <PlayerCardBottomSheet player={selectedPlayer} isVisible={!!selectedPlayer} onDismiss={handleDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  ctaContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: 14,
    borderRadius: DesignTokens.radius.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
