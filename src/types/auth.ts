import type { User as SupabaseUser } from '@supabase/auth-js';
import type { UserRole } from '@/lib/auth/permissions';

export interface Profile {
  id: string;
  full_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  role?: UserRole;
  bio?: string | null;
  professional_background?: string | null;
  city?: string | null;
  country?: string | null;
  startup_ecosystem_role?: string | null;
  website_url?: string | null;
  x_username?: string | null;
  linkedin_username?: string | null;
  github_username?: string | null;
}

export interface UserData {
  user: SupabaseUser;
  profile: Profile | null;
}
