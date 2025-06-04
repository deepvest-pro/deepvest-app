/**
 * Utility to verify that server clients are properly isolated between requests
 * This helps ensure the SSR session leakage fix is working correctly
 */

import { SupabaseClientFactory } from './client-factory';

/**
 * Check if server clients are properly isolated (not cached)
 * This function can be called from API routes or server components for debugging
 */
export async function checkServerClientIsolation(): Promise<{
  isIsolated: boolean;
  details: string;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  try {
    // Get two server clients
    const client1 = await SupabaseClientFactory.getServerClient();
    const client2 = await SupabaseClientFactory.getServerClient();
    
    // Check if they are different instances
    const isIsolated = client1 !== client2;
    
    const details = isIsolated 
      ? 'SUCCESS: Server clients are properly isolated (different instances created)'
      : 'WARNING: Server clients appear to be cached (same instance returned)';
    
    return {
      isIsolated,
      details,
      timestamp
    };
  } catch (error) {
    return {
      isIsolated: false,
      details: `ERROR: Failed to check isolation - ${error instanceof Error ? error.message : String(error)}`,
      timestamp
    };
  }
}

/**
 * Get current user information for debugging session isolation
 * This helps verify that different requests see different user data
 */
export async function getCurrentUserInfo(): Promise<{
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = await SupabaseClientFactory.getServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('[getCurrentUserInfo] Auth error:', error.message);
    }
    
    return {
      userId: user?.id || null,
      email: user?.email || null,
      isAuthenticated: !!user,
      timestamp
    };
  } catch (error) {
    console.error('[getCurrentUserInfo] Error:', error);
    return {
      userId: null,
      email: null,
      isAuthenticated: false,
      timestamp
    };
  }
}

/**
 * Comprehensive session isolation check
 * Returns detailed information about client isolation and user session
 */
export async function fullSessionIsolationCheck(): Promise<{
  clientIsolation: Awaited<ReturnType<typeof checkServerClientIsolation>>;
  userInfo: Awaited<ReturnType<typeof getCurrentUserInfo>>;
  recommendations: string[];
}> {
  const clientIsolation = await checkServerClientIsolation();
  const userInfo = await getCurrentUserInfo();
  
  const recommendations: string[] = [];
  
  if (!clientIsolation.isIsolated) {
    recommendations.push(
      'CRITICAL: Server clients are being cached. This can cause user session leakage in SSR.'
    );
    recommendations.push(
      'Fix: Ensure SupabaseClientFactory.getServerClient() creates new instances for each request.'
    );
  }
  
  if (userInfo.isAuthenticated) {
    recommendations.push(
      'INFO: User is authenticated. Test with multiple users to verify session isolation.'
    );
  } else {
    recommendations.push(
      'INFO: No authenticated user. Test with authenticated users to verify session isolation.'
    );
  }
  
  return {
    clientIsolation,
    userInfo,
    recommendations
  };
}
