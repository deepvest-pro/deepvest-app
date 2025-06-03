import { z } from 'zod';
import type { ProjectStatus } from '@/types/supabase';

// Enums for dropdown selection
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'concept', label: 'Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launched', label: 'Launched' },
  { value: 'growing', label: 'Growing' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'established', label: 'Established' },
  { value: 'acquired', label: 'Acquired' },
  { value: 'closed', label: 'Closed' },
];

/**
 * Utility for slug generation from text
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Project name must be at least 2 characters' })
    .max(50, { message: 'Project name cannot exceed 50 characters' }),
  slug: z
    .string()
    .min(2, { message: 'URL must be at least 2 characters' })
    .max(50, { message: 'URL cannot exceed 50 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'URL can only contain lowercase letters, numbers, and hyphens',
    }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(500, { message: 'Description cannot exceed 500 characters' }),
  status: z.enum([
    'idea',
    'concept',
    'prototype',
    'mvp',
    'beta',
    'launched',
    'growing',
    'scaling',
    'established',
    'acquired',
    'closed',
  ]),
});

/**
 * Type for creating a new project
 */
export type CreateProjectForm = z.infer<typeof createProjectSchema>;

/**
 * Schema for updating a project
 */
export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Type for updating a project
 */
export type UpdateProjectForm = z.infer<typeof updateProjectSchema>;

/**
 * Schema for validating project snapshots (matching DB structure)
 */
export const snapshotSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  slogan: z
    .string()
    .max(200, { message: 'Slogan cannot exceed 200 characters' })
    .optional()
    .nullable(),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' }),
  status: z.enum([
    'idea',
    'concept',
    'prototype',
    'mvp',
    'beta',
    'launched',
    'growing',
    'scaling',
    'established',
    'acquired',
    'closed',
  ]),
  country: z
    .string()
    .max(100, { message: 'Country cannot exceed 100 characters' })
    .optional()
    .nullable(),
  city: z.string().max(100, { message: 'City cannot exceed 100 characters' }).optional().nullable(),
  repository_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
  website_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
  logo_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  banner_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  video_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
});

/**
 * Type for snapshot form data
 */
export type SnapshotForm = z.infer<typeof snapshotSchema>;

/**
 * Schema for project permission management
 */
export const permissionSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  role: z.enum(['viewer', 'editor', 'admin']),
});

/**
 * Type for project permission form
 */
export type PermissionForm = z.infer<typeof permissionSchema>;
