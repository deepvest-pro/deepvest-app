'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile, UserData } from '@/types/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getUserData } from '../react-query/auth-actions';
import { signOut as signOutAction } from './auth-actions';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  userData: UserData | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession: Session | null;
  initialUser: UserData | null;
}

// Minimum interval between user data requests (ms)
const MIN_REFRESH_INTERVAL = 10000; // 10 seconds

export function AuthProvider({ children, initialSession, initialUser }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialUser?.user || null);
  const [profile, setProfile] = useState<UserProfile | null>(initialUser?.profile || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(initialUser);

  // Track the last refresh time
  const lastRefreshRef = useRef<number>(Date.now());
  // Flag to track pending requests
  const pendingRequestRef = useRef<boolean>(false);
  // Track auth errors to prevent repeated refresh attempts
  const authErrorsRef = useRef<number>(0);
  const MAX_AUTH_ERRORS = 3;

  // Update React Query caches when user changes
  useEffect(() => {
    if (user) {
      queryClient.setQueryData(['user'], user);
      queryClient.setQueryData(['session'], session);
      if (profile) {
        queryClient.setQueryData(['userData'], { user, profile });
      }
    } else {
      queryClient.setQueryData(['user'], null);
      queryClient.setQueryData(['session'], null);
      queryClient.setQueryData(['userData'], null);
    }
  }, [user, profile, session, queryClient]);

  // Reset error counter when user changes
  useEffect(() => {
    authErrorsRef.current = 0;
  }, [user?.id]);

  // Sign out handler
  const signOut = useCallback(async () => {
    // Immediately clear client state
    setUser(null);
    setProfile(null);
    setUserData(null);
    setSession(null);
    authErrorsRef.current = 0; // Reset error counter
    queryClient.setQueryData(['user'], null);
    queryClient.setQueryData(['session'], null);
    queryClient.setQueryData(['userData'], null);

    setIsLoading(true);
    setError(null);

    try {
      // Asynchronously call server signOut
      const result = await signOutAction();
      if (result.error) throw new Error(result.error);
      // router.refresh() here may be redundant if middleware already did the redirect
      // but we'll leave it in case signOut is called from somewhere else
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  }, [router, queryClient]);

  // Periodically update user data, but with protection from frequent requests
  useEffect(() => {
    if (!user) return;

    // Clear error counter on mount
    authErrorsRef.current = 0;

    // Function to update user data with protection from excessive requests
    const updateUserData = async () => {
      if (pendingRequestRef.current) return;
      if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
        console.warn('Too many authentication errors during auto-refresh, initiating sign out.');
        await signOut();
        return;
      }

      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) return;

      pendingRequestRef.current = true;
      try {
        const data = await getUserData();
        lastRefreshRef.current = Date.now();
        if (data) {
          authErrorsRef.current = 0;
          setUser(data.user);
          setProfile(data.profile);
          setUserData(data);
          queryClient.setQueryData(['user'], data.user);
          queryClient.setQueryData(['userData'], data);
        } else {
          authErrorsRef.current++;
          if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
            console.warn(
              'Failed to get user data after multiple auto-refresh attempts, initiating sign out.',
            );
            await signOut();
          }
        }
      } catch (err) {
        console.error('Error updating user data during auto-refresh:', err);
        authErrorsRef.current++;
        if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
          console.warn('Error threshold reached during auto-refresh, initiating sign out.');
          await signOut();
        }
      } finally {
        pendingRequestRef.current = false;
      }
    };

    const interval = setInterval(updateUserData, 5 * 60 * 1000);
    const initialUpdateTimeout = setTimeout(() => {
      updateUserData();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialUpdateTimeout);
    };
  }, [user, queryClient, signOut]);

  const refreshSession = useCallback(async () => {
    if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
      console.warn('Too many authentication errors, skipping manual refresh. Signing out.');
      await signOut();
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL || pendingRequestRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    pendingRequestRef.current = true;

    try {
      const newUserData = await getUserData();
      lastRefreshRef.current = Date.now();

      if (newUserData) {
        authErrorsRef.current = 0;
        setUser(newUserData.user);
        setProfile(newUserData.profile);
        setUserData(newUserData);
        setSession((await queryClient.getQueryData(['session'])) || null);
        queryClient.setQueryData(['user'], newUserData.user);
        queryClient.setQueryData(['userData'], newUserData);
      } else {
        authErrorsRef.current++;
        if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
          console.warn('Failed to refresh session after multiple attempts, initiating sign out.');
          await signOut();
        }
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Failed to refresh user data');
      authErrorsRef.current++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('refresh_token_already_used') ||
        errorMessage.includes('expired') ||
        authErrorsRef.current >= MAX_AUTH_ERRORS
      ) {
        console.warn('Token/Auth error detected during manual refresh, initiating sign out.');
        await signOut();
      }
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  }, [queryClient, signOut]);

  // Refresh user data handler with protection from excessive requests
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
      console.warn('Too many authentication errors, skipping user data refresh. Signing out.');
      await signOut();
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL || pendingRequestRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    pendingRequestRef.current = true;

    try {
      const data = await getUserData();
      lastRefreshRef.current = Date.now();

      if (data) {
        authErrorsRef.current = 0;
        setProfile(data.profile);
        setUserData(data);
        queryClient.setQueryData(['userData'], data);
      } else {
        authErrorsRef.current++;
        if (authErrorsRef.current >= MAX_AUTH_ERRORS) {
          console.warn('Failed to refresh user data after multiple attempts, initiating sign out.');
          await signOut();
        }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh user data');
      authErrorsRef.current++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('refresh_token_already_used') ||
        errorMessage.includes('expired') ||
        authErrorsRef.current >= MAX_AUTH_ERRORS
      ) {
        console.warn('Token/Auth error detected during user data refresh, initiating sign out.');
        await signOut();
      }
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  }, [user, queryClient, signOut]);

  const value = {
    user,
    profile,
    userData,
    session,
    isLoading,
    error,
    signOut,
    refreshSession,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
