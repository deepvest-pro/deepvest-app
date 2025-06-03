import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * GET /api/projects/check-slug
 * Check if a project slug is available
 *
 * This endpoint checks only if the slug exists in the database.
 * It uses a direct SQL query with service role to bypass RLS policies.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Slug can only contain lowercase letters, numbers, and hyphens',
        },
        { status: 200 },
      );
    }

    if (slug.length < 3 || slug.length > 60) {
      return NextResponse.json(
        {
          available: false,
          error: 'Slug must be between 3 and 60 characters long',
        },
        { status: 200 },
      );
    }

    // Create a Supabase client with the service key (if available) or anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Use service role key if available (bypasses RLS)
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Using direct SQL query to bypass any problematic RLS policies
    const { data, error } = await supabase.rpc('check_slug_availability', {
      slug_to_check: slug,
    });

    if (error) {
      console.error('Error checking slug availability:', error);

      // Fall back to direct table query if RPC fails
      try {
        const { count, error: countError } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('slug', slug);

        if (countError) {
          throw countError;
        }

        return NextResponse.json({
          available: count === 0,
        });
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        return NextResponse.json({ error: 'Error checking slug availability' }, { status: 500 });
      }
    }

    return NextResponse.json({
      available: data === true,
    });
  } catch (error) {
    console.error('Unexpected error in check-slug route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
