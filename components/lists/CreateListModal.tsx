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

type CreateListModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
};

export function CreateListModal({ visible, onClose, onSave }: CreateListModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
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
              placeholder="e.g., Top 10 NBA Centers"
              placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
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
