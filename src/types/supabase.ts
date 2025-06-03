export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Utility types to avoid duplication
type Timestamp = string;
type UUID = string;

// Helper type for table definitions
type TableDefinition<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

// Define common table row fields
type CommonTableFields = {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
};

// User profile fields without common fields
type UserProfileFields = {
  full_name: string;
  nickname: string;
  avatar_url: string | null;
  cover_url: string | null;
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

// Define user profile row type (all fields required)
type UserProfileRow = CommonTableFields & UserProfileFields;

// Define user profile insert type (only id is required, others optional)
type UserProfileInsert = Pick<UserProfileRow, 'id'> &
  Partial<Omit<CommonTableFields, 'id'>> &
  Pick<UserProfileFields, 'full_name' | 'nickname'> &
  Partial<Omit<UserProfileFields, 'full_name' | 'nickname'>>;

// Define user profile update type (all fields optional)
type UserProfileUpdate = Partial<UserProfileRow>;

// Permission roles
type ProjectRole = 'viewer' | 'editor' | 'admin' | 'owner';

// Project permissions fields
type ProjectPermissionFields = {
  project_id: UUID;
  user_id: UUID;
  role: ProjectRole;
};

// Define project permissions row type
type ProjectPermissionRow = CommonTableFields & ProjectPermissionFields;

// Define project permissions insert type
type ProjectPermissionInsert = Partial<Omit<CommonTableFields, 'id'>> &
  ProjectPermissionFields & { id?: UUID };

// Define project permissions update type
type ProjectPermissionUpdate = Partial<ProjectPermissionRow>;

// Bucket row type
type BucketRow = {
  id: UUID;
  name: string;
  owner: UUID | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  public: boolean | null;
};

// Bucket insert type
type BucketInsert = Pick<BucketRow, 'id' | 'name'> & Partial<Omit<BucketRow, 'id' | 'name'>>;

// Bucket update type
type BucketUpdate = Partial<BucketRow>;

// Storage object row type
type StorageObjectRow = {
  id: UUID;
  bucket_id: UUID;
  name: string;
  owner: UUID | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  metadata: Json | null;
};

// Storage object insert type
type StorageObjectInsert = Pick<StorageObjectRow, 'bucket_id' | 'name'> &
  Partial<Omit<StorageObjectRow, 'bucket_id' | 'name'>>;

// Storage object update type
type StorageObjectUpdate = Partial<StorageObjectRow>;

// Auth user row type
type AuthUserRow = {
  id: UUID;
  instance_id: string | null;
  aud: string | null;
  role: string | null;
  email: string | null;
  encrypted_password: string | null;
  email_confirmed_at: Timestamp | null;
  invited_at: Timestamp | null;
  confirmation_token: string | null;
  confirmation_sent_at: Timestamp | null;
  recovery_token: string | null;
  recovery_sent_at: Timestamp | null;
  email_change_token_new: string | null;
  email_change: string | null;
  email_change_sent_at: Timestamp | null;
  last_sign_in_at: Timestamp | null;
  raw_app_meta_data: Json | null;
  raw_user_meta_data: Json | null;
  is_super_admin: boolean | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  phone: string | null;
  phone_confirmed_at: Timestamp | null;
  phone_change: string | null;
  phone_change_token: string | null;
  phone_change_sent_at: Timestamp | null;
  confirmed_at: Timestamp | null;
  email_change_token_current: string | null;
  email_change_confirm_status: number | null;
  banned_until: Timestamp | null;
  reauthentication_token: string | null;
  reauthentication_sent_at: Timestamp | null;
  is_sso_user: boolean | null;
  deleted_at: Timestamp | null;
};

// Auth user insert and update types
type AuthUserInsert = Pick<AuthUserRow, 'id'> & Partial<Omit<AuthUserRow, 'id'>>;
type AuthUserUpdate = Partial<AuthUserRow>;

// Auth identity row type
type AuthIdentityRow = {
  id: UUID;
  user_id: UUID;
  identity_data: Json;
  provider: string;
  last_sign_in_at: Timestamp | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

// Auth identity insert and update types
type AuthIdentityInsert = Pick<AuthIdentityRow, 'id' | 'user_id' | 'identity_data' | 'provider'> &
  Partial<Omit<AuthIdentityRow, 'id' | 'user_id' | 'identity_data' | 'provider'>>;
type AuthIdentityUpdate = Partial<AuthIdentityRow>;

// Database interface using the reusable types
export interface Database {
  public: {
    Tables: {
      // User Profiles
      user_profiles: TableDefinition<UserProfileRow, UserProfileInsert, UserProfileUpdate>;

      // Project Permissions
      project_permissions: TableDefinition<
        ProjectPermissionRow,
        ProjectPermissionInsert,
        ProjectPermissionUpdate
      >;
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
      buckets: TableDefinition<BucketRow, BucketInsert, BucketUpdate>;
      objects: TableDefinition<StorageObjectRow, StorageObjectInsert, StorageObjectUpdate>;
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
      users: TableDefinition<AuthUserRow, AuthUserInsert, AuthUserUpdate>;
      identities: TableDefinition<AuthIdentityRow, AuthIdentityInsert, AuthIdentityUpdate>;
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
