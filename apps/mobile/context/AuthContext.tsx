import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useAuth as useClerkAuth, useUser, useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@statcheck/convex';
import { hasCompletedOnboarding } from '@/utils/storage';
import { getOrCreateAnonymousId } from '@/utils/anonymousAuth';
import { setUser as setSentryUser, captureException } from '@/utils/sentry';
import { Platform } from 'react-native';

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

type AuthStatus = 'loading' | 'onboarding' | 'unauthenticated' | 'authenticated' | 'guest';

interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  image?: string;
}

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  userId: string | null;
  anonymousId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isUserReady: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'apple' | 'google' | 'discord') => Promise<{ success: boolean; error?: string }>;
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

// Browser warmup for Android OAuth
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function AuthProvider({ children }: AuthProviderProps) {
  useWarmUpBrowser();

  // Convex auth state (validates Clerk JWT with Convex backend)
  const { isAuthenticated: convexIsAuthenticated, isLoading: convexIsLoading } = useConvexAuth();

  // Clerk hooks
  const { signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  // OAuth hooks for providers
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startDiscordOAuth } = useOAuth({ strategy: 'oauth_discord' });

  // Sync user to Convex on authentication
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Sync Clerk user to Convex and update local state
  useEffect(() => {
    const syncUser = async () => {
      if (convexIsAuthenticated && clerkUser) {
        try {
          const convexUser = await getOrCreateUser();
          if (convexUser) {
            setUser({
              id: convexUser.id,
              email: convexUser.email,
              name: convexUser.name,
              username: convexUser.username,
              image: convexUser.image,
            });
            setSentryUser({
              id: convexUser.id,
              email: convexUser.email,
              username: convexUser.name,
            });
          }
        } catch (error) {
          console.error('Failed to sync user:', error);
          captureException(error as Error, { context: 'syncUser' });
        }
      } else if (!convexIsAuthenticated) {
        setUser(null);
        setSentryUser(null);
      }
    };
    syncUser();
  }, [convexIsAuthenticated, clerkUser, getOrCreateUser]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      const onboardingComplete = await hasCompletedOnboarding();
      console.log('[AUTH] Onboarding complete?', onboardingComplete);
      if (!onboardingComplete) {
        setStatus('onboarding');
      }
      setOnboardingChecked(true);
      const anonId = await getOrCreateAnonymousId();
      setAnonymousId(anonId);
    };
    checkOnboarding();
  }, []);

  // Update status based on Convex auth state
  useEffect(() => {
    // Wait for onboarding check to complete first
    if (!onboardingChecked) return;
    // Don't override onboarding or guest status
    if (status === 'onboarding') return;
    if (status === 'guest') return;
    // Wait for Convex auth to be ready (don't reset to 'loading' - causes flicker)
    if (convexIsLoading) return;

    // Update to authenticated or unauthenticated based on Convex auth
    if (convexIsAuthenticated) {
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, [convexIsAuthenticated, convexIsLoading, onboardingChecked, status]);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!signInLoaded || !signIn) {
      return { success: false, error: 'Sign in not ready' };
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId });
        return { success: true };
      }

      return { success: false, error: 'Sign in incomplete' };
    } catch (err: any) {
      console.error('Sign in error:', err);
      captureException(err, { context: 'signInWithPassword', email });
      const errorMessage = err.errors?.[0]?.message || err.message || 'Sign in failed';
      return { success: false, error: errorMessage };
    }
  }, [signIn, setSignInActive, signInLoaded]);

  const signUpWithPassword = useCallback(async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    if (!signUpLoaded || !signUp) {
      return { success: false, error: 'Sign up not ready' };
    }

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name,
      });

      // Handle email verification if required
      if (result.status === 'missing_requirements') {
        // Email verification might be required
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        return { success: false, error: 'Please check your email for a verification code' };
      }

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        return { success: true };
      }

      return { success: false, error: 'Sign up incomplete' };
    } catch (err: any) {
      console.error('Sign up error:', err);
      captureException(err, { context: 'signUpWithPassword', email });
      const errorMessage = err.errors?.[0]?.message || err.message || 'Sign up failed';
      return { success: false, error: errorMessage };
    }
  }, [signUp, setSignUpActive, signUpLoaded]);

  const signInWithOAuth = useCallback(async (provider: 'apple' | 'google' | 'discord'): Promise<{ success: boolean; error?: string }> => {
    console.log('[AUTH] signInWithOAuth called:', provider);
    try {
      // Select the correct OAuth flow based on provider
      const oauthFlowMap = {
        apple: startAppleOAuth,
        google: startGoogleOAuth,
        discord: startDiscordOAuth,
      };

      const startFlow = oauthFlowMap[provider];
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'statcheck' });
      console.log('[AUTH] OAuth redirect URL:', redirectUrl);

      console.log('[AUTH] Starting OAuth flow...');
      const { createdSessionId, setActive } = await startFlow({ redirectUrl });
      console.log('[AUTH] OAuth flow returned, sessionId:', createdSessionId);

      if (createdSessionId && setActive) {
        console.log('[AUTH] Setting active session...');
        await setActive({ session: createdSessionId });
        console.log('[AUTH] Session activated');
        return { success: true };
      }

      console.log('[AUTH] No session created');
      return { success: false, error: 'OAuth flow incomplete' };
    } catch (err: any) {
      console.error('[AUTH] OAuth error:', err);
      captureException(err, { context: 'signInWithOAuth', provider });
      return { success: false, error: err.message || 'OAuth sign in failed' };
    }
  }, [startAppleOAuth, startGoogleOAuth, startDiscordOAuth]);

  const handleSignOut = useCallback(async () => {
    console.log('[AUTH] Sign out initiated');
    try {
      await clerkSignOut();
      console.log('[AUTH] Clerk sign out complete');
      setSentryUser(null);
      setUser(null);
      setStatus('unauthenticated');
      console.log('[AUTH] Status set to unauthenticated');
    } catch (error: any) {
      console.error('[AUTH] Sign out error:', error);
      captureException(error, { context: 'signOut' });
    }
  }, [clerkSignOut]);

  const refreshAuth = useCallback(async () => {
    const onboardingComplete = await hasCompletedOnboarding();
    if (!onboardingComplete) {
      setStatus('onboarding');
      return;
    }
    const anonId = await getOrCreateAnonymousId();
    setAnonymousId(anonId);
    if (!convexIsAuthenticated) {
      setStatus('unauthenticated');
    }
  }, [convexIsAuthenticated]);

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
  }, []);

  // userId: Clerk ID when authenticated, anonymous ID for guests
  const userId = useMemo(() => {
    if (convexIsAuthenticated && user?.id) {
      return user.id;
    }
    return anonymousId;
  }, [convexIsAuthenticated, user?.id, anonymousId]);

  // isUserReady: true when userId is properly initialized
  const isUserReady = useMemo(() => {
    if (status === 'loading' || status === 'onboarding') return false;
    if (convexIsAuthenticated) {
      return user?.id !== undefined;
    }
    return anonymousId !== null;
  }, [status, convexIsAuthenticated, user?.id, anonymousId]);

  const value: AuthContextType = {
    status,
    user,
    userId,
    anonymousId,
    isAuthenticated: status === 'authenticated',
    isGuest: status === 'guest' || status === 'unauthenticated',
    isUserReady,
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
