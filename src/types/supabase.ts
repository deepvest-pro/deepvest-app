export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Utility types to avoid duplication
type Timestamp = string;
export type UUID = string;

// Helper type for table definitions
type TableDefinition<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

// Define common table fields
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

export type ExpandedUser = {
  id: UUID;
  email?: string;
  user_profiles: UserProfileRow | null;
};

// Define user profile insert type (only id is required, others optional)
type UserProfileInsert = Pick<UserProfileRow, 'id'> &
  Partial<Omit<CommonTableFields, 'id'>> &
  Pick<UserProfileFields, 'full_name' | 'nickname'> &
  Partial<Omit<UserProfileFields, 'full_name' | 'nickname'>>;

// Define user profile update type (all fields optional)
type UserProfileUpdate = Partial<UserProfileRow>;

// Project status enum
export type ProjectStatus =
  | 'idea'
  | 'concept'
  | 'prototype'
  | 'mvp'
  | 'beta'
  | 'launched'
  | 'growing'
  | 'scaling'
  | 'established'
  | 'acquired'
  | 'closed';

// Permission roles
export type ProjectRole = 'viewer' | 'editor' | 'admin' | 'owner';

export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

// Project fields without common fields
type ProjectFields = {
  slug: string;
  public_snapshot_id: UUID | null;
  new_snapshot_id: UUID | null;
  is_public: boolean;
  is_demo: boolean;
  is_archived: boolean;
};

// Define project row type
type ProjectRow = CommonTableFields & ProjectFields;

// Define project insert type
type ProjectInsert = Partial<Omit<CommonTableFields, 'id'>> &
  Pick<ProjectFields, 'slug'> &
  Partial<Omit<ProjectFields, 'slug'>>;

// Define project update type
type ProjectUpdate = Partial<ProjectRow>;

// Snapshot fields without common fields
type SnapshotFields = {
  project_id: UUID;
  version: number;
  name: string;
  slogan: string | null;
  description: string;
  status: ProjectStatus;
  country: string | null;
  city: string | null;
  repository_urls: string[] | null;
  website_urls: string[] | null;
  logo_url: string | null;
  banner_url: string | null;
  video_urls: string[] | null;
  contents: UUID[] | null;
  team_members: UUID[] | null;
  author_id: UUID | ExpandedUser;
  is_locked: boolean;
};

// Define snapshot row type
type SnapshotRow = CommonTableFields & SnapshotFields;

// Define snapshot insert type
type SnapshotInsert = Partial<Omit<CommonTableFields, 'id'>> &
  Pick<SnapshotFields, 'project_id' | 'version' | 'name' | 'description' | 'status' | 'author_id'> &
  Partial<
    Omit<SnapshotFields, 'project_id' | 'version' | 'name' | 'description' | 'status' | 'author_id'>
  >;

// Define snapshot update type
type SnapshotUpdate = Partial<SnapshotRow>;

// Project permissions fields
type ProjectPermissionFields = {
  project_id: UUID;
  user_id: UUID;
  user_details?: ExpandedUser | null;
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

// Project content type enum
export type ContentType =
  | 'presentation'
  | 'research'
  | 'pitch_deck'
  | 'whitepaper'
  | 'video'
  | 'audio'
  | 'image'
  | 'report'
  | 'document'
  | 'spreadsheet'
  | 'table'
  | 'chart'
  | 'infographic'
  | 'case_study'
  | 'other';

// Team member status enum
export type TeamMemberStatus = 'ghost' | 'invited' | 'active' | 'inactive';

// Project content fields without common fields
type ProjectContentFields = {
  project_id: UUID;
  slug: string;
  title: string;
  content_type: ContentType;
  content: string;
  description: string | null;
  file_urls: string[];
  author_id: UUID;
  is_public: boolean;
  deleted_at: string | null;
};

// Define project content row type
export type ProjectContentRow = CommonTableFields & ProjectContentFields;

// Export project content type for backward compatibility
export type ProjectContent = ProjectContentRow;

// Project content with author information
export type ProjectContentWithAuthor = ProjectContent & {
  author?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

// Team member fields without common fields
type TeamMemberFields = {
  project_id: UUID;
  user_id: UUID | null;
  joined_at: Timestamp | null;
  departed_at: Timestamp | null;
  departed_reason: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  country: string | null;
  city: string | null;
  is_founder: boolean;
  equity_percent: number | null;
  positions: string[];
  status: TeamMemberStatus;
  x_url: string | null;
  is_x_verified: boolean;
  github_url: string | null;
  is_github_verified: boolean;
  linkedin_url: string | null;
  is_linkedin_verified: boolean;
  pii_hash: string | null;
  author_id: UUID;
  deleted_at: Timestamp | null;
};

// Define team member row type
export type TeamMemberRow = CommonTableFields & TeamMemberFields;

// Export team member type for backward compatibility
export type TeamMember = TeamMemberRow;

// Define team member insert type
type TeamMemberInsert = Partial<Omit<CommonTableFields, 'id'>> &
  Pick<TeamMemberFields, 'project_id' | 'name' | 'author_id'> &
  Partial<Omit<TeamMemberFields, 'project_id' | 'name' | 'author_id'>>;

// Define team member update type
type TeamMemberUpdate = Partial<TeamMemberRow>;

// Team member with author information
export type TeamMemberWithAuthor = TeamMember & {
  author?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

// Team member with linked user profile
export type TeamMemberWithUser = TeamMember & {
  user?: UserProfile | null;
};

// Database interface using the reusable types
export interface Database {
  public: {
    Tables: {
      // User Profiles
      user_profiles: TableDefinition<UserProfileRow, UserProfileInsert, UserProfileUpdate>;

      // Projects
      projects: TableDefinition<ProjectRow, ProjectInsert, ProjectUpdate>;

      // Snapshots
      snapshots: TableDefinition<SnapshotRow, SnapshotInsert, SnapshotUpdate>;

      // Project Permissions
      project_permissions: TableDefinition<
        ProjectPermissionRow,
        ProjectPermissionInsert,
        ProjectPermissionUpdate
      >;

      // Team Members
      team_members: TableDefinition<TeamMemberRow, TeamMemberInsert, TeamMemberUpdate>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_project: {
        Args: {
          p_name: string;
          p_slug: string;
          p_description: string;
          p_status: ProjectStatus;
        };
        Returns: UUID;
      };
      is_nickname_available: {
        Args: {
          nickname: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      project_status_enum: ProjectStatus;
      project_role_enum: ProjectRole;
      team_member_status_enum: TeamMemberStatus;
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

// Export specific table row types for easier use in components
export type Project = Database['public']['Tables']['projects']['Row'];
export type Snapshot = Database['public']['Tables']['snapshots']['Row'];
export type ProjectPermission = Database['public']['Tables']['project_permissions']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Project with related data
export type ProjectWithSnapshot = Project & {
  public_snapshot?: Snapshot | null;
  new_snapshot?: Snapshot | null;
  permissions?: ProjectPermission[];
};

// Type for a snapshot that definitely has an expanded author (if author exists)
// This replaces the older SnapshotWithAuthor which might be too simple
export type SnapshotWithExpandedAuthor = Omit<Snapshot, 'author_id'> & {
  author_id: ExpandedUser | null; // Author is expanded or null if no author_id was set
};

// Older SnapshotWithAuthor - can be deprecated or updated if still used elsewhere
// For now, let's keep it but be aware of SnapshotWithExpandedAuthor as the more precise type
export type SnapshotWithAuthor = Snapshot & {
  author?: UserProfile | null;
};
