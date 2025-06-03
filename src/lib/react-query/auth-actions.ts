'use server';

import type { Session, User } from '@supabase/supabase-js';
import type { UserData } from '@/types/auth';
import { getCurrentUser, getCurrentSession, getUserWithProfile } from '../supabase/client';

/**
 * Get current user (only user data)
 * Used with the useUser client hook
 */
export async function getUser(): Promise<User | null> {
  return getCurrentUser();
}

/**
 * Get current session
 * Used with the useSession client hook
 */
export async function getSession(): Promise<Session | null> {
  return getCurrentSession();
}

/**
 * Get user data with profile
 * Used with the useUserData client hook
 */
export async function getUserData(): Promise<UserData | null> {
  return getUserWithProfile();
}
