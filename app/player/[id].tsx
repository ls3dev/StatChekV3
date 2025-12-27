import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PlayerCard } from '@/components/PlayerCard';
import players from '@/data/players.json';
import type { Player } from '@/types';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const player = (players as Player[]).find((p) => p.id === id);

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


