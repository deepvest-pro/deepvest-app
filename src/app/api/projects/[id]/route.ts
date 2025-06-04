import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import {
  getProjectWithDetails,
  getPublicProjectDocuments,
  getPublicProjectTeamMembers,
  updateProject,
} from '@/lib/supabase/helpers';
import { deleteProject } from '@/lib/api/project-api';

/**
 * GET /api/projects/[id] - Get project details
 * Public endpoint for retrieving project information
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const { id: projectId } = params;

  // Get basic project information
  const { data: project, error: projectError } = await getProjectWithDetails(projectId);
  if (projectError || !project) {
    throw new APIError(projectError || 'Project not found', 404);
  }

  // Get public project documents
  const { data: documents } = await getPublicProjectDocuments(projectId);

  // Get public team information
  const { data: team } = await getPublicProjectTeamMembers(projectId);

  return {
    project,
    documents: documents || [],
    team: team || [],
  };
});

/**
 * PUT /api/projects/[id] - Update project
 * Requires authentication and editor permissions
 */
export const PUT = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check access permissions (editor or higher)
  await requireProjectPermission(user.id, projectId, 'editor');

  // Validate input data
  const body = await request.json();
  const validatedData = ValidationSchemas.project.updateBody.parse(body);

  // Update project
  const { data: updatedProject, error } = await updateProject(projectId, validatedData);
  if (error || !updatedProject) {
    throw new APIError(error || 'Failed to update project', 500);
  }

  return { project: updatedProject };
});

/**
 * DELETE /api/projects/[id] - Delete project
 * Requires authentication and owner permissions
 */
export const DELETE = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check access permissions (only owner can delete)
  await requireProjectPermission(user.id, projectId, 'owner');

  // Delete project
  const { error } = await deleteProject(projectId);
  if (error) {
    throw new APIError(error, 500);
  }

  return { message: 'Project deleted successfully' };
});
