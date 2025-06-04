import type { QueryClient } from '@tanstack/react-query';

/**
 * Standardized query keys for React Query
 * Used to ensure consistency and prevent cache conflicts
 */
export const QUERY_KEYS = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...QUERY_KEYS.auth.all, 'user'] as const,
    session: () => [...QUERY_KEYS.auth.all, 'session'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...QUERY_KEYS.projects.all, 'list'] as const,
    list: (filters?: string) => [...QUERY_KEYS.projects.lists(), filters] as const,
    details: () => [...QUERY_KEYS.projects.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.projects.details(), id] as const,
    permissions: (id: string) => [...QUERY_KEYS.projects.detail(id), 'permissions'] as const,
    snapshots: (id: string) => [...QUERY_KEYS.projects.detail(id), 'snapshots'] as const,
    snapshot: (projectId: string, snapshotId: string) =>
      [...QUERY_KEYS.projects.snapshots(projectId), snapshotId] as const,
    scoring: (id: string) => [...QUERY_KEYS.projects.detail(id), 'scoring'] as const,
    team: (id: string) => [...QUERY_KEYS.projects.detail(id), 'team'] as const,
    documents: (id: string) => [...QUERY_KEYS.projects.detail(id), 'documents'] as const,
    document: (projectId: string, docId: string) =>
      [...QUERY_KEYS.projects.documents(projectId), docId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...QUERY_KEYS.users.all, 'list'] as const,
    list: (filters?: string) => [...QUERY_KEYS.users.lists(), filters] as const,
    details: () => [...QUERY_KEYS.users.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.users.details(), id] as const,
    profile: () => [...QUERY_KEYS.users.all, 'profile'] as const,
  },

  // Team members
  team: {
    all: ['team'] as const,
    project: (projectId: string) => [...QUERY_KEYS.team.all, 'project', projectId] as const,
    member: (projectId: string, memberId: string) =>
      [...QUERY_KEYS.team.project(projectId), 'member', memberId] as const,
  },

  // Leaderboard
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (filters?: { minScore?: number }) =>
      [...QUERY_KEYS.leaderboard.all, 'list', filters] as const,
  },

  // AI Features
  ai: {
    all: ['ai'] as const,
    generation: () => [...QUERY_KEYS.ai.all, 'generation'] as const,
    transcription: () => [...QUERY_KEYS.ai.all, 'transcription'] as const,
  },
} as const;

/**
 * Utility type to get query key types
 */
export type QueryKeyType = typeof QUERY_KEYS;

/**
 * Helper functions for working with query keys
 */
export const queryKeyHelpers = {
  /**
   * Invalidate all project-related queries
   */
  invalidateProject: (queryClient: QueryClient, projectId: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.projects.detail(projectId),
    });
  },

  /**
   * Invalidate all user-related queries
   */
  invalidateUser: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.users.detail(userId),
    });
  },

  /**
   * Invalidate all auth-related queries
   */
  invalidateAuth: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.auth.all,
    });
  },

  /**
   * Prefetch project data
   */
  prefetchProject: <T>(queryClient: QueryClient, projectId: string, queryFn: () => Promise<T>) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.projects.detail(projectId),
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};
