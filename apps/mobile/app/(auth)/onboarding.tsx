import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { ONBOARDING_SLIDES } from '@/constants/onboarding';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { OnboardingPagination } from '@/components/onboarding/OnboardingPagination';
import { setOnboardingComplete } from '@/utils/storage';
import { DesignTokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      currentIndex.value = Math.round(event.contentOffset.x / SCREEN_WIDTH);
    },
  });

  const handleComplete = async () => {
    await setOnboardingComplete();
    continueAsGuest();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await setOnboardingComplete();
    continueAsGuest();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    const nextIndex = Math.min(currentIndex.value + 1, ONBOARDING_SLIDES.length - 1);
    if (nextIndex === currentIndex.value) {
      handleComplete();
    } else {
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const isLastSlide = currentIndex.value === ONBOARDING_SLIDES.length - 1;
    return {
      transform: [{ scale: withSpring(isLastSlide ? 1.05 : 1) }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#1F2937', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Skip button */}
      <Pressable
        style={[styles.skipButton, { top: insets.top + DesignTokens.spacing.md }]}
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
        >
          {ONBOARDING_SLIDES.map((slide, index) => (
            <OnboardingSlide
              key={slide.id}
              slide={slide}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </Animated.ScrollView>
      </View>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + DesignTokens.spacing.xl }]}>
        <OnboardingPagination
          totalSlides={ONBOARDING_SLIDES.length}
          scrollX={scrollX}
        />

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable onPress={handleNext}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipButton: {
    position: 'absolute',
    right: DesignTokens.spacing.lg,
    zIndex: 10,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  skipText: {
    ...Typography.label,
    color: DesignTokens.textSecondaryDark,
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSection: {
    paddingHorizontal: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
});
