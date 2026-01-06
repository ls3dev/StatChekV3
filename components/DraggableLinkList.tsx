import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { PlayerLink } from '@/types';
import { LinkItem } from './LinkItem';

type DraggableLinkListProps = {
  links: PlayerLink[];
  onReorder: (newOrder: PlayerLink[]) => void;
  onEdit: (link: PlayerLink) => void;
  onDelete: (linkId: string) => void;
};

export function DraggableLinkList({ links, onReorder, onEdit, onDelete }: DraggableLinkListProps) {
  return (
    <View style={styles.container}>
      {links.map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});
