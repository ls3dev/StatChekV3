import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Contract {
  season: number;
  amount: number;
  currency: string;
}

interface ContractCardProps {
  contracts: Contract[];
  playerName?: string;
  isLocked?: boolean;
  onUnlockPress?: () => void;
}

export function ContractCard({
  contracts,
  playerName,
  isLocked = false,
  onUnlockPress,
}: ContractCardProps) {
  const { isDark } = useTheme();

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const totalValue = contracts.reduce((sum, c) => sum + c.amount, 0);
  const yearsRemaining = contracts.filter((c) => c.season >= new Date().getFullYear()).length;
  const currentSeason = new Date().getFullYear();
  const currentContract = contracts.find((c) => c.season === currentSeason);

  if (isLocked) {
    return (
      <Pressable
        style={[styles.container, isDark && styles.containerDark, styles.lockedContainer]}
        onPress={onUnlockPress}
      >
        <View style={styles.lockedContent}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={24} color={DesignTokens.accentGreen} />
          </View>
          <Text style={[styles.lockedTitle, isDark && styles.textDark]}>
            Contract Details
          </Text>
          <Text style={[styles.lockedDescription, isDark && styles.textSecondary]}>
            Upgrade to Pro to view player contract information
          </Text>
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={styles.unlockButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={16} color="#FFFFFF" />
            <Text style={styles.unlockButtonText}>Unlock with Pro</Text>
          </LinearGradient>
        </View>
      </Pressable>
    );
  }

  if (contracts.length === 0) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={DesignTokens.textMuted}
          />
          <Text style={[styles.emptyText, isDark && styles.textSecondary]}>
            No contract data available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={18} color={DesignTokens.accentGreen} />
        </View>
        <Text style={[styles.headerText, isDark && styles.textDark]}>Contract</Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
            Total Value
          </Text>
          <Text style={[styles.summaryValue, isDark && styles.textDark]}>
            {formatCurrency(totalValue)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
            Years Left
          </Text>
          <Text style={[styles.summaryValue, isDark && styles.textDark]}>
            {yearsRemaining}
          </Text>
        </View>
        <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.textSecondary]}>
            This Year
          </Text>
          <Text style={[styles.summaryValue, isDark && styles.textDark]}>
            {currentContract ? formatCurrency(currentContract.amount) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Year by Year */}
      <View style={styles.breakdown}>
        <Text style={[styles.breakdownTitle, isDark && styles.textSecondary]}>
          Yearly Breakdown
        </Text>
        {contracts.map((contract) => (
          <View
            key={contract.season}
            style={[
              styles.yearRow,
              contract.season === currentSeason && styles.currentYearRow,
            ]}
          >
            <Text style={[styles.yearText, isDark && styles.textDark]}>
              {contract.season}-{(contract.season + 1).toString().slice(-2)}
            </Text>
            <Text style={[styles.yearAmount, isDark && styles.textDark]}>
              {formatCurrency(contract.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
    ...DesignTokens.shadow.sm,
  },
  containerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  lockedContainer: {
    minHeight: 180,
  },
  lockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.lg,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  lockedTitle: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
  },
  lockedDescription: {
    ...Typography.bodySmall,
    color: DesignTokens.textSecondary,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.xs,
  },
  unlockButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: DesignTokens.textMuted,
    marginTop: DesignTokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.border,
  },
  headerIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  headerText: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
    flex: 1,
  },
  proBadge: {
    backgroundColor: DesignTokens.accentGreen,
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  proBadgeText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summary: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.md,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: DesignTokens.border,
  },
  summaryDividerDark: {
    backgroundColor: DesignTokens.borderDark,
  },
  summaryLabel: {
    ...Typography.captionSmall,
    color: DesignTokens.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    ...Typography.headline,
    color: DesignTokens.textPrimary,
  },
  breakdown: {
    padding: DesignTokens.spacing.md,
  },
  breakdownTitle: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: DesignTokens.spacing.xs,
  },
  currentYearRow: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    marginHorizontal: -DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
  },
  yearText: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
  },
  yearAmount: {
    ...Typography.body,
    color: DesignTokens.textPrimary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textDark: {
    color: DesignTokens.textPrimaryDark,
  },
  textSecondary: {
    color: DesignTokens.textSecondaryDark,
  },
});
