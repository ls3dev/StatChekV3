import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PlayerCard } from '@/components/PlayerCard';
import players from '@/data/nba_playersv2.json';
import type { Player } from '@/types';

// Create a Map for O(1) player lookups
const playerMap = new Map<string, Player>((players as Player[]).map(p => [p.id, p]));

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const player = playerMap.get(id);

  if (!player) {
    return (
      <>
        <Stack.Screen options={{ title: 'Player not found' }} />
        <ThemedView style={styles.center}>
          <ThemedText type="title">Player not found</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: player.name }} />
      <ThemedView style={styles.container}>
        <PlayerCard player={player} />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


