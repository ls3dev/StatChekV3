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

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithPassword, signInWithOAuth, continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPassword(email.trim(), password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'apple' | 'google' | 'discord') => {
    console.log('[SIGN-IN] OAuth started:', provider);
    setOauthLoading(provider);
    setError(null);

    try {
      const result = await signInWithOAuth(provider);
      console.log('[SIGN-IN] OAuth result:', result);

      if (result.success) {
        console.log('[SIGN-IN] OAuth success, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('[SIGN-IN] OAuth failed:', result.error);
        setError(result.error || `${provider} sign in failed`);
      }
    } catch (err: any) {
      console.error('[SIGN-IN] OAuth error:', err);
      setError(err.message || `${provider} sign in failed`);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleContinueAsGuest = async () => {
    continueAsGuest();
    // Use push instead of replace and go to specific tab
    router.push('/(tabs)/');
  };

  const handleGoToSignUp = () => {
    router.push('/(auth)/sign-up');
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
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your saved lists</Text>
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthContainer}>
            {/* Apple Sign In */}
            <Pressable
              style={[styles.oauthButton, styles.appleButton]}
              onPress={() => handleOAuthSignIn('apple')}
              disabled={isDisabled}
            >
              {oauthLoading === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.oauthButtonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>

            {/* Google Sign In */}
            <Pressable
              style={[styles.oauthButton, styles.googleButton]}
              onPress={() => handleOAuthSignIn('google')}
              disabled={isDisabled}
            >
              {oauthLoading === 'google' ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#000000" />
                  <Text style={[styles.oauthButtonText, { color: '#000000' }]}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Discord Sign In */}
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
                placeholder="Enter your password"
                placeholderTextColor={DesignTokens.textMutedDark}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isDisabled}
              />
            </View>

            <Pressable onPress={handleSignIn} disabled={isDisabled}>
              <LinearGradient
                colors={isDisabled ? ['#6B7280', '#4B5563'] : ['#7C3AED', '#5B21B6']}
                style={styles.signInButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Guest button */}
          <Pressable style={styles.guestButton} onPress={handleContinueAsGuest} disabled={isDisabled}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </Pressable>

          {/* Sign up link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Pressable onPress={handleGoToSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: DesignTokens.borderDark,
  },
  discordButton: {
    backgroundColor: '#5865F2',
  },
  oauthButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
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
  signInButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.sm,
  },
  signInButtonText: {
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
  guestButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignTokens.borderDark,
  },
  guestButtonText: {
    ...Typography.headline,
    color: DesignTokens.textSecondaryDark,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.xl,
  },
  signUpText: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
  },
  signUpLink: {
    ...Typography.body,
    color: '#A78BFA',
    fontWeight: '600',
  },
});
