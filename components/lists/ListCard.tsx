import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { PlayerList } from '@/types';

type ListCardProps = {
  list: PlayerList;
  onPress: () => void;
};

export function ListCard({ list, onPress }: ListCardProps) {
  const { isDark } = useTheme();

  const playerCount = list.players.length;
  const linkCount = list.links.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
          opacity: pressed ? 0.7 : 1,
        },
        isDark ? styles.cardShadowDark : styles.cardShadow,
      ]}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: DesignTokens.accentPurple + '15' }]}>
        <Ionicons name="list" size={24} color={DesignTokens.accentPurple} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}
          numberOfLines={1}>
          {list.name}
        </Text>
        <Text
          style={[
            styles.meta,
            { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
          ]}>
          {playerCount} player{playerCount !== 1 ? 's' : ''}
          {linkCount > 0 && ` · ${linkCount} link${linkCount !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    marginBottom: DesignTokens.spacing.sm,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...Typography.headline,
    marginBottom: 2,
  },
  meta: {
    ...Typography.caption,
  },
});
