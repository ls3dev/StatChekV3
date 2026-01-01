import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Player, PlayerLink } from '@/types';
import { AddLinkModal } from '../AddLinkModal';
import { DraggableLinkList } from '../DraggableLinkList';
import { LinkItem } from '../LinkItem';

type PlayerCardBackProps = {
  player: Player;
  links: PlayerLink[];
  isAtLimit: boolean;
  onAddLink: (url: string, title: string) => boolean;
  onUpdateLink: (linkId: string, updates: { url?: string; title?: string }) => void;
  onDeleteLink: (linkId: string) => void;
  onReorderLinks: (newOrder: PlayerLink[]) => void;
};

export function PlayerCardBack({
  player,
  links,
  isAtLimit,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onReorderLinks,
}: PlayerCardBackProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<PlayerLink | null>(null);

  const sportsReferenceLink: PlayerLink = {
    id: 'sports-reference',
    playerId: player.id,
    url: player.sportsReferenceUrl || '',
    title: 'Sports Reference',
    order: -1,
    createdAt: 0,
  };

  const handleAddPress = () => {
    if (isAtLimit) {
      // Use window.alert for web, Alert.alert for native
      if (typeof window !== 'undefined') {
        window.alert('Upgrade to Pro for unlimited links! You\'ve reached the free limit of 3 links.');
      } else {
        Alert.alert(
          'Upgrade to Pro',
          'You\'ve reached the free limit of 3 links. Upgrade to Pro for unlimited links!',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => console.log('Navigate to Pro') },
          ]
        );
      }
      return;
    }
    setShowAddModal(true);
  };

  const handleSaveLink = (url: string, title: string) => {
    if (editingLink) {
      onUpdateLink(editingLink.id, { url, title });
    } else {
      onAddLink(url, title);
    }
    setShowAddModal(false);
    setEditingLink(null);
  };

  const handleEdit = (link: PlayerLink) => {
    setEditingLink(link);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLink(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.teamName}>{player.team}</Text>
      </View>

      <ScrollView style={styles.linksContainer} showsVerticalScrollIndicator={false}>
        {player.sportsReferenceUrl && (
          <View style={styles.defaultLink}>
            <LinkItem
              link={sportsReferenceLink}
              onEdit={() => {}}
              onDelete={() => {}}
              isDefault
            />
          </View>
        )}

        {links.length > 0 && (
          <DraggableLinkList
            links={links}
            onReorder={onReorderLinks}
            onEdit={handleEdit}
            onDelete={onDeleteLink}
          />
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={handleAddPress} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Link</Text>
      </TouchableOpacity>

      <AddLinkModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    color: '#666',
  },
  linksContainer: {
    flex: 1,
    marginBottom: 16,
  },
  defaultLink: {
    marginBottom: 12,
    opacity: 0.8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
