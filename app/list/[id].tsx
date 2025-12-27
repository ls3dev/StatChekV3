import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLists } from '@/hooks/useLists';
import { PlayerListItem } from '@/components/PlayerListItem';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, getListById } = useLists();

  const list = getListById(id);

  if (!list) {
    return (
      <>
        <Stack.Screen options={{ title: 'List not found' }} />
        <ThemedView style={styles.center}>
          <ThemedText type="title">List not found</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: list.name }} />
      <ThemedView style={styles.container}>
        <FlatList
          data={list.players}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <PlayerListItem player={item} />}
        />
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
  separator: {
    height: 8,
  },
});


