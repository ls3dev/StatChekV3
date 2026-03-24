import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BrandGradient, DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { ListType } from '@/types';

type CreateListModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description: string | undefined, listType: ListType) => void;
  initialListType?: ListType;
};

const LIST_TYPE_OPTIONS: {
  value: ListType;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'ranking', label: 'Ranking', description: 'Ordered list for 1 or more players.', icon: 'list' },
  { value: 'agenda', label: 'Agenda', description: 'Single-player take with receipts.', icon: 'megaphone' },
  { value: 'vs', label: 'VS', description: 'Head-to-head layout capped at 2 players.', icon: 'people' },
];

export function CreateListModal({ visible, onClose, onSave, initialListType = 'ranking' }: CreateListModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [listType, setListType] = useState<ListType>(initialListType);

  useEffect(() => {
    if (visible) {
      setListType(initialListType);
    }
  }, [visible, initialListType]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined, listType);
      setName('');
      setDescription('');
      setListType(initialListType);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setListType(initialListType);
    onClose();
  };

  const isValid = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark
                ? DesignTokens.backgroundSecondaryDark
                : DesignTokens.backgroundSecondary,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}>
              New List
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              Type
            </Text>
            <View style={styles.typeGrid}>
              {LIST_TYPE_OPTIONS.map((option) => {
                const selected = option.value === listType;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setListType(option.value)}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                        borderColor: selected ? BrandGradient.start : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      },
                    ]}>
                    <View style={styles.typeHeader}>
                      <Ionicons name={option.icon} size={18} color={selected ? BrandGradient.start : (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted)} />
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                        ]}>
                        {option.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.typeDescription,
                        { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                      ]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Name input */}
          <View style={styles.inputGroup}>
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
                  backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                  color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
              placeholder={
                listType === 'vs'
                  ? 'e.g., Kobe vs MJ'
                  : listType === 'agenda'
                    ? 'e.g., The Luka agenda'
                    : 'e.g., Top 10 NBA Centers'
              }
              placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Description input */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                  color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
              placeholder="Add a description..."
              placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [BrandGradient.start, BrandGradient.end] : ['#9CA3AF', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}>
              <Text style={styles.saveButtonText}>
                Create {LIST_TYPE_OPTIONS.find((option) => option.value === listType)?.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  title: {
    ...Typography.displaySmall,
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.md,
  },
  typeGrid: {
    gap: DesignTokens.spacing.sm,
  },
  typeCard: {
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  typeLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  typeDescription: {
    ...Typography.caption,
    lineHeight: 18,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    ...Typography.headline,
    fontSize: 15,
  },
});
