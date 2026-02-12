import React from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type PlayerCardTab = 'stats' | 'contract' | 'links';

interface TabConfig {
  key: PlayerCardTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'stats', label: 'Stats', icon: 'stats-chart' },
  { key: 'contract', label: 'Contract', icon: 'document-text' },
  { key: 'links', label: 'Links', icon: 'link' },
];

interface PlayerCardTabsProps {
  activeTab: PlayerCardTab;
  onTabChange: (tab: PlayerCardTab) => void;
  sport?: string;
  disabledTabs?: PlayerCardTab[];
}

export function PlayerCardTabs({
  activeTab,
  onTabChange,
  sport,
  disabledTabs = [],
}: PlayerCardTabsProps) {
  const { isDark } = useTheme();

  // For non-NBA sports, only show Links tab
  const isNBA = sport === 'NBA';
  const visibleTabs = isNBA ? TABS : TABS.filter((tab) => tab.key === 'links');

  const handleTabPress = (tab: PlayerCardTab) => {
    if (disabledTabs.includes(tab)) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onTabChange(tab);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isDisabled = disabledTabs.includes(tab.key);

        return (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              isActive && { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)' },
              isDisabled && styles.disabledTab,
            ]}
            onPress={() => handleTabPress(tab.key)}
            disabled={isDisabled}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={
                isDisabled
                  ? DesignTokens.textMuted
                  : isActive
                    ? DesignTokens.accentPurple
                    : isDark
                      ? DesignTokens.textSecondaryDark
                      : DesignTokens.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel,
                isActive && { color: DesignTokens.accentPurple },
                isDisabled && styles.disabledTabLabel,
                !isActive && !isDisabled && isDark && { color: DesignTokens.textSecondaryDark },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.cardBackground,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.xs,
    marginBottom: DesignTokens.spacing.md,
  },
  containerDark: {
    backgroundColor: DesignTokens.cardBackgroundDark,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.xs,
    position: 'relative',
  },
  activeTab: {
    // Background set dynamically above
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabLabel: {
    ...Typography.label,
    color: DesignTokens.textSecondary,
    fontSize: 13,
  },
  activeTabLabel: {
    fontWeight: '600',
  },
  disabledTabLabel: {
    color: DesignTokens.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: DesignTokens.accentPurple,
    borderRadius: 1,
  },
});
