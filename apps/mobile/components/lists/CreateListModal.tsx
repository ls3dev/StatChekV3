import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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

export function CreateListModal({ visible, onClose, onSave }: CreateListModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), undefined, 'ranking');
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
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

          {/* Name input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                  color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
              placeholder="List name"
              placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoFocus
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
              <Text style={styles.saveButtonText}>Create List</Text>
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
  input: {
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    ...Typography.body,
  },
  saveButton: {
    marginTop: DesignTokens.spacing.sm,
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
