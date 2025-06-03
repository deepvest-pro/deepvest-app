import type { User as SupabaseUser } from '@supabase/auth-js';
import type { UserRole } from '@/lib/auth/permissions';

export interface UserProfile {
  id: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string | null;
  role?: UserRole;
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserData {
  user: SupabaseUser;
  profile: UserProfile | null;
}
