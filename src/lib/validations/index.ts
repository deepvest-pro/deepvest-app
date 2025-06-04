/**
 * Central validation schemas for DeepVest project
 * All Zod schemas should be imported from this file for consistency
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';

// Import existing schemas
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  profileUpdateSchema,
  oauthProviderSchema,
  authCallbackSchema,
  emailConfirmSchema,
} from './auth';

import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectBodySchema,
  snapshotSchema,
  permissionSchema,
} from './project';

import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberFormSchema,
  bulkTeamMemberSchema,
  inviteTeamMemberSchema,
  teamMemberFilterSchema,
} from './team';

/**
 * Common field validators used across multiple schemas
 */
export const CommonValidators = {
  // Basic types
  email: z.string().email('Please enter a valid email'),
  url: z.string().url('Please enter a valid URL'),
  uuid: z.string().uuid('Invalid ID format'),

  // Text fields with length constraints
  shortText: (min = 1, max = 100) =>
    z
      .string()
      .min(min, `Must be at least ${min} characters`)
      .max(max, `Must be less than ${max} characters`),

  longText: (max = 1000) =>
    z.string().max(max, `Maximum length is ${max} characters`).optional().nullable(),

  // Slug validation
  slug: z
    .string()
    .min(
      APP_CONFIG.validation.project.slugMinLength,
      `Must be at least ${APP_CONFIG.validation.project.slugMinLength} characters`,
    )
    .max(
      APP_CONFIG.validation.project.slugMaxLength,
      `Must be less than ${APP_CONFIG.validation.project.slugMaxLength} characters`,
    )
    .regex(/^[a-z0-9-]+$/, 'Can only contain lowercase letters, numbers, and hyphens'),

  // Password validation
  password: z
    .string()
    .min(
      APP_CONFIG.validation.user.passwordMinLength,
      `Password must be at least ${APP_CONFIG.validation.user.passwordMinLength} characters`,
    ),

  // Username/nickname validation
  username: z
    .string()
    .min(3, 'Must be at least 3 characters')
    .max(30, 'Maximum length is 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores are allowed'),

  // File validation
  fileSize: (maxSize: number) =>
    z.number().max(maxSize, `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`),

  mimeType: (allowedTypes: string[]) =>
    z.string().refine(type => allowedTypes.includes(type), 'File type not allowed'),

  // Date validation
  dateString: z.string().datetime('Must be a valid datetime'),
  futureDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) > new Date(), 'Date must be in the future'),

  // Array validation
  nonEmptyArray: <T>(schema: z.ZodSchema<T>) =>
    z.array(schema).min(1, 'At least one item is required'),

  // Optional URL that can be empty string
  optionalUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
} as const;

/**
 * API request/response validation schemas
 */
export const APISchemas = {
  // Standard API response
  response: <T>(dataSchema: z.ZodSchema<T>) =>
    z.object({
      success: z.boolean(),
      data: dataSchema.optional(),
      error: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),

  // Pagination parameters
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z
      .number()
      .int()
      .min(1)
      .max(APP_CONFIG.pagination.maxLimit)
      .default(APP_CONFIG.pagination.defaultLimit),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Search parameters
  search: z.object({
    query: z.string().min(1).optional(),
    filters: z.record(z.unknown()).optional(),
  }),

  // File upload
  fileUpload: z.object({
    file: z.object({
      name: z.string(),
      size: CommonValidators.fileSize(APP_CONFIG.files.maxSizes.upload),
      type: CommonValidators.mimeType([
        ...APP_CONFIG.files.acceptedTypes.images,
        ...APP_CONFIG.files.acceptedTypes.documents,
      ]),
    }),
    metadata: z.record(z.unknown()).optional(),
  }),
} as const;

/**
 * Centralized validation schemas organized by domain
 */
export const ValidationSchemas = {
  // User/Auth schemas
  auth: {
    signIn: signInSchema,
    signUp: signUpSchema,
    resetPassword: resetPasswordSchema,
    updatePassword: updatePasswordSchema,
    profile: profileUpdateSchema,
    oauthProvider: oauthProviderSchema,
    authCallback: authCallbackSchema,
    emailConfirm: emailConfirmSchema,
  },

  // Project schemas
  project: {
    create: createProjectSchema,
    update: updateProjectSchema,
    updateBody: updateProjectBodySchema,
    snapshot: snapshotSchema,
    permission: permissionSchema,

    // Additional project-related schemas
    slug: z.object({
      slug: CommonValidators.slug,
    }),

    status: z.object({
      status: z.enum(['draft', 'published', 'archived']),
    }),
  },

  // Team schemas
  team: {
    create: createTeamMemberSchema,
    update: updateTeamMemberSchema,
    form: teamMemberFormSchema,
    bulk: bulkTeamMemberSchema,
    invite: inviteTeamMemberSchema,
    filter: teamMemberFilterSchema,
  },

  // Document schemas
  document: {
    create: z.object({
      title: CommonValidators.shortText(1, 200),
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
    }),

    update: z.object({
      title: CommonValidators.shortText(1, 200).optional(),
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
      file_urls: z.array(z.string().url()).optional(),
      is_public: z.boolean().optional(),
    }),
  },

  // Common field validators (re-exported for convenience)
  common: CommonValidators,

  // API schemas
  api: APISchemas,
} as const;

/**
 * Utility function to validate data with a schema and return structured result
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(err => err.message),
  };
}

/**
 * Utility function to create a validation middleware for API routes
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return result.data;
  };
}

/**
 * Type utilities for extracting types from schemas
 */
export type SchemaType<T extends z.ZodSchema> = z.infer<T>;

// Re-export all types for convenience
export type {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ProfileUpdateData,
} from './auth';

export type { CreateProjectForm, UpdateProjectForm, SnapshotForm, PermissionForm } from './project';

export type {
  CreateTeamMemberForm,
  UpdateTeamMemberForm,
  TeamMemberForm,
  BulkTeamMemberForm,
  InviteTeamMemberForm,
  TeamMemberFilter,
} from './team';

// Export individual schema modules for direct access if needed
export * as AuthSchemas from './auth';
export * as ProjectSchemas from './project';
export * as TeamSchemas from './team';
