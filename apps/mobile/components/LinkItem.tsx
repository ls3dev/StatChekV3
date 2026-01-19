import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { PlayerLink } from '@/types';

type LinkItemProps = {
  link: PlayerLink;
  onEdit: (link: PlayerLink) => void;
  onDelete: (linkId: string) => void;
  isDefault?: boolean;
  animatedStyle?: ReturnType<typeof useAnimatedStyle>;
};

export function LinkItem({ link, onEdit, onDelete, isDefault, animatedStyle }: LinkItemProps) {
  const handlePress = async () => {
    try {
      await openBrowserAsync(link.url);
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Link', `Are you sure you want to delete "${link.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(link.id) },
    ]);
  };

  const Container = animatedStyle ? Animated.View : View;
  const containerProps = animatedStyle ? { style: [styles.container, animatedStyle] } : { style: styles.container };

  return (
    <Container {...containerProps}>
      <TouchableOpacity style={styles.linkContent} onPress={handlePress} activeOpacity={0.7}>
        <Ionicons name="link" size={18} color="#2196F3" style={styles.linkIcon} />
        <Text style={styles.linkTitle} numberOfLines={1}>
          {link.title}
        </Text>
      </TouchableOpacity>

      {!isDefault && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(link)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color="#e53935" />
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  linkContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    marginRight: 10,
  },
  linkTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});
