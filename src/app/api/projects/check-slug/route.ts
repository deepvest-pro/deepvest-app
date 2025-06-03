import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * GET /api/projects/check-slug
 * Check if a project slug is available
 *
 * This endpoint checks only if the slug exists in the database.
 * It uses a direct SQL query with service role to bypass RLS policies.
 *
 * Query parameters:
 * - slug: The slug to check
 * - currentSlug: (optional) The current slug of the project being edited - will be excluded from check
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const currentSlug = searchParams.get('currentSlug');

    console.log('GET /api/projects/check-slug - slug:', slug, 'currentSlug:', currentSlug);

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    // If the slug is the same as the current slug, it's available (no change)
    if (currentSlug && slug === currentSlug) {
      return NextResponse.json({
        available: true,
      });
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

    // Check if slug is already taken, excluding current project if provided
    let query = supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug);

    // If currentSlug is provided, we need to exclude the current project from the check
    // We do this by checking if there are any OTHER projects with this slug
    if (currentSlug) {
      // Get the project ID that currently has the currentSlug
      const { data: currentProject } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', currentSlug)
        .single();

      if (currentProject) {
        // Exclude the current project from the slug check
        query = query.neq('id', currentProject.id);
      }
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking slug availability:', error);
      return NextResponse.json({ error: 'Error checking slug availability' }, { status: 500 });
    }

    return NextResponse.json({
      available: count === 0,
    });
  } catch (error) {
    console.error('Unexpected error in check-slug route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
