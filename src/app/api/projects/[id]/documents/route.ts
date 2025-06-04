import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { APIError, requireAuth, requireProjectPermission } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { projectDocumentsRepository } from '@/lib/supabase/repositories';
import { generateSlug } from '@/lib/utils/slug.util';
import { RepositoryResponse } from '@/lib/supabase/base-repository';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

/**
 * GET /api/projects/[id]/documents
 * Get documents for a specific project
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const { id: projectId } = params;
  const url = new URL(request.url);
  const publicOnly = url.searchParams.get('public_only') === 'true';

  if (publicOnly) {
    // Public documents - no authentication required
    const { data: documents, error } =
      await projectDocumentsRepository.findPublicByProjectId(projectId);

    if (error) {
      throw new APIError('Failed to fetch documents', 500);
    }

    return { documents };
  }

  // Private documents - require authentication and permissions
  const user = await requireAuth();
  await requireProjectPermission(user.id, projectId, 'viewer');

  const { data: documents, error } = await projectDocumentsRepository.findByProjectId(
    projectId,
    true,
  );

  if (error) {
    throw new APIError('Failed to fetch documents', 500);
  }

  return { documents };
});

/**
 * POST /api/projects/[id]/documents
 * Create new document
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check project permissions
  await requireProjectPermission(user.id, projectId, 'editor');

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.document.create.parse(body);

  // Define checkAvailability for document slugs within this project
  const checkDocumentSlugAvailability = async (
    slugToCheck: string,
    excludeDocId?: string,
  ): Promise<RepositoryResponse<boolean>> => {
    const { data: isAvailable, error } = await projectDocumentsRepository.isSlugAvailable(
      projectId,
      slugToCheck,
      excludeDocId,
    );

    if (error) {
      return { data: null, error: `DB error checking slug: ${error}` };
    }

    return { data: isAvailable, error: null };
  };

  // Generate unique slug from the provided slug or title
  const slugInput = validatedData.slug || validatedData.title;
  const slugResponse = await generateSlug(slugInput, {
    checkAvailability: checkDocumentSlugAvailability,
    allowUnderscores: true,
  });

  if (slugResponse.error || !slugResponse.data) {
    throw new APIError(
      `Failed to generate a unique slug: ${slugResponse.error || 'No slug data returned'}`,
      500,
    );
  }

  // Create document with unique slug
  const documentData = {
    ...validatedData,
    slug: slugResponse.data,
    project_id: projectId,
    author_id: user.id,
  };

  const { data: document, error } = await projectDocumentsRepository.createDocument(documentData);

  if (error || !document) {
    throw new APIError(error || 'Failed to create document', 500);
  }

  // Sync snapshot data after creating document
  try {
    await syncSnapshotData(projectId);
  } catch (syncError) {
    console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
    // Don't fail the request if sync fails
  }

  return { document };
});
