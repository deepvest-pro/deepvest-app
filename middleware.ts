import { NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';
// TODO: Fix Civic Auth middleware integration when the package structure is better understood
// import { middleware as civicAuthMiddleware } from "@civic/auth-web3/nextjs";

/**
 * Middleware function to handle auth session updates and protected routes
 *
 * Use updated approach to authentication with Supabase
 * All access to Supabase is done on the server side
 */
export async function middleware(request: NextRequest) {
  // Update Supabase auth session
  const response = await updateSession(request);

  // Redirect to login if not authenticated and trying to access protected routes
  // This can be enabled later if needed

  return response;
}

// TODO: Enable Civic Auth middleware integration once we resolve the package structure
// export default civicAuthMiddleware(middleware);

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (optimized images)
     * - favicon.ico (site icon)
     * - images (static images)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
