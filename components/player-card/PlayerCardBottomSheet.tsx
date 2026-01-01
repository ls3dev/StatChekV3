import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Player } from '@/types';
import { PlayerCardContent } from './PlayerCardContent';

type PlayerCardBottomSheetProps = {
  player: Player | null;
  isVisible: boolean;
  onDismiss: () => void;
};

export function PlayerCardBottomSheet({ player, isVisible, onDismiss }: PlayerCardBottomSheetProps) {
  if (!player || !isVisible) return null;

  // Use Modal for web, native bottom sheet can be added later for mobile
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />
          <View style={styles.cardWrapper}>
            <PlayerCardContent player={player} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
