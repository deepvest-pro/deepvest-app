'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Permission, hasPermission } from '@/lib/auth/permissions';
import { UnauthorizedAccess } from './unauthorized-access';

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
  customMessage?: string;
}

export function PermissionGuard({
  children,
  permission,
  fallback,
  customMessage,
}: PermissionGuardProps) {
  const { user, profile } = useAuth();

  const hasAccess = hasPermission(user, profile, permission);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <UnauthorizedAccess
        message={customMessage || `You need the ${permission} permission to access this resource.`}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of PermissionGuard
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  options?: {
    fallback?: ReactNode;
    customMessage?: string;
  },
) {
  return function PermissionProtectedComponent(props: P) {
    return (
      <PermissionGuard
        permission={permission}
        fallback={options?.fallback}
        customMessage={options?.customMessage}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Guard that checks if the user owns the resource or has the specified permission
 */
export function ResourceOwnerGuard({
  children,
  resourceUserId,
  permission,
  fallback,
  customMessage,
}: {
  children: ReactNode;
  resourceUserId: string | null | undefined;
  permission: Permission;
  fallback?: ReactNode;
  customMessage?: string;
}) {
  const { user, profile } = useAuth();

  const isOwner = user && resourceUserId && user.id === resourceUserId;

  const hasRequiredPermission = hasPermission(user, profile, permission);

  if (!isOwner && !hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <UnauthorizedAccess
        message={
          customMessage ||
          'You need to be the owner or have the appropriate permissions to access this resource.'
        }
      />
    );
  }

  return <>{children}</>;
}
