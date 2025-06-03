'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { UserData } from '@/types/auth';
import { getUser, getSession, getUserData } from './auth-actions';

// staleTime and cacheTime
const AUTH_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const AUTH_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to fetch the current user using React Query
 * Uses server action instead of direct connection to Supabase
 */
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      return getUser();
    },
    staleTime: AUTH_STALE_TIME,
    gcTime: AUTH_CACHE_TIME,
    // Avoid extra API requests when mounting
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch the current session using React Query
 * Uses server action instead of direct connection to Supabase
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      return getSession();
    },
    staleTime: AUTH_STALE_TIME,
    gcTime: AUTH_CACHE_TIME,
    // Avoid extra API requests when mounting
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch the user's full profile data (auth user + profile) using React Query
 * Uses server action instead of direct connection to Supabase
 */
export function useUserData(
  options: {
    initialData?: UserData | null;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: ['userData'],
    queryFn: async (): Promise<UserData | null> => {
      return getUserData();
    },
    initialData: options.initialData,
    staleTime: options.staleTime || AUTH_STALE_TIME,
    gcTime: AUTH_CACHE_TIME,
    // Avoid extra API requests when mounting
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to invalidate all auth-related queries
 */
export function useInvalidateAuthQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['session'] });
    queryClient.invalidateQueries({ queryKey: ['userData'] });
  };
}
