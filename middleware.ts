import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware function to handle auth session updates and protected routes
 */
export async function middleware(request: NextRequest) {
  // Update Supabase auth session
  const response = await updateSession(request);

  // Redirect to login if not authenticated and trying to access protected routes
  // This can be enabled later if needed

  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    // Match all paths except for those listed below
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
