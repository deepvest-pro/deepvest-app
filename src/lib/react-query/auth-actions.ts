'use server';

import type { Session, User } from '@supabase/supabase-js';
import type { UserData } from '@/types/auth';
import { getCurrentUser, getUserWithProfile } from '../supabase/client';

/**
 * Get current user (only user data)
 * Used with the useUser client hook
 */
export async function getUser(): Promise<User | null> {
  return getCurrentUser();
}

/**
 * Get current session (DEPRECATED - use getUser instead for security)
 * This function is deprecated and should not be used in new code.
 */
export async function getSession(): Promise<Session | null> {
  console.warn(
    '[getSession] DEPRECATED: This function is deprecated for security reasons. Use getUser() instead.',
  );
  return null;
}

/**
 * Get user data with profile
 * Used with the useUserData client hook
 */
export async function getUserData(): Promise<UserData | null> {
  return getUserWithProfile();
}
