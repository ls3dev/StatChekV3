import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Player } from '@/types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type PlayerCardFrontProps = {
  player: Player;
};

export function PlayerCardFront({ player }: PlayerCardFrontProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <ThemedView style={styles.cardContent}>
      <View style={styles.header}>
        {player.photoUrl && !imageError ? (
          <Image
            source={{ uri: player.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            onError={() => setImageError(true)}
            transition={200}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <ThemedText type="defaultSemiBold" style={styles.placeholderText}>
              {player.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText type="title">{player.name}</ThemedText>
          <ThemedText type="defaultSemiBold">{player.position}</ThemedText>
        </View>
      </View>

      <ThemedText type="default">{player.team}</ThemedText>

      {player.stats && (
        <View style={styles.statsRow}>
          {Object.entries(player.stats).map(([key, value]) => (
            <View key={key} style={styles.stat}>
              <ThemedText type="defaultSemiBold">{value}</ThemedText>
              <ThemedText type="default">{key}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    borderRadius: 12,
    padding: 24,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  stat: {
    minWidth: 60,
  },
});
