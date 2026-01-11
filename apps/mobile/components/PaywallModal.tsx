import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useListsContext } from '@/context/ListsContext';
import { DesignTokens, Typography } from '@/constants/theme';

export function PaywallModal() {
  const router = useRouter();
  const { showPaywall, setShowPaywall } = useListsContext();

  const handleUpgrade = () => {
    setShowPaywall(false);
    router.push('/(tabs)/paywall');
  };

  const handleClose = () => {
    setShowPaywall(false);
  };

  return (
    <Modal
      visible={showPaywall}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={DesignTokens.textSecondaryDark} />
          </Pressable>

          {/* Icon */}
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={styles.iconContainer}
          >
            <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
          </LinearGradient>

          {/* Title */}
          <Text style={styles.title}>List Limit Reached</Text>

          {/* Description */}
          <Text style={styles.description}>
            Free accounts can create up to 3 lists. Upgrade to Pro for unlimited lists and more features!
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Unlimited player lists</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Cloud sync across devices</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Share lists with friends</Text>
            </View>
          </View>

          {/* Upgrade button */}
          <Pressable onPress={handleUpgrade}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={20} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </LinearGradient>
          </Pressable>

          {/* Maybe later */}
          <Pressable style={styles.laterButton} onPress={handleClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  container: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.xs,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  title: {
    ...Typography.headline,
    color: DesignTokens.textPrimaryDark,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  features: {
    width: '100%',
    marginBottom: DesignTokens.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: DesignTokens.textPrimaryDark,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
    width: '100%',
  },
  upgradeButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  laterButton: {
    paddingVertical: DesignTokens.spacing.md,
  },
  laterButtonText: {
    ...Typography.body,
    color: DesignTokens.textMutedDark,
  },
});
