import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useLists } from '@/hooks/useLists';

type SettingItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDark: boolean;
};

function SettingItem({ icon, iconColor, title, subtitle, onPress, rightElement, isDark }: SettingItemProps) {
  const content = (
    <View
      style={[
        styles.settingItem,
        {
          backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
        },
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || DesignTokens.accentGreen) + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor || DesignTokens.accentGreen} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.settingSubtitle, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user, signOut, status } = useAuth();
  const { isProUser } = useRevenueCat();
  const { isSignedIn: clerkIsSignedIn, user: clerkUser } = useUser();
  const { lists } = useLists();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Calculate stats like web profile
  const totalLists = lists.length;
  const totalReceipts = lists.reduce(
    (sum, list) => sum + (list.links?.length || 0),
    0
  );

  // User is considered "logged in" if either AuthContext or Clerk says so
  const isLoggedIn = isAuthenticated || clerkIsSignedIn;
  const displayUser = user || (clerkUser ? {
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress,
  } : null);

  const handleToggleTheme = async () => {
    await toggleTheme();
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  const handleSignOut = async () => {
    console.log('[PROFILE] Sign out button pressed');
    try {
      await signOut();
      console.log('[PROFILE] Sign out complete');
      // Stay on tabs - user will see guest state with sign-in options
    } catch (error) {
      console.error('[PROFILE] Sign out error:', error);
    }
  };

  const handleUpgradeToPro = () => {
    router.push('/(tabs)/paywall');
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
          Profile
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
              },
              isDark ? styles.cardShadowDark : styles.cardShadow,
            ]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: DesignTokens.accentGreen + '20' }]}>
                <Ionicons name="person" size={32} color={DesignTokens.accentGreen} />
              </View>
            </View>
            {isLoggedIn && displayUser ? (
              <>
                <Text
                  style={[
                    styles.profileName,
                    { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                  ]}>
                  {displayUser.name || 'Sports Fan'}
                </Text>
                <Text
                  style={[
                    styles.profileSubtitle,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}>
                  {displayUser.email}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.profileName,
                    { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
                  ]}>
                  Guest
                </Text>
                <Text
                  style={[
                    styles.profileSubtitle,
                    { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  ]}>
                  Sign in to save your lists
                </Text>
              </>
            )}
          </View>

          {/* Auth Buttons */}
          {!isLoggedIn && (
            <View style={styles.authButtons}>
              <Pressable onPress={handleSignUp} style={styles.authButtonContainer}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  style={styles.authButtonPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.authButtonPrimaryText}>Create Account</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={[
                  styles.authButtonSecondary,
                  { borderColor: isDark ? DesignTokens.borderDark : DesignTokens.border }
                ]}
                onPress={handleSignIn}
              >
                <Text style={[
                  styles.authButtonSecondaryText,
                  { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }
                ]}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Stats Section - only for logged in users */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              YOUR STATS
            </Text>
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground },
                  isDark ? styles.cardShadowDark : styles.cardShadow,
                ]}>
                <Text style={[styles.statNumber, { color: DesignTokens.accentGreen }]}>
                  {totalLists}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
                  {totalLists === 1 ? 'List' : 'Lists'} Created
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground },
                  isDark ? styles.cardShadowDark : styles.cardShadow,
                ]}>
                <Text style={[styles.statNumber, { color: DesignTokens.accentGreen }]}>
                  {totalReceipts}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
                  {totalReceipts === 1 ? 'Receipt' : 'Receipts'} Added
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pro Upgrade Section */}
        {!isProUser && (
          <View style={styles.section}>
            <Pressable onPress={handleUpgradeToPro}>
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                style={styles.proCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.proIconContainer}>
                  <Ionicons name="star" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.proContent}>
                  <Text style={styles.proTitle}>Upgrade to Pro</Text>
                  <Text style={styles.proSubtitle}>Unlimited lists, cloud sync & more</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Pro Badge - Show when user is pro */}
        {isProUser && (
          <View style={styles.section}>
            <View
              style={[
                styles.proBadgeCard,
                {
                  backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                },
              ]}
            >
              <View style={styles.proBadgeIcon}>
                <Ionicons name="star" size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.proBadgeText, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
                StatCheck Pro
              </Text>
              <View style={styles.proActiveBadge}>
                <Text style={styles.proActiveText}>Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            APPEARANCE
          </Text>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
              },
              isDark ? styles.cardShadowDark : styles.cardShadow,
            ]}>
            <SettingItem
              icon={isDark ? 'moon' : 'sunny'}
              iconColor={isDark ? '#A78BFA' : '#F59E0B'}
              title="Dark Mode"
              subtitle={isDark ? 'Currently on' : 'Currently off'}
              isDark={isDark}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: '#E5E7EB', true: isDark ? '#FFFFFF40' : DesignTokens.accentGreen + '60' }}
                  thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                />
              }
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
            ]}>
            ABOUT
          </Text>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
              },
              isDark ? styles.cardShadowDark : styles.cardShadow,
            ]}>
            <SettingItem icon="information-circle" iconColor="#3B82F6" title="App Version" subtitle="1.0.0" isDark={isDark} />
            <View style={[styles.divider, { backgroundColor: isDark ? DesignTokens.dividerDark : DesignTokens.divider }]} />
            <SettingItem icon="document-text" iconColor="#10B981" title="Terms of Service" isDark={isDark} />
            <View style={[styles.divider, { backgroundColor: isDark ? DesignTokens.dividerDark : DesignTokens.divider }]} />
            <SettingItem icon="shield-checkmark" iconColor="#6366F1" title="Privacy Policy" isDark={isDark} />
          </View>
        </View>

        {/* Account Section - Only show for logged in users */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              ACCOUNT
            </Text>
            <View
              style={[
                styles.settingsCard,
                {
                  backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
                },
                isDark ? styles.cardShadowDark : styles.cardShadow,
              ]}>
              <SettingItem
                icon="log-out"
                iconColor="#EF4444"
                title="Sign Out"
                isDark={isDark}
                onPress={handleSignOut}
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
            Made with passion for sports
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
    paddingBottom: DesignTokens.spacing.xxl,
  },
  section: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    ...Typography.captionSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: DesignTokens.spacing.sm,
    marginLeft: DesignTokens.spacing.xs,
  },
  profileCard: {
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  cardShadow: {
    ...DesignTokens.shadow.sm,
  },
  cardShadowDark: {
    shadowOpacity: 0,
  },
  avatarContainer: {
    marginBottom: DesignTokens.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    ...Typography.headline,
    marginBottom: DesignTokens.spacing.xs,
  },
  profileSubtitle: {
    ...Typography.body,
  },
  settingsCard: {
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: DesignTokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
  },
  settingSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68, // Icon width + gaps
  },
  footer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  footerText: {
    ...Typography.caption,
  },
  authButtons: {
    marginTop: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  authButtonContainer: {
    width: '100%',
  },
  authButtonPrimary: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonPrimaryText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  authButtonSecondary: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  authButtonSecondaryText: {
    ...Typography.headline,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.xl,
    gap: DesignTokens.spacing.md,
  },
  proIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    ...Typography.headline,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  proSubtitle: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  proBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  proBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgeText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  proActiveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
  },
  proActiveText: {
    ...Typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
