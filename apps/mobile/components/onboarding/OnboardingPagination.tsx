import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingPaginationProps {
  totalSlides: number;
  scrollX: SharedValue<number>;
}

export function OnboardingPagination({ totalSlides, scrollX }: OnboardingPaginationProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSlides }).map((_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} />
      ))}
    </View>
  );
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
}

function Dot({ index, scrollX }: DotProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
