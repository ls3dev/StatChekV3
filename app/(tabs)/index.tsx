import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { HeroSearchCard } from '@/components/HeroSearchCard';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { DesignTokens } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
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

      {/* Empty state - clean space below search */}
      <View style={styles.content} />

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
});
