import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '@statcheck/convex';
import { hasCompletedOnboarding } from '@/utils/storage';
import { getOrCreateAnonymousId } from '@/utils/anonymousAuth';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

type AuthStatus = 'loading' | 'onboarding' | 'unauthenticated' | 'authenticated' | 'guest';

interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  userId: string | null;
  anonymousId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'discord' | 'twitter') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  continueAsGuest: () => void;
  showAuthPrompt: boolean;
  setShowAuthPrompt: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated: convexIsAuthenticated, isLoading: convexIsLoading } = useConvexAuth();
  const { signIn, signOut: convexSignOut } = useAuthActions();

  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Get current user from Convex when authenticated
  // Note: @convex-dev/auth stores user info that we can access
  useEffect(() => {
    if (convexIsAuthenticated) {
      // User is authenticated - we'll get user info from the session
      // For now, set a placeholder that indicates authenticated state
      setUser({ id: 'authenticated' });
    } else {
      setUser(null);
    }
  }, [convexIsAuthenticated]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      const onboardingComplete = await hasCompletedOnboarding();
      if (!onboardingComplete) {
        setStatus('onboarding');
      }
      setOnboardingChecked(true);

      // Always get anonymous ID for guest mode
      const anonId = await getOrCreateAnonymousId();
      setAnonymousId(anonId);
    };
    checkOnboarding();
  }, []);

  // Update status based on Convex auth state
  useEffect(() => {
    if (!onboardingChecked) return;
    if (status === 'onboarding') return;
    // Don't override guest status - user chose to continue as guest
    if (status === 'guest') return;

    if (convexIsLoading) {
      setStatus('loading');
      return;
    }

    if (convexIsAuthenticated) {
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, [convexIsAuthenticated, convexIsLoading, onboardingChecked, status]);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signIn('password', { email, password, flow: 'signIn' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed' };
    }
  }, [signIn]);

  const signUpWithPassword = useCallback(async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const params: Record<string, string> = { email, password, flow: 'signUp' };
      if (name) params.name = name;
      await signIn('password', params);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    }
  }, [signIn]);

  const signInWithOAuth = useCallback(async (provider: 'discord' | 'twitter'): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the redirect URL for OAuth
      const redirectTo = Linking.createURL('/');

      const result = await signIn(provider, { redirectTo });

      // If we get a redirect URL, open it in a browser
      if (result && typeof result === 'object' && 'redirect' in result && result.redirect) {
        const redirectUrl = typeof result.redirect === 'string' ? result.redirect : result.redirect.toString();
        const authResult = await WebBrowser.openAuthSessionAsync(
          redirectUrl,
          redirectTo
        );

        if (authResult.type === 'success') {
          return { success: true };
        } else {
          return { success: false, error: 'OAuth cancelled' };
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'OAuth sign in failed' };
    }
  }, [signIn]);

  const handleSignOut = useCallback(async () => {
    try {
      await convexSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [convexSignOut]);

  const refreshAuth = useCallback(async () => {
    // Re-check onboarding status
    const onboardingComplete = await hasCompletedOnboarding();
    if (!onboardingComplete) {
      setStatus('onboarding');
      return;
    }

    // Get anonymous ID
    const anonId = await getOrCreateAnonymousId();
    setAnonymousId(anonId);

    // Auth state will auto-refresh via useConvexAuth
    if (!convexIsAuthenticated) {
      setStatus('unauthenticated');
    }
  }, [convexIsAuthenticated]);

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
  }, []);

  // Determine the userId to use for data queries
  // Use the Convex user ID if authenticated, otherwise use anonymous ID
  const userId = convexIsAuthenticated ? 'authenticated' : anonymousId;

  const value: AuthContextType = {
    status,
    user,
    userId,
    anonymousId,
    isAuthenticated: status === 'authenticated',
    isGuest: status === 'guest' || status === 'unauthenticated',
    signInWithPassword,
    signUpWithPassword,
    signInWithOAuth,
    signOut: handleSignOut,
    refreshAuth,
    continueAsGuest,
    showAuthPrompt,
    setShowAuthPrompt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook that returns a function to require authentication
 * Use this to gate actions that require auth
 */
export function useRequireAuth() {
  const { isAuthenticated, setShowAuthPrompt } = useAuth();

  return useCallback(
    (action: () => void | Promise<void>) => {
      if (isAuthenticated) {
        return action();
      }
      setShowAuthPrompt(true);
    },
    [isAuthenticated, setShowAuthPrompt]
  );
}
