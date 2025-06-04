/**
 * Application routes constants
 * Centralized route definitions for consistent navigation
 */

/**
 * Public page routes
 */
export const ROUTES = {
  home: '/',

  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    resetPassword: '/auth/reset-password',
    callback: '/auth/callback',
    confirm: '/auth/confirm',
    error: '/auth/error',
  },

  projects: {
    list: '/projects',
    new: '/projects/new',
    detail: (id: string) => `/projects/${id}`,
    edit: (id: string) => `/projects/${id}/edit`,
  },

  profile: {
    view: (id: string) => `/profile/${id}`,
    edit: '/profile/edit',
  },

  leaderboard: '/leaderboard',
  crowdfunding: '/crowdfunding',
} as const;

/**
 * API routes for client-side requests
 */
export const API_ROUTES = {
  // Authentication
  auth: '/api/auth',

  // Projects
  projects: {
    base: '/api/projects',
    list: '/api/projects',
    create: '/api/projects',
    detail: (id: string) => `/api/projects/${id}`,
    update: (id: string) => `/api/projects/${id}`,
    delete: (id: string) => `/api/projects/${id}`,
    checkSlug: '/api/projects/check-slug',

    // Project documents
    documents: (projectId: string) => `/api/projects/${projectId}/documents`,
    document: (projectId: string, docId: string) => `/api/projects/${projectId}/documents/${docId}`,

    // Project team
    teamMembers: (projectId: string) => `/api/projects/${projectId}/team-members`,
    teamMember: (projectId: string, memberId: string) =>
      `/api/projects/${projectId}/team-members/${memberId}`,
    teamMembersBulk: (projectId: string) => `/api/projects/${projectId}/team-members/bulk`,

    // Project permissions
    permissions: (projectId: string) => `/api/projects/${projectId}/permissions`,
    userPermissions: (projectId: string) => `/api/projects/${projectId}/permissions/user`,

    // Project snapshots
    snapshots: (projectId: string) => `/api/projects/${projectId}/snapshots`,
    snapshot: (projectId: string, snapshotId: string) =>
      `/api/projects/${projectId}/snapshots/${snapshotId}`,
    publishSnapshot: (projectId: string, snapshotId: string) =>
      `/api/projects/${projectId}/snapshots/${snapshotId}/publish`,
    syncSnapshot: (projectId: string) => `/api/projects/${projectId}/sync-snapshot`,
    publishDraft: (projectId: string) => `/api/projects/${projectId}/publish-draft`,

    // Project scoring
    scoring: (projectId: string) => `/api/projects/${projectId}/scoring`,

    // Project uploads
    upload: (projectId: string) => `/api/projects/${projectId}/upload`,

    // Project debug
    debug: (projectId: string) => `/api/projects/${projectId}/debug`,
  },

  // Users
  users: {
    base: '/api/users',
    detail: (id: string) => `/api/users/${id}`,
  },

  // Profile
  profile: {
    imageUpload: '/api/profile/image-upload',
  },

  // AI services
  ai: {
    generateContent: '/api/ai/generate-content',
  },

  // Media services
  transcribe: '/api/transcribe',

  // Leaderboard
  leaderboard: '/api/leaderboard',
} as const;

/**
 * External URLs and social media patterns
 */
export const EXTERNAL_URLS = {
  social: {
    twitter: (username: string) => `https://twitter.com/${username}`,
    linkedin: (username: string) => `https://linkedin.com/in/${username}`,
    github: (username: string) => `https://github.com/${username}`,
  },

  documentation: {
    api: '/docs/api',
    userGuide: '/docs/user-guide',
    developerGuide: '/docs/developer-guide',
  },
} as const;

/**
 * Route validation patterns
 */
export const ROUTE_PATTERNS = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9-]+$/,
  username: /^[a-zA-Z0-9_-]+$/,
} as const;

/**
 * Navigation menu structure
 */
export const NAVIGATION = {
  main: [
    { label: 'Home', href: ROUTES.home },
    { label: 'Projects', href: ROUTES.projects.list },
    { label: 'Leaderboard', href: ROUTES.leaderboard },
    { label: 'Crowdfunding', href: ROUTES.crowdfunding },
  ],

  auth: [
    { label: 'Sign In', href: ROUTES.auth.signIn },
    { label: 'Sign Up', href: ROUTES.auth.signUp },
  ],

  user: [
    { label: 'Profile', href: ROUTES.profile.edit },
    { label: 'My Projects', href: ROUTES.projects.list },
  ],
} as const;
