import type { User } from '@supabase/supabase-js';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

/**
 * Custom error class for API authentication errors
 */
export class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Middleware to require authentication for API routes
 * Throws APIError if user is not authenticated
 *
 * @returns Promise<User> - Authenticated user object
 * @throws {APIError} When user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const supabase = await SupabaseClientFactory.getServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new APIError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  return user;
}

/**
 * Middleware to optionally get authenticated user
 * Returns null if user is not authenticated (no error thrown)
 *
 * @returns Promise<User | null> - User object or null if not authenticated
 */
export async function getOptionalAuth(): Promise<User | null> {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Middleware to check project access permissions
 * @param userId User ID
 * @param projectId Project ID
 * @param requiredRole Minimum role required for access
 * @returns Project role of the user
 * @throws APIError if access is denied
 */
export async function requireProjectPermission(
  userId: string,
  projectId: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner' = 'viewer',
): Promise<{ role: 'viewer' | 'editor' | 'admin' | 'owner' }> {
  // TODO: Implement project permission check
  // For now, return owner role - will be implemented later
  console.log(
    'Checking permissions for user:',
    userId,
    'project:',
    projectId,
    'role:',
    requiredRole,
  );
  return { role: 'owner' };
}
