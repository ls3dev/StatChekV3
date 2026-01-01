import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

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
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || DesignTokens.accentPurple) + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor || DesignTokens.accentPurple} />
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
  const insets = useSafeAreaInsets();

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
              <View style={[styles.avatar, { backgroundColor: DesignTokens.accentPurple + '20' }]}>
                <Ionicons name="person" size={32} color={DesignTokens.accentPurple} />
              </View>
            </View>
            <Text
              style={[
                styles.profileName,
                { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary },
              ]}>
              Sports Fan
            </Text>
            <Text
              style={[
                styles.profileSubtitle,
                { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
              ]}>
              Track your favorite players
            </Text>
          </View>
        </View>

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
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E5E7EB', true: DesignTokens.accentPurple + '60' }}
                  thumbColor={isDark ? DesignTokens.accentPurple : '#FFFFFF'}
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
});
