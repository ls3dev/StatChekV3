import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import type { PlayerList } from '@/types';

type Props = {
  list: PlayerList;
};

export function ListCard({ list }: Props) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="title">{list.name}</ThemedText>
        <ThemedText type="defaultSemiBold">
          {list.players.length} player{list.players.length === 1 ? '' : 's'}
        </ThemedText>
      </View>
      {list.description ? <ThemedText type="default">{list.description}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});


