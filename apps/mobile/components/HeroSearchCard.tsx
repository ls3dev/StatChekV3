import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { usePlayerSearch, Sport } from '@/hooks/usePlayerSearch';
import type { Player } from '@/types';

import { SearchDropdownItem } from './SearchDropdownItem';

const SPORTS: Sport[] = ['NBA', 'NFL', 'MLB'];

const SPORT_CONFIG: Record<Sport, {
  icon: string;
  color: string;
  glowColor: string;
  label: string;
}> = {
  NBA: {
    icon: '🏀',
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.3)',
    label: 'NBA'
  },
  NFL: {
    icon: '🏈',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    label: 'NFL'
  },
  MLB: {
    icon: '⚾',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    label: 'MLB'
  },
};

type HeroSearchCardProps = {
  onPlayerSelect: (player: Player) => void;
};

// Individual Sport Tab Component with animations
function SportTab({
  sport,
  isSelected,
  onPress,
  isDark
}: {
  sport: Sport;
  isSelected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const config = SPORT_CONFIG[sport];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isSelected ? 1 : 0.6);

  useEffect(() => {
    opacity.value = withTiming(isSelected ? 1 : 0.6, { duration: 200 });
  }, [isSelected, opacity]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.sportTabPressable}
    >
      <Animated.View style={[styles.sportTab, animatedStyle]}>
        <Text style={styles.sportTabIcon}>{config.icon}</Text>
        <Text
          style={[
            styles.sportTabLabel,
            {
              color: isSelected
                ? (isDark ? '#FFFFFF' : config.color)
                : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'),
              fontWeight: isSelected ? '700' : '600',
            },
          ]}
        >
          {config.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function HeroSearchCard({ onPlayerSelect }: HeroSearchCardProps) {
  const { isDark } = useTheme();
  const { query, results, setQuery, selectedSport, setSelectedSport } = usePlayerSearch();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const focusAnimation = useSharedValue(0);
  const dropdownAnimation = useSharedValue(0);
  const indicatorPosition = useSharedValue(SPORTS.indexOf(selectedSport));

  const showDropdown = query.length > 0 && results.length > 0;

  useEffect(() => {
    focusAnimation.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused, focusAnimation]);

  useEffect(() => {
    dropdownAnimation.value = withTiming(showDropdown ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [showDropdown, dropdownAnimation]);

  useEffect(() => {
    indicatorPosition.value = withSpring(SPORTS.indexOf(selectedSport), {
      damping: 20,
      stiffness: 300,
    });
  }, [selectedSport, indicatorPosition]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(focusAnimation.value, [0, 1], [1, 1.02]),
        },
      ],
    };
  });

  const dropdownAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: dropdownAnimation.value,
      transform: [
        {
          translateY: interpolate(dropdownAnimation.value, [0, 1], [-10, 0]),
        },
      ],
    };
  });

  // Animated indicator style
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const sportIndex = Math.round(indicatorPosition.value);
    const currentSport = SPORTS[sportIndex] || 'NBA';
    const config = SPORT_CONFIG[currentSport];

    return {
      transform: [
        { translateX: indicatorPosition.value * (SPORT_TAB_WIDTH + 8) },
      ],
      backgroundColor: config.color,
      shadowColor: config.color,
    };
  });

  const handlePlayerPress = (player: Player) => {
    setQuery('');
    Keyboard.dismiss();
    onPlayerSelect(player);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleSportSelect = (sport: Sport) => {
    setSelectedSport(sport);
  };

  const currentConfig = SPORT_CONFIG[selectedSport];

  return (
    <View style={styles.wrapper}>
      {/* Main search card */}
      <Animated.View
        style={[
          styles.card,
          cardAnimatedStyle,
          {
            backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
          },
          isDark ? styles.cardShadowDark : styles.cardShadow,
        ]}>
        {/* Search input row */}
        <View style={styles.inputRow}>
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? currentConfig.color : (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted)}
          />
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
              },
            ]}
            placeholder={`Search ${selectedSport} players...`}
            placeholderTextColor={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
              <Pressable onPress={handleClear} hitSlop={8}>
                <View
                  style={[
                    styles.clearButton,
                    { backgroundColor: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted },
                  ]}>
                  <Ionicons name="close" size={14} color={isDark ? DesignTokens.cardBackgroundDark : '#fff'} />
                </View>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Premium Sport Selector - Below search */}
      <View style={[
        styles.sportSelectorContainer,
        {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        },
        isDark ? styles.sportSelectorShadowDark : styles.sportSelectorShadow,
      ]}>
        {/* Animated sliding indicator */}
        <Animated.View
          style={[
            styles.sportIndicator,
            indicatorAnimatedStyle,
            {
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }
          ]}
        />

        {/* Sport tabs */}
        <View style={styles.sportTabsRow}>
          {SPORTS.map((sport) => (
            <SportTab
              key={sport}
              sport={sport}
              isSelected={selectedSport === sport}
              onPress={() => handleSportSelect(sport)}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Dropdown results */}
      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            dropdownAnimatedStyle,
            {
              backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
            },
            isDark ? styles.dropdownShadowDark : styles.dropdownShadow,
          ]}>
          <ScrollView
            style={styles.dropdownScroll}
            contentContainerStyle={styles.dropdownContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            {results.slice(0, 5).map((player, index) => (
              <SearchDropdownItem key={player.id} player={player} onPress={() => handlePlayerPress(player)} index={index} />
            ))}
            {results.length > 5 && (
              <Text
                style={[
                  styles.moreText,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                ]}>
                +{results.length - 5} more results
              </Text>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* No results message */}
      {query.length > 0 && results.length === 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.dropdown,
            styles.noResults,
            {
              backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground,
            },
            isDark ? styles.dropdownShadowDark : styles.dropdownShadow,
          ]}>
          <Ionicons name="search-outline" size={24} color={isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted} />
          <Text style={[styles.noResultsText, { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary }]}>
            No players found for "{query}"
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const SPORT_TAB_WIDTH = 90;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: -40,
    zIndex: 10,
  },
  card: {
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  cardShadow: {
    ...DesignTokens.shadow.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  cardShadowDark: {
    ...DesignTokens.shadow.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: Platform.select({ ios: DesignTokens.spacing.md, android: DesignTokens.spacing.sm }),
    gap: DesignTokens.spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: DesignTokens.spacing.xs,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Premium Sport Selector Styles
  sportSelectorContainer: {
    marginTop: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.xl,
    padding: 4,
    alignSelf: 'center',
  },
  sportSelectorShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sportSelectorShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
  },
  sportTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sportTabPressable: {
    width: SPORT_TAB_WIDTH,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: DesignTokens.radius.lg,
    gap: 6,
  },
  sportTabIcon: {
    fontSize: 18,
  },
  sportTabLabel: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sportIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: SPORT_TAB_WIDTH,
    height: 40,
    borderRadius: DesignTokens.radius.lg,
  },

  // Dropdown styles
  dropdown: {
    marginTop: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  dropdownShadow: {
    ...DesignTokens.shadow.md,
  },
  dropdownShadowDark: {
    ...DesignTokens.shadow.md,
    shadowOpacity: 0.3,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownContent: {
    paddingVertical: DesignTokens.spacing.sm,
  },
  moreText: {
    ...Typography.caption,
    textAlign: 'center',
    paddingVertical: DesignTokens.spacing.md,
  },
  noResults: {
    paddingVertical: DesignTokens.spacing.xl,
    paddingHorizontal: DesignTokens.spacing.lg,
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  noResultsText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
