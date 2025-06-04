import { cookies } from 'next/headers';
import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Factory class for creating and managing Supabase clients
 * Provides centralized client creation with caching and error handling
 */
export class SupabaseClientFactory {
  private static serverClient: Promise<SupabaseClient<Database>> | null = null;
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static browserClient: SupabaseClient<Database> | null = null;

  /**
   * Get or create a server-side Supabase client
   * Uses caching to avoid recreating clients unnecessarily
   *
   * @returns Promise<SupabaseClient<Database>> - Configured Supabase client
   * @throws {Error} When environment variables are missing
   */
  static async getServerClient(): Promise<SupabaseClient<Database>> {
    if (!this.serverClient) {
      this.serverClient = this.createServerClient();
    }
    return this.serverClient;
  }

  /**
   * Get or create a service role Supabase client
   * This client bypasses RLS policies and should only be used in API endpoints
   * for administrative operations like soft deletes
   *
   * @returns SupabaseClient<Database> - Service role Supabase client
   * @throws {Error} When environment variables are missing
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    if (!this.serviceRoleClient) {
      this.serviceRoleClient = this.createServiceRoleClient();
    }
    return this.serviceRoleClient;
  }

  /**
   * Get or create a browser-side Supabase client
   * Use this for client-side operations where cookies can't be modified
   *
   * @returns SupabaseClient<Database> - Browser Supabase client
   * @throws {Error} When environment variables are missing
   */
  static getBrowserClient(): SupabaseClient<Database> {
    if (!this.browserClient) {
      this.browserClient = this.createBrowserClient();
    }
    return this.browserClient;
  }

  /**
   * Create a new server-side Supabase client
   * Handles Next.js 15 async cookies and proper SSR configuration
   *
   * @private
   * @returns Promise<SupabaseClient<Database>> - New Supabase client instance
   */
  private static async createServerClient(): Promise<SupabaseClient<Database>> {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      );
    }

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: async (name: string) => {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          try {
            const cookieStore = await cookies();
            cookieStore.set(name, value, options);
          } catch {
            // In Next.js 15, cookies can only be modified in Server Actions or Route Handlers
            // This is expected behavior in some contexts (like Server Components)
            // We silently ignore this error as it's normal during SSR
            if (process.env.NODE_ENV === 'development') {
              console.debug(
                '[SupabaseClientFactory] Cannot set cookie in current context (this is expected in Server Components):',
                name,
              );
            }
          }
        },
        remove: async (name: string, options: CookieOptions) => {
          try {
            const cookieStore = await cookies();
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch {
            // In Next.js 15, cookies can only be modified in Server Actions or Route Handlers
            // This is expected behavior in some contexts (like Server Components)
            // We silently ignore this error as it's normal during SSR
            if (process.env.NODE_ENV === 'development') {
              console.debug(
                '[SupabaseClientFactory] Cannot remove cookie in current context (this is expected in Server Components):',
                name,
              );
            }
          }
        },
      },
    });
  }

  /**
   * Create a new browser-side Supabase client
   * Safe for use in client components where cookies cannot be modified
   *
   * @private
   * @returns SupabaseClient<Database> - New browser Supabase client instance
   */
  private static createBrowserClient(): SupabaseClient<Database> {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      );
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Create a new service role Supabase client
   * This client bypasses RLS policies
   *
   * @private
   * @returns SupabaseClient<Database> - New service role Supabase client instance
   */
  private static createServiceRoleClient(): SupabaseClient<Database> {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Clear the cached client instance
   * Useful for testing or when client configuration changes
   */
  static clearCache(): void {
    this.serverClient = null;
    this.serviceRoleClient = null;
    this.browserClient = null;
  }

  /**
   * Check if environment variables are properly configured
   *
   * @returns boolean - True if all required environment variables are present
   */
  static isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  /**
   * Check if service role is properly configured
   *
   * @returns boolean - True if service role key is present
   */
  static isServiceRoleConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
}
