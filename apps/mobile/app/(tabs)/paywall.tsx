import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { DesignTokens, Typography } from '@/constants/theme';

const PRO_FEATURES = [
  { icon: 'infinite-outline', text: 'Unlimited player lists' },
  { icon: 'cloud-outline', text: 'Cloud sync across devices' },
  { icon: 'share-outline', text: 'Share lists with friends' },
  { icon: 'stats-chart-outline', text: 'Advanced player stats' },
  { icon: 'notifications-outline', text: 'Player update alerts' },
  { icon: 'ribbon-outline', text: 'Support development' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { packages, isProUser, purchasePackage, restorePurchases, isLoading } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already pro, show success state
  if (isProUser) {
    return (
      <LinearGradient
        colors={['#1F2937', '#000000']}
        style={styles.container}
      >
        <View style={[styles.successContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>You're a Pro!</Text>
          <Text style={styles.successText}>
            Thank you for supporting StatCheck. Enjoy all premium features.
          </Text>
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Please select a plan');
      return;
    }

    setIsPurchasing(true);
    setError(null);

    const success = await purchasePackage(selectedPackage);

    setIsPurchasing(false);

    if (success) {
      // Purchase successful - component will re-render with isProUser = true
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    const success = await restorePurchases();

    setIsRestoring(false);

    if (!success) {
      setError('No previous purchases found');
    }
  };

  const formatPrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackageLabel = (pkg: PurchasesPackage) => {
    const id = pkg.identifier;
    if (id.includes('annual') || id.includes('yearly')) return 'Yearly';
    if (id.includes('monthly')) return 'Monthly';
    if (id.includes('lifetime')) return 'Lifetime';
    return pkg.product.title;
  };

  const getPackageSavings = (pkg: PurchasesPackage) => {
    const id = pkg.identifier;
    if (id.includes('annual') || id.includes('yearly')) return 'Save 50%';
    if (id.includes('lifetime')) return 'Best Value';
    return null;
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#000000']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={DesignTokens.textSecondaryDark} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={styles.proIcon}
          >
            <Ionicons name="star" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>StatCheck Pro</Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of your player rankings
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color="#7C3AED" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Package selection */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : packages.length > 0 ? (
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const savings = getPackageSavings(pkg);

              return (
                <Pressable
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  {savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{savings}</Text>
                    </View>
                  )}
                  <View style={styles.packageInfo}>
                    <Text style={[
                      styles.packageLabel,
                      isSelected && styles.packageLabelSelected,
                    ]}>
                      {getPackageLabel(pkg)}
                    </Text>
                    <Text style={styles.packagePrice}>{formatPrice(pkg)}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.noPackages}>
            <Text style={styles.noPackagesText}>
              Subscription packages coming soon!
            </Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Purchase button */}
        {packages.length > 0 && (
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPackage}
          >
            <LinearGradient
              colors={isPurchasing || !selectedPackage ? ['#6B7280', '#4B5563'] : ['#7C3AED', '#5B21B6']}
              style={styles.purchaseButton}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {selectedPackage ? `Subscribe for ${formatPrice(selectedPackage)}` : 'Select a Plan'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        )}

        {/* Restore purchases */}
        <Pressable
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={DesignTokens.textSecondaryDark} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>

        {/* Terms */}
        <Text style={styles.terms}>
          Payment will be charged to your App Store account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: DesignTokens.spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  proIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  title: {
    ...Typography.displayMedium,
    color: DesignTokens.textPrimaryDark,
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: DesignTokens.textPrimaryDark,
    flex: 1,
  },
  loader: {
    marginVertical: DesignTokens.spacing.xl,
  },
  packagesContainer: {
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  savingsText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  packageInfo: {
    flex: 1,
  },
  packageLabel: {
    ...Typography.headline,
    color: DesignTokens.textPrimaryDark,
    marginBottom: 4,
  },
  packageLabelSelected: {
    color: '#A78BFA',
  },
  packagePrice: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignTokens.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  noPackages: {
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  noPackagesText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#EF4444',
    textAlign: 'center',
  },
  purchaseButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.md,
  },
  restoreText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  terms: {
    ...Typography.caption,
    color: DesignTokens.textMutedDark,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.lg,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  successIcon: {
    marginBottom: DesignTokens.spacing.lg,
  },
  successTitle: {
    ...Typography.displayMedium,
    color: DesignTokens.textPrimaryDark,
    marginBottom: DesignTokens.spacing.md,
  },
  successText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  doneButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xxl,
    borderRadius: DesignTokens.radius.lg,
  },
  doneButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
});
