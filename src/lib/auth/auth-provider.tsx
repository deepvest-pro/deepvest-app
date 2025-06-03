'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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

  // Update React Query caches when the user changes
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

  // Periodically update user data, but with protection from frequent requests
  useEffect(() => {
    if (!user) return;

    // Function to update user data with protection from excessive requests
    const updateUserData = async () => {
      // If a request is already being made, skip
      if (pendingRequestRef.current) return;

      // Check if enough time has passed since the last refresh
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        // If too little time has passed, skip the update
        return;
      }

      try {
        pendingRequestRef.current = true;
        const data = await getUserData();
        lastRefreshRef.current = Date.now();

        if (data) {
          setUser(data.user);
          setProfile(data.profile);
          setUserData(data);

          // Update React Query caches
          queryClient.setQueryData(['user'], data.user);
          queryClient.setQueryData(['userData'], data);
        }
      } catch (err) {
        console.error('Error updating user data:', err);
      } finally {
        pendingRequestRef.current = false;
      }
    };

    // Update data every 5 minutes
    const interval = setInterval(updateUserData, 5 * 60 * 1000);

    // Also update once when mounting, but with a delay to avoid conflict with initial data
    const initialUpdateTimeout = setTimeout(() => {
      updateUserData();
    }, 5000); // 5 second delay when initializing

    return () => {
      clearInterval(interval);
      clearTimeout(initialUpdateTimeout);
    };
  }, [user, queryClient]);

  // Sign out handler
  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signOutAction();
      if (result.error) throw new Error(result.error);

      // Clear local user state immediately
      setUser(null);
      setProfile(null);
      setUserData(null);
      setSession(null);

      // Update React Query caches
      queryClient.setQueryData(['user'], null);
      queryClient.setQueryData(['session'], null);
      queryClient.setQueryData(['userData'], null);

      // Force refresh the page to ensure all server components get fresh data
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh session handler с защитой от избыточных запросов
  const refreshSession = async () => {
    // Check if enough time has passed since the last refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL || pendingRequestRef.current) {
      return; // Skip the update if a request was made recently or is already being made
    }

    setIsLoading(true);
    setError(null);

    try {
      pendingRequestRef.current = true;
      // Update the user through the server action
      const userData = await getUserData();
      lastRefreshRef.current = Date.now();

      if (userData) {
        setUser(userData.user);
        setProfile(userData.profile);
        setUserData(userData);

        // Update React Query caches
        queryClient.setQueryData(['user'], userData.user);
        queryClient.setQueryData(['userData'], userData);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh user data');
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  };

  // Refresh user data handler with protection from excessive requests
  const refreshUserData = async () => {
    if (!user) return;

    // Check if enough time has passed since the last refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL || pendingRequestRef.current) {
      return; // Skip the update if a request was made recently or is already being made
    }

    setIsLoading(true);
    setError(null);

    try {
      pendingRequestRef.current = true;
      const data = await getUserData();
      lastRefreshRef.current = Date.now();

      if (data) {
        setProfile(data.profile);
        setUserData(data);

        // Update React Query caches
        queryClient.setQueryData(['userData'], data);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh user data');
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  };

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
