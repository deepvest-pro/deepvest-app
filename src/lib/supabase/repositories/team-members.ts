import type { TeamMember } from '@/types/supabase';
import { BaseRepository } from '../base-repository';

/**
 * Extended team member type with author and user details
 */
export interface TeamMemberWithDetails extends TeamMember {
  author?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  user?: {
    id: string;
    email: string;
    user_profiles: {
      full_name: string;
      nickname: string;
      avatar_url: string;
    } | null;
  } | null;
}

/**
 * Repository for managing team members
 * Provides standardized database operations for team_members table
 */
export class TeamMembersRepository extends BaseRepository<TeamMember> {
  constructor() {
    super('team_members');
  }

  /**
   * Find a team member by ID with full user details
   */
  async findByIdWithDetails(
    id: string,
  ): Promise<{ data: TeamMemberWithDetails | null; error: string | null }> {
    const supabase = await this.getClient();
    return this.handleQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          author:author_id(id, full_name, email),
          user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
        `,
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single(),
    );
  }

  /**
   * Find team members for a project
   */
  async findByProjectId(
    projectId: string,
  ): Promise<{ data: TeamMemberWithDetails[] | null; error: string | null }> {
    const supabase = await this.getClient();
    return this.handleQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          author:author_id(id, full_name, email),
          user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
        `,
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    );
  }

  /**
   * Check if email is already used by another team member in the project
   */
  async isEmailAvailableInProject(projectId: string, email: string, excludeId?: string) {
    const supabase = await this.getClient();

    let query = supabase
      .from(this.tableName)
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { error } = await query.single();

    if (error) {
      // If no record found (PGRST116), email is available
      if (error.code === 'PGRST116') {
        return { data: true, error: null };
      }
      return { data: null, error: error.message };
    }

    // If record exists, email is not available
    return { data: false, error: null };
  }

  /**
   * Update team member with validation
   */
  async updateWithDetails(
    id: string,
    updates: Partial<TeamMember>,
  ): Promise<{ data: TeamMemberWithDetails | null; error: string | null }> {
    const supabase = await this.getClient();
    return this.handleQuery(
      supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null)
        .select(
          `
          *,
          author:author_id(id, full_name, email),
          user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
        `,
        )
        .single(),
    );
  }

  /**
   * Soft delete team member
   */
  async softDelete(id: string) {
    // Use service role client to bypass RLS for soft delete operations
    const supabase = await this.getServiceRoleClient();

    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) {
        console.error(`Failed to soft delete team member ${id}:`, error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Soft delete error for team member ${id}:`, errorMessage);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Find team member by project and member ID with validation
   */
  async findByProjectAndMemberId(
    projectId: string,
    memberId: string,
  ): Promise<{ data: TeamMemberWithDetails | null; error: string | null }> {
    const supabase = await this.getClient();
    return this.handleQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          author:author_id(id, full_name, email),
          user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
        `,
        )
        .eq('id', memberId)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .single(),
    );
  }
}

// Create and export singleton instance
export const teamMembersRepository = new TeamMembersRepository();
