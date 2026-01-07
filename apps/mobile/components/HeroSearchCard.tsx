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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { usePlayerSearch } from '@/hooks/usePlayerSearch';
import type { Player } from '@/types';

import { SearchDropdownItem } from './SearchDropdownItem';

type HeroSearchCardProps = {
  onPlayerSelect: (player: Player) => void;
};

export function HeroSearchCard({ onPlayerSelect }: HeroSearchCardProps) {
  const { isDark } = useTheme();
  const { query, results, setQuery } = usePlayerSearch();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const focusAnimation = useSharedValue(0);
  const dropdownAnimation = useSharedValue(0);

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

  const handlePlayerPress = (player: Player) => {
    setQuery('');
    Keyboard.dismiss();
    onPlayerSelect(player);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleOutsidePress = () => {
    if (isFocused) {
      Keyboard.dismiss();
      setIsFocused(false);
    }
  };

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
            color={isFocused ? (isDark ? DesignTokens.accentPrimary : DesignTokens.accentPurple) : isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted}
          />
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary,
              },
            ]}
            placeholder="Search players..."
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

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: -40, // Overlap the gradient header
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
