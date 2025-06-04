/**
 * Team Member API client functions
 */

import { APIClient } from '@/lib/utils/api';
import type { TeamMemberWithAuthor } from '@/types/supabase';
import type {
  CreateTeamMemberForm,
  UpdateTeamMemberForm,
  TeamMemberFilter,
  BulkTeamMemberForm,
} from '@/lib/validations/team';

/**
 * Fetches all team members for a project with optional filtering
 */
export const getTeamMembers = async (
  projectId: string,
  filters?: TeamMemberFilter,
): Promise<TeamMemberWithAuthor[]> => {
  const searchParams = new URLSearchParams();

  if (filters?.status) {
    searchParams.append('status', filters.status);
  }

  if (filters?.is_founder !== undefined) {
    searchParams.append('is_founder', filters.is_founder.toString());
  }

  if (filters?.positions && filters.positions.length > 0) {
    searchParams.append('positions', filters.positions.join(','));
  }

  if (filters?.search) {
    searchParams.append('search', filters.search);
  }

  const url = `/projects/${projectId}/team-members${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await APIClient.get<{ team_members: TeamMemberWithAuthor[] }>(url);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch team members');
  }

  return response.data.team_members;
};

/**
 * Fetches a specific team member by ID
 */
export const getTeamMember = async (
  projectId: string,
  memberId: string,
): Promise<TeamMemberWithAuthor> => {
  const response = await APIClient.get<{ team_member: TeamMemberWithAuthor }>(
    `/projects/${projectId}/team-members/${memberId}`,
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch team member');
  }

  return response.data.team_member;
};

/**
 * Creates a new team member
 */
export const createTeamMember = async (
  projectId: string,
  teamMemberData: Omit<CreateTeamMemberForm, 'project_id' | 'author_id'>,
): Promise<TeamMemberWithAuthor> => {
  const response = await APIClient.post<{ team_member: TeamMemberWithAuthor }>(
    `/projects/${projectId}/team-members`,
    teamMemberData,
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create team member');
  }

  return response.data.team_member;
};

/**
 * Updates an existing team member
 */
export const updateTeamMember = async (
  projectId: string,
  memberId: string,
  updateData: Omit<UpdateTeamMemberForm, 'id'>,
): Promise<TeamMemberWithAuthor> => {
  const response = await APIClient.put<{ team_member: TeamMemberWithAuthor }>(
    `/projects/${projectId}/team-members/${memberId}`,
    updateData,
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update team member');
  }

  return response.data.team_member;
};

/**
 * Soft deletes a team member
 */
export const deleteTeamMember = async (projectId: string, memberId: string): Promise<void> => {
  const response = await APIClient.delete(`/projects/${projectId}/team-members/${memberId}`);

  if (!response.success) {
    throw new Error(response.error || 'Failed to delete team member');
  }
};

/**
 * Performs bulk operations on team members
 */
export const bulkUpdateTeamMembers = async (
  projectId: string,
  bulkData: BulkTeamMemberForm,
): Promise<{
  success: boolean;
  action: string;
  affected_count: number;
  team_members: TeamMemberWithAuthor[];
}> => {
  const response = await APIClient.post<{
    success: boolean;
    action: string;
    affected_count: number;
    team_members: TeamMemberWithAuthor[];
  }>(`/projects/${projectId}/team-members/bulk`, bulkData);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to perform bulk operation');
  }

  return response.data;
};

/**
 * Invites a new team member via email
 */
export const inviteTeamMember = async (
  projectId: string,
  inviteData: {
    email: string;
    name: string;
    positions: string[];
    message?: string;
  },
): Promise<TeamMemberWithAuthor> => {
  const teamMemberData = {
    name: inviteData.name,
    email: inviteData.email,
    positions: inviteData.positions,
    status: 'invited' as const,
    is_founder: false,
  };

  return createTeamMember(projectId, teamMemberData);
};

/**
 * Utility function to get team member statistics
 */
export const getTeamMemberStats = async (
  projectId: string,
): Promise<{
  total: number;
  active: number;
  invited: number;
  founders: number;
}> => {
  const teamMembers = await getTeamMembers(projectId);

  return {
    total: teamMembers.length,
    active: teamMembers.filter(member => member.status === 'active').length,
    invited: teamMembers.filter(member => member.status === 'invited').length,
    founders: teamMembers.filter(member => member.is_founder).length,
  };
};
