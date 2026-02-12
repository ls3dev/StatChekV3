import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface InjuryBadgeProps {
  status: string;
  description?: string;
  returnDate?: string | null;
  compact?: boolean;
  onPress?: () => void;
}

type InjuryStatus = 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' | 'unknown';

const STATUS_CONFIG: Record<InjuryStatus, { color: string; label: string; icon: string }> = {
  out: {
    color: '#EF4444', // Red
    label: 'OUT',
    icon: 'close-circle',
  },
  doubtful: {
    color: '#F97316', // Orange
    label: 'DOUBTFUL',
    icon: 'alert-circle',
  },
  questionable: {
    color: '#F59E0B', // Amber
    label: 'QUESTIONABLE',
    icon: 'help-circle',
  },
  probable: {
    color: '#10B981', // Green
    label: 'PROBABLE',
    icon: 'checkmark-circle',
  },
  'day-to-day': {
    color: '#F59E0B', // Amber
    label: 'DAY-TO-DAY',
    icon: 'time',
  },
  unknown: {
    color: '#6B7280', // Gray
    label: 'INJURED',
    icon: 'medical',
  },
};

function normalizeStatus(status: string): InjuryStatus {
  const lower = status.toLowerCase();
  if (lower.includes('out')) return 'out';
  if (lower.includes('doubtful')) return 'doubtful';
  if (lower.includes('questionable')) return 'questionable';
  if (lower.includes('probable')) return 'probable';
  if (lower.includes('day-to-day') || lower.includes('day to day')) return 'day-to-day';
  return 'unknown';
}

export function InjuryBadge({
  status,
  description,
  returnDate,
  compact = false,
  onPress,
}: InjuryBadgeProps) {
  const { isDark } = useTheme();
  const normalizedStatus = normalizeStatus(status);
  const config = STATUS_CONFIG[normalizedStatus];

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          { backgroundColor: `${config.color}20` },
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Ionicons name={config.icon as any} size={12} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]}>
          {config.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.container,
        isDark && styles.containerDark,
        { borderLeftColor: config.color },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {description && (
        <Text style={[styles.description, isDark && styles.textSecondary]}>
          {description}
        </Text>
      )}

      {returnDate && (
        <View style={styles.returnDateContainer}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary}
          />
          <Text style={[styles.returnDate, isDark && styles.textSecondary]}>
            Expected return: {returnDate}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Locked version for non-pro users
interface InjuryBadgeLockedProps {
  onUnlockPress?: () => void;
}

export function InjuryBadgeLocked({ onUnlockPress }: InjuryBadgeLockedProps) {
  const { isDark } = useTheme();

  return (
    <Pressable
      style={[styles.lockedContainer, isDark && styles.containerDark]}
      onPress={onUnlockPress}
    >
      <View style={styles.lockedContent}>
        <Ionicons name="medical" size={18} color={DesignTokens.textMuted} />
        <Text style={[styles.lockedText, isDark && styles.textSecondary]}>
          Injury status
        </Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: DesignTokens.radius.sm,
    gap: 4,
  },
  compactText: {
    ...Typography.captionSmall,
    fontWeight: '700',
  },
  container: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.md,
    borderLeftWidth: 3,
    padding: DesignTokens.spacing.md,
    ...DesignTokens.shadow.sm,
  },
  containerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
    gap: 4,
  },
  statusText: {
    ...Typography.label,
    fontWeight: '700',
  },
  description: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
  },
  returnDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  returnDate: {
    ...Typography.bodySmall,
    color: DesignTokens.textSecondary,
  },
  lockedContainer: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DesignTokens.border,
    borderStyle: 'dashed',
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  lockedText: {
    ...Typography.bodySmall,
    color: DesignTokens.textMuted,
    flex: 1,
  },
  proBadge: {
    backgroundColor: DesignTokens.accentPurple,
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  proBadgeText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 9,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
