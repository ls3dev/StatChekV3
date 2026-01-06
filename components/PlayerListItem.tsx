import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from './themed-text';
import type { Player } from '@/types';

type Props = {
  player: Player;
  onPress?: () => void;
};

export function PlayerListItem({ player, onPress }: Props) {
  const content = (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold">{player.name}</ThemedText>
        <ThemedText type="default">
          {player.team !== 'N/A' && player.position !== 'N/A'
            ? `${player.position} • ${player.team}`
            : player.team !== 'N/A'
              ? player.team
              : player.position !== 'N/A'
                ? player.position
                : ''}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (onPress) {
    return content;
  }

  return (
    <Link href={`/player/${player.id}`} asChild>
      {content}
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


