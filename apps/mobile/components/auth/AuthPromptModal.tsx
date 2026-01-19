import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export function AuthPromptModal() {
  const router = useRouter();
  const { showAuthPrompt, setShowAuthPrompt } = useAuth();

  const handleSignIn = () => {
    setShowAuthPrompt(false);
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = () => {
    setShowAuthPrompt(false);
    router.push('/(auth)/sign-up');
  };

  const handleDismiss = () => {
    setShowAuthPrompt(false);
  };

  return (
    <Modal
      visible={showAuthPrompt}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={handleDismiss}>
              <Ionicons name="close" size={24} color={DesignTokens.textSecondaryDark} />
            </Pressable>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Text */}
            <Text style={styles.title}>Sign In Required</Text>
            <Text style={styles.description}>
              Create an account or sign in to save lists, track your rankings, and sync across devices.
            </Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              <Pressable onPress={handleSignUp} style={styles.buttonContainer}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleSignIn}>
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </Pressable>
            </View>

            {/* Maybe later */}
            <Pressable style={styles.laterButton} onPress={handleDismiss}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  content: {
    backgroundColor: DesignTokens.cardBackgroundDark,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.xs,
  },
  iconContainer: {
    marginBottom: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.sm,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.displaySmall,
    color: DesignTokens.textPrimaryDark,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: DesignTokens.textSecondaryDark,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: DesignTokens.spacing.md,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignTokens.borderDark,
  },
  secondaryButtonText: {
    ...Typography.headline,
    color: DesignTokens.textPrimaryDark,
  },
  laterButton: {
    marginTop: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.sm,
  },
  laterButtonText: {
    ...Typography.body,
    color: DesignTokens.textMutedDark,
  },
});
