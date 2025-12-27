import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from './themed-text';
import type { Player } from '@/types';

type Props = {
  player: Player;
};

export function PlayerListItem({ player }: Props) {
  return (
    <Link href={`/player/${player.id}`} asChild>
      <TouchableOpacity style={styles.container}>
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold">{player.name}</ThemedText>
          <ThemedText type="default">
            {player.position} • {player.team}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    gap: 2,
  },
});


