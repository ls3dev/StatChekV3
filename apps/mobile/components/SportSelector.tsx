import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSport, Sport } from '@/context/SportContext';

const SPORTS: { id: Sport; label: string; icon: string; color: string }[] = [
  { id: 'NBA', label: 'NBA', icon: '🏀', color: '#F97316' },
  { id: 'NFL', label: 'NFL', icon: '🏈', color: '#3B82F6' },
  { id: 'MLB', label: 'MLB', icon: '⚾', color: '#22C55E' },
];

const SPORT_TAB_WIDTH = 72;

interface SportSelectorProps {
  compact?: boolean;
}

export function SportSelector({ compact = false }: SportSelectorProps) {
  const { isDark } = useTheme();
  const { selectedSport, setSelectedSport } = useSport();
  const indicatorPosition = useSharedValue(SPORTS.findIndex(s => s.id === selectedSport));

  React.useEffect(() => {
    indicatorPosition.value = withSpring(SPORTS.findIndex(s => s.id === selectedSport), {
      damping: 20,
      stiffness: 300,
    });
  }, [selectedSport, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => {
    const sportIndex = Math.round(indicatorPosition.value);
    const currentSport = SPORTS[sportIndex] || SPORTS[0];

    return {
      transform: [{ translateX: indicatorPosition.value * (SPORT_TAB_WIDTH + 4) }],
      backgroundColor: currentSport.color,
    };
  });

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        },
      ]}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.tabsRow}>
        {SPORTS.map((sport) => {
          const isSelected = selectedSport === sport.id;
          return (
            <Pressable
              key={sport.id}
              style={styles.tab}
              onPress={() => setSelectedSport(sport.id)}
            >
              <Text style={styles.tabIcon}>{sport.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(0,0,0,0.4)',
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {sport.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignTokens.radius.xl,
    padding: 4,
    alignSelf: 'center',
    marginVertical: DesignTokens.spacing.sm,
  },
  containerCompact: {
    marginVertical: DesignTokens.spacing.xs,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: SPORT_TAB_WIDTH,
    height: 36,
    borderRadius: DesignTokens.radius.lg,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    width: SPORT_TAB_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: DesignTokens.radius.lg,
    gap: 4,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
