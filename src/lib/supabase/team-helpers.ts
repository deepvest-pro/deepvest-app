import type { User } from '@supabase/supabase-js';
import { SupabaseClientFactory } from './client-factory';
import { ValidationSchemas } from '@/lib/validations';

/**
 * Helper function to create CEO team member for project creator
 * @param projectId - The ID of the project
 * @param user - The authenticated user who will become CEO
 * @returns The created team member data or null if creation fails
 */
export async function createCEOTeamMember(projectId: string, user: User) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    // Get user's full name and email from user metadata or auth
    const userName =
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'Project Creator';
    const userEmail = user.email;

    const ceoData = {
      project_id: projectId,
      author_id: user.id,
      name: userName,
      email: userEmail,
      is_founder: true,
      positions: ['CEO'],
      status: 'active' as const,
      phone: null,
      image_url: null,
      country: null,
      city: null,
      equity_percent: null,
      x_url: null,
      github_url: null,
      linkedin_url: null,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      departed_at: null,
      departed_reason: null,
    };

    // Validate the data
    const validatedData = ValidationSchemas.team.create.parse(ceoData);

    // Create the CEO team member
    const { data, error } = await supabase
      .from('team_members')
      .insert(validatedData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating CEO team member:', error);
      // Don't fail the project creation if CEO creation fails
      return null;
    }

    console.log('CEO team member created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createCEOTeamMember:', error);
    // Don't fail the project creation if CEO creation fails
    return null;
  }
}
