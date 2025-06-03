'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { UserData, UserProfile } from '@/types/auth';

/**
 * Creates a Supabase client for server components and server actions
 * Uses private environment variables (without the NEXT_PUBLIC_ prefix)
 */
export async function createServerSupabaseClient() {
  let cookieStore;

  try {
    cookieStore = await cookies();
  } catch {
    console.warn('Unable to access cookie store, using memory storage instead');
    // Fallback for contexts where cookies() are not available
    const memoryStore = new Map<string, string>();

    // Return client with memory storage
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false, // Don't try to save session, we don't have access to cookies
          flowType: 'pkce',
          autoRefreshToken: false,
          detectSessionInUrl: true,
          storage: {
            getItem: key => memoryStore.get(key) || null,
            setItem: (key, value) => {
              memoryStore.set(key, value);
            },
            removeItem: key => {
              memoryStore.delete(key);
            },
          },
        },
      },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          try {
            const cookie = cookieStore.get(key);

            // Verify token integrity if it's an access token
            if ((key === 'sb-access-token' || key === 'sb-refresh-token') && cookie?.value) {
              const token = cookie.value;

              // Basic JWT validation
              const parts = token.split('.');
              if (parts.length !== 3) {
                console.error(`Invalid token format for ${key}`);
                return null;
              }

              try {
                // Check expiration
                const payload = JSON.parse(atob(parts[1]));
                const now = Math.floor(Date.now() / 1000);

                // If token is expired, don't return it
                if (typeof payload.exp === 'number' && payload.exp <= now) {
                  console.error(`Expired token found for ${key}`);
                  return null;
                }

                // If expiration time is unreasonably far in the future, don't accept it
                if (typeof payload.exp === 'number' && payload.exp > now + 1209600) {
                  // 2 weeks
                  console.error(`Suspicious token expiration for ${key}`);
                  return null;
                }
              } catch (e) {
                console.error(`Error parsing token for ${key}:`, e);
                return null;
              }
            }

            return cookie?.value ?? null;
          } catch (error) {
            console.error(`Error getting cookie ${key}:`, error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (
              err.message.includes(
                'Cookies can only be modified in a Server Action or Route Handler',
              )
            ) {
              console.debug(
                `Cookie set operation for "${key}" skipped in current Next.js context: ${err.message}`,
              );
            } else {
              console.warn(`Unable to set cookie ${key}: ${err.message}`);
            }
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.set(key, '', {
              path: '/',
              maxAge: 0,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (
              err.message.includes(
                'Cookies can only be modified in a Server Action or Route Handler',
              )
            ) {
              console.debug(
                `Cookie remove operation for "${key}" skipped in current Next.js context: ${err.message}`,
              );
            } else {
              console.warn(`Unable to remove cookie ${key}: ${err.message}`);
            }
          }
        },
      },
    },
  });
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Get user data with profile
 */
export async function getUserWithProfile(): Promise<UserData | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return null;
    }

    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    const profile: UserProfile | null = data
      ? {
          id: data.id,
          full_name: data.full_name,
          nickname: data.nickname,
          avatar_url: data.avatar_url,
          bio: data.bio,
          professional_background: data.professional_background,
          city: data.city,
          country: data.country,
          website_url: data.website_url,
          x_username: data.x_username,
          linkedin_username: data.linkedin_username,
          github_username: data.github_username,
          startup_ecosystem_role: data.startup_ecosystem_role,
        }
      : null;

    return {
      user: userData.user,
      profile,
    };
  } catch (error) {
    console.error('Error getting user with profile:', error);
    return null;
  }
}
