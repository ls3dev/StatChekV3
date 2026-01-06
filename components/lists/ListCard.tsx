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
        <Ionicons name="list" size={28} color={DesignTokens.accentPurple} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}
          numberOfLines={2}>
          {list.name}
        </Text>
        {list.description && (
          <Text
            style={[
              styles.description,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}
            numberOfLines={2}>
            {list.description}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={24}
        color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.xl,
    marginBottom: DesignTokens.spacing.md,
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
    width: 56,
    height: 56,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  content: {
    flex: 1,
    paddingRight: DesignTokens.spacing.sm,
  },
  name: {
    ...Typography.displaySmall,
    fontSize: 18,
    marginBottom: 4,
  },
  description: {
    ...Typography.body,
    lineHeight: 20,
  },
});
