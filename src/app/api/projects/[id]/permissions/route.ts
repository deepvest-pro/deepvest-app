import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { APIError, requireAuth, requireProjectPermission } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { addUserToProject, removeUserFromProject, updateUserRole } from '@/lib/supabase/helpers';

/**
 * POST /api/projects/[id]/permissions
 * Add a user to the project with a specific role
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has admin permission for this project
  await requireProjectPermission(user.id, projectId, 'admin');

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.project.permission.parse(body);

  // Add the user to the project
  const { success, error } = await addUserToProject(
    projectId,
    validatedData.email,
    validatedData.role,
  );

  if (!success) {
    throw new APIError(error || 'Failed to add user to project', 500);
  }

  return { success: true };
});

/**
 * PUT /api/projects/[id]/permissions
 * Update user's role in the project
 */
export const PUT = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has admin permission for this project
  await requireProjectPermission(user.id, projectId, 'admin');

  // Validate request body
  const body = await request.json();
  const updateSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['viewer', 'editor', 'admin', 'owner']),
  });
  const validatedData = updateSchema.parse(body);

  // Update the user's role
  const { success, error } = await updateUserRole(
    projectId,
    validatedData.userId,
    validatedData.role,
  );

  if (!success) {
    throw new APIError(error || 'Failed to update user role', 500);
  }

  return { success: true };
});

/**
 * DELETE /api/projects/[id]/permissions
 * Remove a user from the project
 */
export const DELETE = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has admin permission for this project
  await requireProjectPermission(user.id, projectId, 'admin');

  // Get userId from query parameters
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    throw new APIError('User ID is required', 400);
  }

  // Remove the user from the project
  const { success, error } = await removeUserFromProject(projectId, userId);

  if (!success) {
    throw new APIError(error || 'Failed to remove user from project', 500);
  }

  return { success: true };
});
