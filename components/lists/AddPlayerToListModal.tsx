import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BrandGradient, DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLists } from '@/hooks/useLists';
import type { Player, PlayerList } from '@/types';

type AddPlayerToListModalProps = {
  visible: boolean;
  onClose: () => void;
  player: Player;
};

export function AddPlayerToListModal({ visible, onClose, player }: AddPlayerToListModalProps) {
  const { isDark } = useTheme();
  const { lists, createList, addPlayerToList, isPlayerInList } = useLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleAddToList = () => {
    if (selectedListId) {
      const success = addPlayerToList(selectedListId, player.id);
      if (success) {
        handleClose();
      }
    }
  };

  const handleCreateAndAdd = () => {
    if (newListName.trim()) {
      const newList = createList(newListName.trim());
      addPlayerToList(newList.id, player.id);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedListId(null);
    setShowNewListForm(false);
    setNewListName('');
    onClose();
  };

  const availableLists = lists.filter((list) => !isPlayerInList(list.id, player.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: isDark
                ? DesignTokens.backgroundSecondaryDark
                : DesignTokens.backgroundSecondary,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}>
              Add to List
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Player info */}
          <View
            style={[
              styles.playerInfo,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}>
            <Text
              style={[
                styles.playerName,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}
              numberOfLines={1}>
              {player.name}
            </Text>
            <Text
              style={[
                styles.playerTeam,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              {player.team !== 'N/A' && player.position !== 'N/A'
              ? `${player.team} · ${player.position}`
              : player.team !== 'N/A'
                ? player.team
                : player.position !== 'N/A'
                  ? player.position
                  : ''}
            </Text>
          </View>

          {!showNewListForm ? (
            <>
              {/* Lists */}
              <ScrollView style={styles.listsContainer} showsVerticalScrollIndicator={false}>
                {availableLists.length > 0 ? (
                  availableLists.map((list) => (
                    <ListOption
                      key={list.id}
                      list={list}
                      isSelected={selectedListId === list.id}
                      onSelect={() => setSelectedListId(list.id)}
                      isDark={isDark}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                      ]}>
                      {lists.length === 0
                        ? 'No lists yet. Create one below!'
                        : 'Player is already in all your lists.'}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Divider */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                ]}
              />

              {/* Create new list button */}
              <TouchableOpacity
                style={styles.createListButton}
                onPress={() => setShowNewListForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={DesignTokens.accentPurple} />
                <Text style={[styles.createListText, { color: DesignTokens.accentPurple }]}>
                  Create New List
                </Text>
              </TouchableOpacity>

              {/* Add button */}
              {availableLists.length > 0 && (
                <TouchableOpacity
                  style={[styles.addButton, !selectedListId && styles.addButtonDisabled]}
                  onPress={handleAddToList}
                  activeOpacity={0.8}
                  disabled={!selectedListId}>
                  <LinearGradient
                    colors={
                      selectedListId
                        ? [BrandGradient.start, BrandGradient.end]
                        : ['#9CA3AF', '#9CA3AF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButtonGradient}>
                    <Text style={styles.addButtonText}>Add to List</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {/* New list form */}
              <View style={styles.newListForm}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}>
                  List Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? DesignTokens.cardBackgroundDark
                        : DesignTokens.cardBackground,
                      color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  placeholder="e.g., Top 10 Centers"
                  placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
                  value={newListName}
                  onChangeText={setNewListName}
                  autoFocus
                  maxLength={50}
                />
              </View>

              {/* Buttons */}
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                  ]}
                  onPress={() => {
                    setShowNewListForm(false);
                    setNewListName('');
                  }}>
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                    ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    !newListName.trim() && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateAndAdd}
                  disabled={!newListName.trim()}>
                  <LinearGradient
                    colors={
                      newListName.trim()
                        ? [BrandGradient.start, BrandGradient.end]
                        : ['#9CA3AF', '#9CA3AF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createButtonGradient}>
                    <Text style={styles.createButtonText}>Create & Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// List option component
function ListOption({
  list,
  isSelected,
  onSelect,
  isDark,
}: {
  list: PlayerList;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.listOption,
        isSelected && {
          backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',
          borderColor: DesignTokens.accentPurple,
        },
        !isSelected && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderColor: 'transparent',
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}>
      <View style={styles.listOptionContent}>
        <Ionicons
          name="list"
          size={20}
          color={isSelected ? DesignTokens.accentPurple : isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
        />
        <View style={styles.listOptionInfo}>
          <Text
            style={[
              styles.listOptionName,
              { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
            ]}
            numberOfLines={1}>
            {list.name}
          </Text>
          <Text
            style={[
              styles.listOptionMeta,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            {list.players.length} player{list.players.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.radio,
          isSelected && { backgroundColor: DesignTokens.accentPurple, borderColor: DesignTokens.accentPurple },
          !isSelected && {
            borderColor: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted,
          },
        ]}>
        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  title: {
    ...Typography.displaySmall,
  },
  playerInfo: {
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    marginBottom: DesignTokens.spacing.md,
  },
  playerName: {
    ...Typography.headline,
    marginBottom: 2,
  },
  playerTeam: {
    ...Typography.caption,
  },
  listsContainer: {
    maxHeight: 200,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    marginBottom: DesignTokens.spacing.sm,
    borderWidth: 2,
  },
  listOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  listOptionInfo: {
    flex: 1,
  },
  listOptionName: {
    ...Typography.body,
    fontWeight: '600',
  },
  listOptionMeta: {
    ...Typography.caption,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: DesignTokens.spacing.md,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.xs,
    paddingVertical: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
  },
  createListText: {
    ...Typography.body,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    ...Typography.headline,
    fontSize: 15,
  },
  newListForm: {
    marginBottom: DesignTokens.spacing.lg,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: DesignTokens.spacing.xs,
    marginLeft: DesignTokens.spacing.xs,
  },
  input: {
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    ...Typography.body,
  },
  formButtons: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    ...Typography.headline,
    fontSize: 15,
  },
});
