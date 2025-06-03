import { z } from 'zod';
import type { TeamMemberStatus, TeamMemberWithAuthor } from '@/types/supabase';

// Team member status options for dropdowns
export const TEAM_MEMBER_STATUSES: { value: TeamMemberStatus; label: string }[] = [
  { value: 'ghost', label: 'Ghost Member' },
  { value: 'invited', label: 'Invited' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Common business position options for team members (renamed from COMMON_ROLES to avoid confusion)
export const COMMON_POSITIONS = [
  'CEO',
  'CTO',
  'Product Manager',
  'Lead Developer',
  'Backend Developer',
  'Frontend Developer',
  'QA Engineer',
  'Designer',
  'DevOps Engineer',
  'Sales Manager',
  'Marketing Manager',
  'HR Manager',
  'Mentor',
];

/**
 * Schema for creating a new team member
 */
export const createTeamMemberSchema = z.object({
  project_id: z.string().uuid({ message: 'Invalid project ID' }),
  author_id: z.string().uuid({ message: 'Invalid author ID' }),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z.string().email({ message: 'Must be a valid email address' }).optional().nullable(),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, { message: 'Must be a valid phone number' })
    .optional()
    .nullable(),
  image_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  country: z
    .string()
    .max(100, { message: 'Country cannot exceed 100 characters' })
    .optional()
    .nullable(),
  city: z.string().max(100, { message: 'City cannot exceed 100 characters' }).optional().nullable(),
  is_founder: z.boolean().default(false),
  equity_percent: z
    .number()
    .min(0, { message: 'Equity percentage cannot be negative' })
    .max(100, { message: 'Equity percentage cannot exceed 100%' })
    .optional()
    .nullable(),
  positions: z
    .array(z.string().min(1, { message: 'Position cannot be empty' }))
    .min(1, { message: 'At least one position is required' })
    .max(10, { message: 'Cannot have more than 10 positions' }),
  status: z.enum(['ghost', 'invited', 'active', 'inactive']).default('active'),
  x_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  github_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  linkedin_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  user_id: z.string().uuid({ message: 'Invalid user ID' }).optional().nullable(),
  joined_at: z.string().datetime({ message: 'Must be a valid datetime' }).optional().nullable(),
  departed_at: z.string().datetime({ message: 'Must be a valid datetime' }).optional().nullable(),
  departed_reason: z
    .string()
    .max(500, { message: 'Departure reason cannot exceed 500 characters' })
    .optional()
    .nullable(),
});

/**
 * Type for creating a new team member
 */
export type CreateTeamMemberForm = z.infer<typeof createTeamMemberSchema>;

/**
 * Schema for updating a team member
 */
export const updateTeamMemberSchema = createTeamMemberSchema
  .omit({ project_id: true })
  .partial()
  .extend({
    id: z.string().uuid({ message: 'Invalid team member ID' }),
  });

/**
 * Type for updating a team member
 */
export type UpdateTeamMemberForm = z.infer<typeof updateTeamMemberSchema>;

/**
 * Schema for team member form (used in UI components)
 */
export const teamMemberFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z
    .string()
    .email({ message: 'Must be a valid email address' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, { message: 'Must be a valid phone number' })
    .optional()
    .or(z.literal('')),
  image_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  country: z
    .string()
    .max(100, { message: 'Country cannot exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, { message: 'City cannot exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  is_founder: z.boolean().optional(),
  equity_percent: z
    .number()
    .min(0, { message: 'Equity percentage cannot be negative' })
    .max(100, { message: 'Equity percentage cannot exceed 100%' })
    .optional()
    .nullable(),
  positions: z
    .array(z.string().min(1, { message: 'Position cannot be empty' }))
    .min(1, { message: 'At least one position is required' })
    .max(10, { message: 'Cannot have more than 10 positions' }),
  status: z.enum(['ghost', 'invited', 'active', 'inactive']).optional(),
  x_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  github_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  linkedin_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  joined_at: z
    .string()
    .datetime({ message: 'Must be a valid datetime' })
    .optional()
    .or(z.literal('')),
  departed_at: z
    .string()
    .datetime({ message: 'Must be a valid datetime' })
    .optional()
    .or(z.literal('')),
  departed_reason: z
    .string()
    .max(500, { message: 'Departure reason cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
});

/**
 * Type for team member form data
 */
export type TeamMemberForm = z.infer<typeof teamMemberFormSchema>;

/**
 * Schema for bulk team member operations
 */
export const bulkTeamMemberSchema = z.object({
  action: z.enum([
    'delete',
    'update_status',
    'update_positions',
    'activate',
    'deactivate',
    'invite',
  ]),
  team_member_ids: z.array(z.string().uuid()),
  update_data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Type for bulk team member operations
 */
export type BulkTeamMemberForm = z.infer<typeof bulkTeamMemberSchema>;

/**
 * Schema for team member invitation
 */
export const inviteTeamMemberSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  positions: z
    .array(z.string().min(1, { message: 'Position cannot be empty' }))
    .min(1, { message: 'At least one position is required' })
    .max(10, { message: 'Cannot have more than 10 positions' }),
  message: z
    .string()
    .max(500, { message: 'Invitation message cannot exceed 500 characters' })
    .optional(),
});

/**
 * Type for team member invitation
 */
export type InviteTeamMemberForm = z.infer<typeof inviteTeamMemberSchema>;

/**
 * Schema for team member search and filtering
 */
export const teamMemberFilterSchema = z.object({
  status: z.enum(['ghost', 'invited', 'active', 'inactive']).optional(),
  is_founder: z.boolean().optional(),
  positions: z.array(z.string()).optional(),
  search: z.string().optional(),
});

/**
 * Type for team member filtering
 */
export type TeamMemberFilter = z.infer<typeof teamMemberFilterSchema>;

/**
 * Utility function to transform form data to API format
 */
export const transformTeamMemberFormToAPI = (
  formData: TeamMemberForm,
  projectId: string,
  authorId: string,
): CreateTeamMemberForm => {
  return {
    project_id: projectId,
    author_id: authorId,
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    image_url: formData.image_url || null,
    country: formData.country || null,
    city: formData.city || null,
    is_founder: formData.is_founder ?? false,
    equity_percent: formData.equity_percent,
    positions: formData.positions,
    status: formData.status ?? 'active',
    x_url: formData.x_url || null,
    github_url: formData.github_url || null,
    linkedin_url: formData.linkedin_url || null,
    joined_at: formData.joined_at || null,
    departed_at: formData.departed_at || null,
    departed_reason: formData.departed_reason || null,
    user_id: null, // Will be set when user accepts invitation
  };
};

/**
 * Utility function to transform API data to form format
 */
export const transformTeamMemberAPIToForm = (apiData: TeamMemberWithAuthor): TeamMemberForm => {
  return {
    name: apiData.name || '',
    email: apiData.email || '',
    phone: apiData.phone || '',
    image_url: apiData.image_url || '',
    country: apiData.country || '',
    city: apiData.city || '',
    is_founder: apiData.is_founder || false,
    equity_percent: apiData.equity_percent,
    positions: apiData.positions || [],
    status: apiData.status || 'active',
    x_url: apiData.x_url || '',
    github_url: apiData.github_url || '',
    linkedin_url: apiData.linkedin_url || '',
    joined_at: apiData.joined_at || '',
    departed_at: apiData.departed_at || '',
    departed_reason: apiData.departed_reason || '',
  };
};
