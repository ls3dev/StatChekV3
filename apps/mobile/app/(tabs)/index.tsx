import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { HeroSearchCard } from '@/components/HeroSearchCard';
import { RecentPlayersSection } from '@/components/RecentPlayersSection';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { DesignTokens } from '@/constants/theme';
import { useRecentPlayers } from '@/context/RecentPlayersContext';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

export default function HomeScreen() {
  const { isDark } = useTheme();
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
      <GradientHeader title="StatChek" overlapPadding={50} />

      {/* Floating search card with dropdown */}
      <HeroSearchCard onPlayerSelect={handlePlayerSelect} />

      {/* Recent players section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <RecentPlayersSection
          players={recentPlayers}
          onPlayerSelect={handlePlayerSelect}
          onClear={handleClearRecentPlayers}
        />
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
});
