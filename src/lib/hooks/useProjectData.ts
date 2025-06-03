/**
 * Custom hook for project data management
 */

import { useMemo } from 'react';
import { ProjectWithSnapshot } from '@/types/supabase';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils/format';

export interface ProjectDisplayData {
  // Basic info
  name: string;
  description: string;
  slogan?: string;
  status: string;

  // Location
  country?: string;
  city?: string;
  location?: string;

  // URLs
  websiteUrls: string[];
  repositoryUrls: string[];

  // Images
  logoUrl?: string;
  bannerUrl?: string;

  // Formatted data
  formattedStatus: string;
  statusColor: string;
  formattedCreatedAt?: string;
  formattedUpdatedAt?: string;

  // Flags
  isPublic: boolean;
  hasDraftToPublish: boolean;
  isEditingDraft: boolean;
}

/**
 * Hook to extract and format project display data
 */
export const useProjectData = (project: ProjectWithSnapshot): ProjectDisplayData => {
  return useMemo(() => {
    // Get current snapshot data
    const currentSnapshot = project.new_snapshot || project.public_snapshot;

    // Basic info
    const name = currentSnapshot?.name || 'Unnamed Project';
    const description = currentSnapshot?.description || 'No description provided.';
    const slogan = currentSnapshot?.slogan || undefined;
    const status = currentSnapshot?.status || 'idea';

    // Location
    const country = currentSnapshot?.country || undefined;
    const city = currentSnapshot?.city || undefined;
    const location = country && city ? `${city}, ${country}` : country || city || undefined;

    // URLs
    const websiteUrls = currentSnapshot?.website_urls || [];
    const repositoryUrls = currentSnapshot?.repository_urls || [];

    // Images
    const logoUrl = currentSnapshot?.logo_url || undefined;
    const bannerUrl = currentSnapshot?.banner_url || undefined;

    // Formatted data
    const formattedStatus = formatStatus(status);
    const statusColor = getStatusColor(status);
    const formattedCreatedAt = project.created_at ? formatDate(project.created_at) : undefined;
    const formattedUpdatedAt = project.updated_at ? formatDate(project.updated_at) : undefined;

    // Flags
    const isPublic = project.is_public;
    const hasDraftToPublish = !!(
      project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id
    );
    const isEditingDraft = hasDraftToPublish;

    return {
      name,
      description,
      slogan,
      status,
      country,
      city,
      location,
      websiteUrls,
      repositoryUrls,
      logoUrl,
      bannerUrl,
      formattedStatus,
      statusColor,
      formattedCreatedAt,
      formattedUpdatedAt,
      isPublic,
      hasDraftToPublish,
      isEditingDraft,
    };
  }, [project]);
};

/**
 * Hook to get project permissions info
 */
export const useProjectPermissions = (project: ProjectWithSnapshot, userId?: string) => {
  return useMemo(() => {
    if (!userId || !project.permissions) {
      return {
        userRole: null,
        canEdit: false,
        canAdmin: false,
        isOwner: false,
      };
    }

    const userPermission = project.permissions.find(permission => permission.user_id === userId);

    const userRole = userPermission?.role || null;
    const canEdit = ['editor', 'admin', 'owner'].includes(userRole || '');
    const canAdmin = ['admin', 'owner'].includes(userRole || '');
    const isOwner = userRole === 'owner';

    return {
      userRole,
      canEdit,
      canAdmin,
      isOwner,
    };
  }, [project.permissions, userId]);
};
