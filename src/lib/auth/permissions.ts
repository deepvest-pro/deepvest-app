import { User } from '@supabase/auth-js';
import { UserProfile } from '@/types/auth';

export type UserRole = 'admin' | 'editor' | 'user';

export type Permission =
  // Project permissions
  | 'view:projects'
  | 'create:projects'
  | 'edit:projects'
  | 'delete:projects'
  // Comment permissions
  | 'create:comments'
  | 'edit:own_comments'
  | 'edit:any_comments'
  | 'delete:own_comments'
  | 'delete:any_comments'
  // User management
  | 'view:users'
  | 'edit:users';

// Define permissions by role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view:projects',
    'create:projects',
    'edit:projects',
    'delete:projects',
    'create:comments',
    'edit:own_comments',
    'edit:any_comments',
    'delete:own_comments',
    'delete:any_comments',
    'view:users',
    'edit:users',
  ],
  editor: [
    'view:projects',
    'create:projects',
    'edit:projects',
    'create:comments',
    'edit:own_comments',
    'delete:own_comments',
  ],
  user: ['view:projects', 'create:comments', 'edit:own_comments', 'delete:own_comments'],
};

/**
 * Determines if a user has a specific permission
 */
export function hasPermission(
  user: User | null,
  profile: UserProfile | null,
  permission: Permission,
): boolean {
  if (!user) {
    return false;
  }

  // Get user role, defaulting to 'user' if none is specified
  const role: UserRole = (profile?.role as UserRole) || 'user';

  // Check if the user role has the specified permission
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null, profile: UserProfile | null): Permission[] {
  if (!user) {
    return [];
  }

  const role: UserRole = (profile?.role as UserRole) || 'user';
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Determines if a user owns a resource
 */
export function isResourceOwner(
  user: User | null,
  resourceUserId: string | null | undefined,
): boolean {
  if (!user || !resourceUserId) {
    return false;
  }

  return user.id === resourceUserId;
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdminRoutes(user: User | null, profile: UserProfile | null): boolean {
  return hasPermission(user, profile, 'view:users');
}

/**
 * Check if user can edit a specific resource
 */
export function canEditResource(
  user: User | null,
  profile: UserProfile | null,
  resourceUserId: string | null | undefined,
  resourceType: 'project' | 'comment',
): boolean {
  if (!user) {
    return false;
  }

  // Resource owners can always edit their own resources
  if (isResourceOwner(user, resourceUserId)) {
    return true;
  }

  // If it's not their own resource, check for appropriate permission
  if (resourceType === 'project') {
    return hasPermission(user, profile, 'edit:projects');
  } else if (resourceType === 'comment') {
    return hasPermission(user, profile, 'edit:any_comments');
  }

  return false;
}
