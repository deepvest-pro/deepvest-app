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
 * Schema for validating project snapshots
 */
export const snapshotSchema = z.object({
  title: z
    .string()
    .min(2, { message: 'Title must be at least 2 characters' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),
  description: z
    .string()
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .optional(),
  problem: z
    .string()
    .max(2000, { message: 'Problem statement cannot exceed 2000 characters' })
    .optional(),
  solution: z
    .string()
    .max(2000, { message: 'Solution description cannot exceed 2000 characters' })
    .optional(),
  target_audience: z
    .string()
    .max(1000, { message: 'Target audience cannot exceed 1000 characters' })
    .optional(),
  market_size: z
    .string()
    .max(1000, { message: 'Market size cannot exceed 1000 characters' })
    .optional(),
  business_model: z
    .string()
    .max(1000, { message: 'Business model cannot exceed 1000 characters' })
    .optional(),
  competitive_advantage: z
    .string()
    .max(1000, { message: 'Competitive advantage cannot exceed 1000 characters' })
    .optional(),
  funding_stage: z
    .string()
    .max(100, { message: 'Funding stage cannot exceed 100 characters' })
    .optional(),
  funding_goal: z
    .string()
    .max(100, { message: 'Funding goal cannot exceed 100 characters' })
    .optional(),
  revenue: z
    .string()
    .max(100, { message: 'Revenue information cannot exceed 100 characters' })
    .optional(),
  team_description: z
    .string()
    .max(1000, { message: 'Team description cannot exceed 1000 characters' })
    .optional(),
  timeline: z.string().max(1000, { message: 'Timeline cannot exceed 1000 characters' }).optional(),
  looking_for: z
    .string()
    .max(500, { message: 'Looking for cannot exceed 500 characters' })
    .optional(),
  contact_email: z
    .string()
    .email({ message: 'Must be a valid email address' })
    .optional()
    .or(z.literal('')),
  website_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  pitch_deck_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  demo_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
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
