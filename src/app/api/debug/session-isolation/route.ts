/**
 * Debug API endpoint to check session isolation
 * This endpoint helps verify that the SSR session leakage fix is working correctly
 *
 * Usage: GET /api/debug/session-isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { fullSessionIsolationCheck } from '@/lib/supabase/session-isolation-check';

export async function GET(request: NextRequest) {
  try {
    // Only allow this endpoint in development or with specific debug header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasDebugHeader = request.headers.get('x-debug-session') === 'true';

    if (!isDevelopment && !hasDebugHeader) {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 },
      );
    }

    // Run the session isolation check
    const checkResult = await fullSessionIsolationCheck();

    // Add request information for debugging
    const cookieNames = [];
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim().split('=')[0]);
      cookieNames.push(...cookies.filter(name => name.includes('auth') || name.includes('sb-')));
    }

    const requestInfo = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      cookies: {
        total: cookieHeader ? cookieHeader.split(';').length : 0,
        authCookieNames: cookieNames,
      },
    };

    return NextResponse.json({
      status: 'success',
      message: 'Session isolation check completed',
      request: requestInfo,
      check: checkResult,
      instructions: {
        howToTest: [
          '1. Open this endpoint in one browser while logged in as User A',
          '2. Open the same endpoint in another browser/incognito as User B',
          '3. Compare the userInfo.userId values - they should be different',
          '4. Verify clientIsolation.isIsolated is true in both cases',
        ],
        expectedResults: {
          clientIsolation: 'Should always be true (different client instances)',
          userSessions: 'Should show different userIds for different authenticated users',
        },
      },
    });
  } catch (error) {
    console.error('[session-isolation] Debug endpoint error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check session isolation',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Also support POST for more detailed testing
export async function POST(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasDebugHeader = request.headers.get('x-debug-session') === 'true';

    if (!isDevelopment && !hasDebugHeader) {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const iterations = Math.min(body.iterations || 3, 10); // Max 10 iterations

    // Run multiple checks to verify consistency
    const results: Array<Record<string, any>> = [];
    for (let i = 0; i < iterations; i++) {
      const result = await fullSessionIsolationCheck();
      results.push({
        iteration: i + 1,
        ...result,
      });

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      status: 'success',
      message: `Completed ${iterations} session isolation checks`,
      results,
      summary: {
        allIsolated: results.every(r => r.clientIsolation.isIsolated),
        consistentUser: results.every(r => r.userInfo.userId === results[0].userInfo.userId),
        totalChecks: iterations,
      },
    });
  } catch (error) {
    console.error('[session-isolation] POST endpoint error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to run multiple session isolation checks',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
