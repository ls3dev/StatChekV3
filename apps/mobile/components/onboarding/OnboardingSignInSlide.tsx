import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { DesignTokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { setOnboardingComplete } from '@/utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSignInSlideProps {
  index: number;
  scrollX: SharedValue<number>;
}

export function OnboardingSignInSlide({ index, scrollX }: OnboardingSignInSlideProps) {
  const router = useRouter();
  const { signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [30, 0, 30],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setOauthLoading(provider);
    setError(null);
    try {
      const result = await signInWithOAuth(provider);
      if (result.success) {
        await setOnboardingComplete();
        router.replace('/(tabs)');
      } else {
        setError(result.error || `${provider} sign in failed`);
      }
    } catch (err: any) {
      setError(err.message || `${provider} sign in failed`);
    } finally {
      setOauthLoading(null);
    }
  };

  const isDisabled = oauthLoading !== null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Ionicons name="person-circle-outline" size={72} color="#A78BFA" style={styles.icon} />
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Sign in to save your lists and sync across devices</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <Pressable
            style={[styles.oauthButton, styles.appleButton]}
            onPress={() => handleOAuth('apple')}
            disabled={isDisabled}
          >
            {oauthLoading === 'apple' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.oauthText}>Continue with Apple</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.oauthButton, styles.googleButton]}
            onPress={() => handleOAuth('google')}
            disabled={isDisabled}
          >
            {oauthLoading === 'google' ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#000000" />
                <Text style={[styles.oauthText, { color: '#000000' }]}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  icon: {
    marginBottom: DesignTokens.spacing.lg,
  },
  title: {
    ...Typography.displayMedium,
    color: DesignTokens.textPrimaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
    width: '100%',
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#EF4444',
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: DesignTokens.spacing.md,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  oauthText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
});
