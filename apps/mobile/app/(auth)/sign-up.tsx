import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { DesignTokens, Typography } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithPassword, signInWithOAuth } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userName = name.trim() || undefined;
      const result = await signUpWithPassword(email.trim(), password, userName);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Sign up failed');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'discord' | 'twitter') => {
    setOauthLoading(provider);
    setError(null);

    try {
      const result = await signInWithOAuth(provider);

      if (result.success) {
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

  const handleGoBack = () => {
    router.back();
  };

  const isDisabled = isLoading || oauthLoading !== null;

  return (
    <LinearGradient
      colors={['#1F2937', '#000000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={DesignTokens.textPrimaryDark} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to save your lists and sync across devices
            </Text>
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthContainer}>
            <Pressable
              style={[styles.oauthButton, styles.discordButton]}
              onPress={() => handleOAuthSignIn('discord')}
              disabled={isDisabled}
            >
              {oauthLoading === 'discord' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-discord" size={20} color="#FFFFFF" />
                  <Text style={styles.oauthButtonText}>Continue with Discord</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={DesignTokens.textMutedDark}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={DesignTokens.textMutedDark}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor={DesignTokens.textMutedDark}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isDisabled}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={DesignTokens.textMutedDark}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isDisabled}
              />
            </View>

            <Pressable onPress={handleSignUp} disabled={isDisabled}>
              <LinearGradient
                colors={isDisabled ? ['#6B7280', '#4B5563'] : ['#7C3AED', '#5B21B6']}
                style={styles.signUpButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Sign in link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Pressable onPress={handleGoBack}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  backButton: {
    marginBottom: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.sm,
    marginLeft: -DesignTokens.spacing.sm,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: DesignTokens.spacing.xl,
  },
  title: {
    ...Typography.displayMedium,
    color: DesignTokens.textPrimaryDark,
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  oauthContainer: {
    gap: DesignTokens.spacing.md,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    gap: DesignTokens.spacing.sm,
  },
  discordButton: {
    backgroundColor: '#5865F2',
  },
  twitterButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: DesignTokens.borderDark,
  },
  oauthButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DesignTokens.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: DesignTokens.borderDark,
  },
  dividerText: {
    ...Typography.caption,
    color: DesignTokens.textMutedDark,
    marginHorizontal: DesignTokens.spacing.md,
  },
  form: {
    gap: DesignTokens.spacing.lg,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#EF4444',
  },
  inputGroup: {
    gap: DesignTokens.spacing.sm,
  },
  label: {
    ...Typography.label,
    color: DesignTokens.textSecondaryDark,
  },
  input: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderRadius: DesignTokens.radius.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    ...Typography.body,
    color: DesignTokens.textPrimaryDark,
    borderWidth: 1,
    borderColor: DesignTokens.borderDark,
  },
  signUpButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.sm,
  },
  signUpButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  terms: {
    ...Typography.caption,
    color: DesignTokens.textMutedDark,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.xl,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.lg,
  },
  signInText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  signInLink: {
    ...Typography.body,
    color: '#A78BFA',
    fontWeight: '600',
  },
});
