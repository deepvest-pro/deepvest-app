/**
 * Team Member API client functions
 */

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

  const url = `/api/projects/${projectId}/team-members${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch team members');
  }

  const result = await response.json();
  return result.team_members;
};

/**
 * Fetches a specific team member by ID
 */
export const getTeamMember = async (
  projectId: string,
  memberId: string,
): Promise<TeamMemberWithAuthor> => {
  const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch team member');
  }

  const result = await response.json();
  return result.team_member;
};

/**
 * Creates a new team member
 */
export const createTeamMember = async (
  projectId: string,
  teamMemberData: Omit<CreateTeamMemberForm, 'project_id' | 'author_id'>,
): Promise<TeamMemberWithAuthor> => {
  const response = await fetch(`/api/projects/${projectId}/team-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teamMemberData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create team member');
  }

  const result = await response.json();
  return result.team_member;
};

/**
 * Updates an existing team member
 */
export const updateTeamMember = async (
  projectId: string,
  memberId: string,
  updateData: Omit<UpdateTeamMemberForm, 'id'>,
): Promise<TeamMemberWithAuthor> => {
  const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update team member');
  }

  const result = await response.json();
  return result.team_member;
};

/**
 * Soft deletes a team member
 */
export const deleteTeamMember = async (projectId: string, memberId: string): Promise<void> => {
  const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete team member');
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
  const response = await fetch(`/api/projects/${projectId}/team-members/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bulkData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to perform bulk operation');
  }

  return response.json();
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
