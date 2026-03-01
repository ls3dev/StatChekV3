import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateListModal, ListCard } from '@/components/lists';
import { SyncIndicator } from '@/components/SyncIndicator';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLists } from '@/hooks/useLists';

export default function ListsScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, setShowAuthPrompt } = useAuth();
  const { lists, createList } = useLists();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check auth before showing create modal
  const handleCreateButtonPress = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateList = async (name: string, description?: string) => {
    try {
      setShowCreateModal(false);
      await createList(name, description);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleListPress = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
          paddingTop: insets.top,
        },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
          ]}>
          My Lists
        </Text>
        <SyncIndicator size={20} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {lists.length > 0 ? (
          lists.map((list) => (
            <ListCard key={list.id} list={list} onPress={() => handleListPress(list.id)} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
              ]}>
              <Ionicons
                name="list-outline"
                size={48}
                color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}>
              No lists yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              Create your first list to organize players
            </Text>
            <TouchableOpacity
              onPress={handleCreateButtonPress}
              style={[styles.emptyButton, { backgroundColor: DesignTokens.accentGreen }]}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Create List</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleCreateButtonPress}
        style={[
          styles.floatingButton,
          { backgroundColor: DesignTokens.accentGreen },
        ]}
        activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateListModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
  },
  headerTitle: {
    ...Typography.displaySmall,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: DesignTokens.spacing.md,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  emptyTitle: {
    ...Typography.headline,
    fontSize: 20,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    marginTop: DesignTokens.spacing.md,
  },
  emptyButtonText: {
    color: '#fff',
    ...Typography.headline,
    fontSize: 15,
  },
  floatingButton: {
    position: 'absolute',
    bottom: DesignTokens.spacing.xl,
    right: DesignTokens.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
