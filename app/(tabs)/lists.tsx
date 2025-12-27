import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLists } from '@/hooks/useLists';

export default function ListsScreen() {
  const { lists } = useLists();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">My Lists</ThemedText>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/list/${item.id}`} asChild>
            <TouchableOpacity style={styles.item}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText type="default">
                {item.players.length} player{item.players.length === 1 ? '' : 's'}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <ThemedText type="default">You don&apos;t have any lists yet.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  listContent: {
    gap: 8,
  },
  item: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});


