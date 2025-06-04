/**
 * Central constants and configuration for DeepVest project
 * All application-wide constants should be defined here
 */

export const APP_CONFIG = {
  name: 'DeepVest',
  description: 'A modern investment platform for project funding',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  files: {
    maxSizes: {
      avatar: 2 * 1024 * 1024, // 2MB
      cover: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      upload: 50 * 1024 * 1024, // 50MB for general uploads
    },

    acceptedTypes: {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'],
    },
  },

  timeouts: {
    api: 30000, // 30 seconds
    upload: 120000, // 2 minutes
    transcription: 300000, // 5 minutes
  },

  validation: {
    project: {
      nameMinLength: 3,
      nameMaxLength: 100,
      descriptionMaxLength: 500,
      slugMinLength: 3,
      slugMaxLength: 63,
    },
    user: {
      nameMinLength: 2,
      nameMaxLength: 100,
      bioMaxLength: 500,
      passwordMinLength: 6,
    },
    team: {
      positionMaxLength: 100,
      cityMaxLength: 100,
    },
  },

  ui: {
    toastDuration: 5000, // 5 seconds
    debounceDelay: 300, // 300ms
    animationDuration: 200, // 200ms
  },
} as const;

/**
 * Regular expression patterns for validation
 */
export const REGEX_PATTERNS = {
  // Project slug: lowercase letters, numbers, hyphens only
  projectSlug: /^[a-z0-9-]+$/,

  // Document slug: lowercase letters, numbers, hyphens, underscores
  documentSlug: /^[a-z0-9-_]+$/,

  // Username: letters, numbers, hyphens, underscores
  username: /^[a-zA-Z0-9_-]+$/,

  // UUID format
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Phone number: international format
  phone: /^[\+]?[1-9][\d]{0,15}$/,

  // Email (basic validation, more complex validation should use libraries)
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * HTTP status codes used throughout the application
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Project-related constants
 */
export const PROJECT_CONSTANTS = {
  statuses: ['draft', 'published', 'archived'] as const,
  roles: ['viewer', 'editor', 'admin', 'owner'] as const,
  maxTeamMembers: 50,
  maxDocuments: 100,
  maxMilestones: 20,
} as const;

/**
 * User-related constants
 */
export const USER_CONSTANTS = {
  roles: ['user', 'admin', 'moderator'] as const,
  maxProjects: 100,
} as const;

/**
 * API-related constants
 */
export const API_CONSTANTS = {
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Re-export specific configurations
export * from './routes';
export * from './config';
