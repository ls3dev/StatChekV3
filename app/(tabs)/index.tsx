import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { PlayerCard } from '@/components/PlayerCard';
import { PlayerListItem } from '@/components/PlayerListItem';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import playersData from '@/data/players.json';
import { usePlayerSearch } from '@/hooks/usePlayerSearch';
import type { Player } from '@/types';

const CARD_WIDTH = 280;
const CARD_SPACING = 20;

export default function SearchTab() {
  const { query, results, setQuery } = usePlayerSearch();
  const scrollViewRef = useRef<FlatList>(null);
  const scrollOffset = useRef(0);
  const players = playersData as Player[];
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  // Duplicate players for infinite scroll effect
  const duplicatedPlayers = [...players, ...players, ...players];

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleDismiss = () => {
    setSelectedPlayer(null);
  };

  useEffect(() => {
    if (query) return; // Don't auto-scroll when searching

    const scrollInterval = setInterval(() => {
      scrollOffset.current += 0.5; // Slow scroll speed
      const maxOffset = players.length * (CARD_WIDTH + CARD_SPACING);
      
      // Reset to beginning when reaching the end of first set
      if (scrollOffset.current >= maxOffset) {
        scrollOffset.current = 0;
        scrollViewRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        scrollViewRef.current?.scrollToOffset({
          offset: scrollOffset.current,
          animated: true,
        });
      }
    }, 50); // Update every 50ms for smooth scrolling

    return () => clearInterval(scrollInterval);
  }, [query, players.length]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Search Players</ThemedText>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name or team" />

      {!query && (
        <View style={styles.carouselContainer}>
          <ThemedText type="default" style={styles.carouselLabel}>
            Start typing to search your players.
          </ThemedText>
          <FlatList
            ref={scrollViewRef}
            data={duplicatedPlayers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <PlayerCard player={item} />
              </View>
            )}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + CARD_SPACING,
              offset: (CARD_WIDTH + CARD_SPACING) * index,
              index,
            })}
            scrollEnabled={false}
          />
        </View>
      )}

      {query && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <PlayerListItem player={item} onPress={() => handlePlayerSelect(item)} />
          )}
          ListEmptyComponent={
            <ThemedText type="default">No players found. Try a different search.</ThemedText>
          }
        />
      )}

      <PlayerCardBottomSheet
        player={selectedPlayer}
        isVisible={!!selectedPlayer}
        onDismiss={handleDismiss}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  carouselContainer: {
    marginTop: 8,
  },
  carouselLabel: {
    marginBottom: 12,
  },
  carouselContent: {
    paddingRight: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: 200,
    marginRight: CARD_SPACING,
  },
  listContent: {
    paddingTop: 8,
  },
  separator: {
    height: 8,
  },
});
