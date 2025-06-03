import { NextResponse } from 'next/server';
import { createNewProject, getUserProjects } from '@/lib/supabase/helpers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createProjectSchema } from '@/lib/validations/project';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * GET /api/projects
 * Get all projects for the current user
 */
export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getUserProjects(session.user.id);

  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to fetch projects' }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

/**
 * Directly check if a slug is available without using policies
 */
async function checkSlugAvailability(
  slug: string,
): Promise<{ available: boolean; error?: string }> {
  try {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return {
        available: false,
        error: 'Slug can only contain lowercase letters, numbers, and hyphens',
      };
    }

    if (slug.length < 3 || slug.length > 60) {
      return {
        available: false,
        error: 'Slug must be between 3 and 60 characters long',
      };
    }

    // Create a Supabase client with service role key if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return { available: false, error: 'Server configuration error' };
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Try to use the RPC function first
    try {
      const { data, error } = await supabase.rpc('check_slug_availability', {
        slug_to_check: slug,
      });

      if (error) throw error;

      return {
        available: data === true,
      };
    } catch (rpcError) {
      console.error('RPC check failed, falling back to direct query:', rpcError);

      // Fall back to direct query with count
      const { count, error: countError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (countError) {
        console.error('Count query failed:', countError);
        return { available: false, error: 'Error checking slug availability' };
      }

      return {
        available: count === 0,
      };
    }
  } catch (error) {
    console.error('Unexpected error checking slug:', error);
    return { available: false, error: 'Server error' };
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();

    // Validate the request body
    const { name, slug, description, status } = createProjectSchema.parse(json);

    // Check if slug is available
    const { available, error: slugError } = await checkSlugAvailability(slug);

    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 500 });
    }

    if (!available) {
      return NextResponse.json(
        { error: 'Project URL is already taken. Please choose a different one.' },
        { status: 409 },
      );
    }

    // Create the project
    const { data, error } = await createNewProject(name, slug, description, status);

    if (error || !data) {
      return NextResponse.json({ error: error || 'Failed to create project' }, { status: 500 });
    }

    // Ensure we're returning the project ID, not the snapshot ID
    // Check if data is a string (just an ID) or an object
    const projectData = typeof data === 'string' ? { id: data, slug, name, description } : data;

    // Make sure we have an ID in the response
    if (!projectData.id) {
      console.error('Missing project ID in createNewProject response', projectData);
      return NextResponse.json(
        { error: 'Server error: Invalid project data returned' },
        { status: 500 },
      );
    }

    // Return the full project object with all fields
    return NextResponse.json(
      {
        project: {
          id: projectData.id,
          slug,
          name,
          description,
          status,
          created_at: new Date().toISOString(),
          new_snapshot_id: projectData.new_snapshot_id,
          // Include all other fields from data if they exist
          ...projectData,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
