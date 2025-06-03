import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { updateSnapshotContents } from '@/lib/supabase/helpers';

// Validation schema for creating/updating project content
const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(
      /^[a-z0-9-_]+$/,
      'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
    ),
  content_type: z.enum([
    'presentation',
    'research',
    'pitch_deck',
    'whitepaper',
    'video',
    'audio',
    'image',
    'report',
    'document',
    'spreadsheet',
    'table',
    'chart',
    'infographic',
    'case_study',
    'other',
  ]),
  content: z.string().optional().default(''),
  description: z.string().optional(),
  file_urls: z.array(z.string().url()).min(1, 'At least one file URL is required'),
  is_public: z.boolean().default(false),
});

// GET /api/projects/[id]/documents - List project documents
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public_only') === 'true';

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { id: projectId } = await params;

    // Build base query without JOIN to avoid schema cache issues
    let query = supabase
      .from('project_content')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // If public_only is requested or user is not authenticated, only show public documents
    if (publicOnly || authError || !user) {
      query = query.eq('is_public', true);
    } else {
      // For authenticated users, check permissions for private documents
      const { data: permission, error: permissionError } = await supabase
        .from('project_permissions')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      // If user doesn't have permissions, only show public documents
      if (permissionError || !permission) {
        query = query.eq('is_public', true);
      }
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Get author information separately if we have documents
    let documentsWithAuthors = documents || [];
    if (documents && documents.length > 0) {
      const authorIds = [...new Set(documents.map(doc => doc.author_id))];

      const { data: authors } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', authorIds);

      // Map authors to documents
      documentsWithAuthors = documents.map(doc => ({
        ...doc,
        author: authors?.find(author => author.id === doc.author_id) || null,
      }));
    }

    return NextResponse.json({ documents: documentsWithAuthors });
  } catch (error) {
    console.error('Documents GET handler error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/projects/[id]/documents - Create new document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user has permission to edit this project
    const { data: permission, error: permissionError } = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Check if user has edit permissions
    if (!['owner', 'admin', 'editor'].includes(permission.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const { title, slug, content_type, content, description, file_urls, is_public } =
      validationResult.data;

    // Check if slug is available within the project
    const { data: slugCheck } = await supabase.rpc('check_content_slug_availability', {
      p_project_id: projectId,
      p_slug: slug,
    });

    if (!slugCheck) {
      return NextResponse.json({ error: 'Slug already exists in this project' }, { status: 400 });
    }

    // Create the document
    const { data: document, error: createError } = await supabase
      .from('project_content')
      .insert({
        project_id: projectId,
        title,
        slug,
        content_type,
        content,
        description,
        file_urls,
        author_id: user.id,
        is_public,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating document:', createError);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    // Update snapshot contents to mark it as changed
    await updateSnapshotContents(projectId);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Documents POST handler error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
