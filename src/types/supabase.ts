export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // User Profiles
      user_profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string;
          nickname: string;
          avatar_url: string | null;
          bio: string | null;
          professional_background: string | null;
          startup_ecosystem_role: string | null;
          country: string | null;
          city: string | null;
          website_url: string | null;
          x_username: string | null;
          linkedin_username: string | null;
          github_username: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          full_name: string;
          nickname: string;
          avatar_url?: string | null;
          bio?: string | null;
          professional_background?: string | null;
          startup_ecosystem_role?: string | null;
          country?: string | null;
          city?: string | null;
          website_url?: string | null;
          x_username?: string | null;
          linkedin_username?: string | null;
          github_username?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string;
          nickname?: string;
          avatar_url?: string | null;
          bio?: string | null;
          professional_background?: string | null;
          startup_ecosystem_role?: string | null;
          country?: string | null;
          city?: string | null;
          website_url?: string | null;
          x_username?: string | null;
          linkedin_username?: string | null;
          github_username?: string | null;
        };
      };

      // Project Permissions
      project_permissions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          project_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'admin' | 'owner';
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          project_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'admin' | 'owner';
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          project_id?: string;
          user_id?: string;
          role?: 'viewer' | 'editor' | 'admin' | 'owner';
        };
      };

      // Add other tables as needed based on project requirements
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          public: boolean | null;
        };
        Insert: {
          id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
        };
      };
      objects: {
        Row: {
          id: string;
          bucket_id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          bucket_id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          metadata?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
  auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          instance_id: string | null;
          aud: string | null;
          role: string | null;
          email: string | null;
          encrypted_password: string | null;
          email_confirmed_at: string | null;
          invited_at: string | null;
          confirmation_token: string | null;
          confirmation_sent_at: string | null;
          recovery_token: string | null;
          recovery_sent_at: string | null;
          email_change_token_new: string | null;
          email_change: string | null;
          email_change_sent_at: string | null;
          last_sign_in_at: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
          is_super_admin: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          phone: string | null;
          phone_confirmed_at: string | null;
          phone_change: string | null;
          phone_change_token: string | null;
          phone_change_sent_at: string | null;
          confirmed_at: string | null;
          email_change_token_current: string | null;
          email_change_confirm_status: number | null;
          banned_until: string | null;
          reauthentication_token: string | null;
          reauthentication_sent_at: string | null;
          is_sso_user: boolean | null;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          instance_id?: string | null;
          aud?: string | null;
          role?: string | null;
          email?: string | null;
          encrypted_password?: string | null;
          email_confirmed_at?: string | null;
          invited_at?: string | null;
          confirmation_token?: string | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          is_super_admin?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          confirmed_at?: string | null;
          email_change_token_current?: string | null;
          email_change_confirm_status?: number | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          is_sso_user?: boolean | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          instance_id?: string | null;
          aud?: string | null;
          role?: string | null;
          email?: string | null;
          encrypted_password?: string | null;
          email_confirmed_at?: string | null;
          invited_at?: string | null;
          confirmation_token?: string | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          is_super_admin?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          confirmed_at?: string | null;
          email_change_token_current?: string | null;
          email_change_confirm_status?: number | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          is_sso_user?: boolean | null;
          deleted_at?: string | null;
        };
      };
      identities: {
        Row: {
          id: string;
          user_id: string;
          identity_data: Json;
          provider: string;
          last_sign_in_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          identity_data: Json;
          provider: string;
          last_sign_in_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          identity_data?: Json;
          provider?: string;
          last_sign_in_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Session and User types based on Supabase Auth
export type UserWithProfile = {
  id: string;
  email: string | null;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: Record<string, unknown>;
  profile?: Database['public']['Tables']['user_profiles']['Row'];
  auth_providers?: Array<{ provider: string; created_at: string }>;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: UserWithProfile;
};

// Types for response data from auth APIs
export type AuthResponse = {
  data: {
    session: Session | null;
    user: UserWithProfile | null;
  } | null;
  error: {
    message: string;
  } | null;
};
