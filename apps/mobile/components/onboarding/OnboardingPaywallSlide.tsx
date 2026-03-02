import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { PurchasesPackage } from 'react-native-purchases';

import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { DesignTokens, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRO_FEATURES = [
  { icon: 'infinite-outline', text: 'Unlimited player lists' },
  { icon: 'stats-chart-outline', text: 'Advanced player stats' },
  { icon: 'cloud-outline', text: 'Cloud sync across devices' },
  { icon: 'share-outline', text: 'Share lists with friends' },
];

interface OnboardingPaywallSlideProps {
  index: number;
  scrollX: SharedValue<number>;
}

export function OnboardingPaywallSlide({ index, scrollX }: OnboardingPaywallSlideProps) {
  const { packages, purchasePackage, restorePurchases, isLoading, isProUser } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Please select a plan');
      return;
    }

    setIsPurchasing(true);
    setError(null);

    const success = await purchasePackage(selectedPackage);
    setIsPurchasing(false);

    if (!success) {
      console.log('[OnboardingPaywall] Purchase was not successful');
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

  const formatPrice = (pkg: PurchasesPackage) => pkg.product.priceString;

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

  if (isProUser) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.title}>You're a Pro!</Text>
          <Text style={styles.description}>
            Enjoy all premium features.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            // Center content vertically when there's not enough to fill the screen
            (packages.length === 0 || isLoading) && styles.scrollContentCentered,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.proIcon}
            >
              <Ionicons name="star" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Go Pro</Text>
            <Text style={styles.description}>
              Unlock the full StatCheck experience
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {PRO_FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={18} color="#7C3AED" />
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
                    style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                    onPress={() => setSelectedPackage(pkg)}
                  >
                    {savings && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{savings}</Text>
                      </View>
                    )}
                    <View style={styles.packageInfo}>
                      <Text style={[styles.packageLabel, isSelected && styles.packageLabelSelected]}>
                        {getPackageLabel(pkg)}
                      </Text>
                      <Text style={styles.packagePrice}>{formatPrice(pkg)}</Text>
                    </View>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
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

          {/* Error */}
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

          {/* Restore */}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: DesignTokens.spacing.md,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  proIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  title: {
    ...Typography.displayMedium,
    color: DesignTokens.textPrimaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  description: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: DesignTokens.textPrimaryDark,
    flex: 1,
  },
  loader: {
    marginVertical: DesignTokens.spacing.lg,
  },
  packagesContainer: {
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
    width: '100%',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.md,
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
    marginBottom: 2,
  },
  packageLabelSelected: {
    color: '#A78BFA',
  },
  packagePrice: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: DesignTokens.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#7C3AED',
  },
  noPackages: {
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  noPackagesText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
    width: '100%',
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
    width: '100%',
  },
  purchaseButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.sm,
  },
  restoreText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  terms: {
    ...Typography.caption,
    color: DesignTokens.textMutedDark,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.sm,
    lineHeight: 16,
  },
  successIcon: {
    marginBottom: DesignTokens.spacing.lg,
  },
});
