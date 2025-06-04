import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandler } from '@/lib/api/base-handler';
import { requireAuth, getOptionalAuth, APIError } from '@/lib/api/middleware/auth';
import { getAllVisibleProjects, createNewProject, isSlugAvailable } from '@/lib/supabase/helpers';
import { ValidationSchemas } from '@/lib/validations';
import { createCEOTeamMember } from '@/lib/supabase/team-helpers';

/**
 * GET /api/projects
 * Get all visible projects:
 * - For guests: all public projects
 * - For authenticated users: all public projects + their own projects
 */
export const GET = createAPIHandler(async () => {
  const user = await getOptionalAuth();

  const { data, error } = await getAllVisibleProjects(user?.id);

  if (error || !data) {
    throw new APIError(error || 'Failed to fetch projects', 500);
  }

  return { projects: data };
});

/**
 * POST /api/projects
 * Create a new project
 */
export const POST = createAPIHandler(async (request: NextRequest) => {
  const user = await requireAuth();

  const json = await request.json();

  // Validate the request body
  const validatedData = ValidationSchemas.project.create
    .extend({
      skipAutoTeam: z.boolean().optional(),
    })
    .parse(json);

  const { name, slug, description, status, skipAutoTeam } = validatedData;

  // Check if slug is available
  const { available, error: slugError } = await isSlugAvailable(slug);

  if (slugError) {
    throw new APIError(slugError, 500);
  }

  if (!available) {
    throw new APIError('Project URL is already taken. Please choose a different one.', 409);
  }

  // Create the project
  const { data, error } = await createNewProject(name, slug, description, status);

  if (error || !data) {
    throw new APIError(error || 'Failed to create project', 500);
  }

  // Ensure we're returning the project ID, not the snapshot ID
  // Check if data is a string (just an ID) or an object
  const projectData = typeof data === 'string' ? { id: data, slug, name, description } : data;

  // Make sure we have an ID in the response
  if (!projectData.id) {
    console.error('Missing project ID in createNewProject response', projectData);
    throw new APIError('Server error: Invalid project data returned', 500);
  }

  // Create CEO team member for the project creator (only if not skipped)
  if (!skipAutoTeam) {
    const ceoMember = await createCEOTeamMember(projectData.id, user);
    if (ceoMember) {
      console.log('CEO team member created for project:', projectData.id);
    }
  } else {
    console.log('Skipping auto CEO creation for AI-generated project:', projectData.id);
  }

  // Return the full project object with all fields
  return {
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
  };
});
