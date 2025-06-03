import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { updateSnapshotContents } from '@/lib/supabase/helpers';

// Validation schema for updating project content
const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(
      /^[a-z0-9-_]+$/,
      'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
    )
    .optional(),
  content_type: z
    .enum([
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
    ])
    .optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
});

// GET /api/projects/[id]/documents/[docId] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { id: projectId, docId } = await params;

    // Get the document
    const query = supabase
      .from('project_content')
      .select('*')
      .eq('project_id', projectId)
      .eq('id', docId)
      .is('deleted_at', null)
      .single();

    const { data: document, error: documentError } = await query;

    if (documentError) {
      if (documentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      console.error('Error fetching document:', documentError);
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }

    // Check if user can access this document
    if (!document.is_public) {
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has permission to view this project
      const { data: permission, error: permissionError } = await supabase
        .from('project_permissions')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (permissionError || !permission) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document GET handler error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/documents/[docId] - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
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

    const { id: projectId, docId } = await params;

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

    // Get the document to check ownership
    const { data: existingDocument, error: docError } = await supabase
      .from('project_content')
      .select('author_id')
      .eq('id', docId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();

    if (docError) {
      if (docError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }

    // Check if user can edit this document (author or admin/owner)
    const canEdit =
      existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const updateData = validationResult.data;

    // If slug is being updated, check availability
    if (updateData.slug) {
      const { data: slugCheck } = await supabase.rpc('check_content_slug_availability', {
        p_project_id: projectId,
        p_slug: updateData.slug,
        p_content_id: docId,
      });

      if (!slugCheck) {
        return NextResponse.json({ error: 'Slug already exists in this project' }, { status: 400 });
      }
    }

    // Update the document
    const { data: document, error: updateError } = await supabase
      .from('project_content')
      .update(updateData)
      .eq('id', docId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // Update snapshot contents to mark it as changed
    await updateSnapshotContents(projectId);

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document PUT handler error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/documents/[docId] - Soft delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
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

    const { id: projectId, docId } = await params;

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

    // Get the document to check ownership
    const { data: existingDocument, error: docError } = await supabase
      .from('project_content')
      .select('author_id')
      .eq('id', docId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();

    if (docError) {
      if (docError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }

    // Check if user can delete this document (author or admin/owner)
    const canDelete =
      existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Soft delete the document by setting deleted_at
    const { error: deleteError } = await supabase
      .from('project_content')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', docId)
      .eq('project_id', projectId)
      .is('deleted_at', null);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    // Update snapshot contents to mark it as changed
    await updateSnapshotContents(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE handler error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
