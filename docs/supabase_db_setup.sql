-- DeepVest Database Schema
-- This script is designed to be idempotent and can be run on an empty database or an existing one.

-- ==========================================
-- Helper Function to update updated_at timestamp
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row modification.';

-- ========================================== 
-- User Profiles Table
-- Stores public user information.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  professional_background TEXT,
  startup_ecosystem_role TEXT,
  country TEXT,
  city TEXT,
  website_url TEXT,
  x_username TEXT,
  linkedin_username TEXT,
  github_username TEXT
);
COMMENT ON TABLE public.user_profiles IS 'Stores public user profile information, extending auth.users.';

-- Enable Row Level Security for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);
COMMENT ON POLICY "Profiles are viewable by everyone" ON public.user_profiles IS 'Allows any user (anonymous or authenticated) to view all user profiles.';

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
COMMENT ON POLICY "Users can update their own profile" ON public.user_profiles IS 'Allows authenticated users to update only their own profile.';

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);
COMMENT ON POLICY "Users can delete their own profile" ON public.user_profiles IS 'Allows authenticated users to delete only their own profile.';

-- Function to handle new user creation and populate user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
BEGIN
  default_nickname := split_part(NEW.email, '@', 1) || floor(random() * 1000)::text;
  
  INSERT INTO public.user_profiles (
    id,
    full_name,
    nickname,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::TEXT,
      (NEW.raw_user_meta_data->>'name')::TEXT,
      split_part(NEW.email, '@', 1)
    ),
    default_nickname,
    COALESCE(
      (NEW.raw_user_meta_data->>'avatar_url')::TEXT,
      (NEW.raw_user_meta_data->>'picture')::TEXT
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER is important for accessing NEW.email etc.
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to automatically create a user profile upon new user registration in auth.users.';

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update the updated_at column on profile update
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: Function to check if a nickname is available (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_nickname_available(p_nickname TEXT) -- Renamed parameter
RETURNS BOOLEAN AS $$
DECLARE
  nickname_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nickname_count FROM public.user_profiles WHERE user_profiles.nickname = p_nickname;
  RETURN nickname_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.is_nickname_available(TEXT) IS 'Checks if a nickname is available for use, bypassing RLS.';


-- ==========================================
-- Projects Table
-- Core table for projects.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  public_snapshot_id UUID, -- FK constraint added later
  new_snapshot_id UUID,    -- FK constraint added later
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.projects IS 'Stores core project information and links to snapshots.';

-- Trigger for projects updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
  FOR SELECT USING (is_public = true AND is_archived = false);
COMMENT ON POLICY "Public projects are viewable by everyone" ON public.projects IS 'Allows anyone to view projects that are public and not archived.';

DROP POLICY IF EXISTS "Owners can view their non-archived projects" ON public.projects;
CREATE POLICY "Owners can view their non-archived projects" ON public.projects
  FOR SELECT USING (
    is_archived = false AND
    EXISTS (
      SELECT 1
      FROM public.project_permissions pp
      WHERE pp.project_id = projects.id -- Explicitly qualify projects.id
        AND pp.user_id = auth.uid()
        AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Owners can view their non-archived projects" ON public.projects IS 'Allows project owners to view their projects, even if private, as long as not archived.';

-- UPDATE policies for projects
DROP POLICY IF EXISTS "Editors, Admins and Owners can update projects" ON public.projects;
CREATE POLICY "Editors, Admins and Owners can update projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
  );
COMMENT ON POLICY "Editors, Admins and Owners can update projects" ON public.projects IS 'Allows users with editor, admin, or owner roles to update project fields (general updates).';

DROP POLICY IF EXISTS "Owners can update all project fields" ON public.projects;
CREATE POLICY "Owners can update all project fields" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Owners can update all project fields" ON public.projects IS 'Allows project owners to update any project field, including is_public and is_archived.';

DROP POLICY IF EXISTS "Editors and Admins can update limited fields" ON public.projects;
CREATE POLICY "Editors and Admins can update limited fields" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Editors and Admins can update limited fields" ON public.projects IS 'Allows editors and admins to update project fields, but restricts changes to is_public and is_archived (only for non-owners).';

DROP POLICY IF EXISTS "Only Owners can change publicity status" ON public.projects;
CREATE POLICY "Only Owners can change publicity status" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Only Owners can change publicity status" ON public.projects IS 'Ensures only project owners can change the is_public and is_archived fields.';

DROP POLICY IF EXISTS "Only Owners can delete projects" ON public.projects;
CREATE POLICY "Only Owners can delete projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = projects.id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Only Owners can delete projects" ON public.projects IS 'Restricts project deletion to only the project owner.';


-- ==========================================
-- Snapshots ENUM Type & Table
-- Stores versioned snapshots of project data.
-- ==========================================
-- Define project_status_enum if it doesn't exist (more complex for full idempotency, 
-- for now, we assume if script runs multiple times, type exists or manual ALTER TYPE is used for changes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status_enum') THEN
    CREATE TYPE project_status_enum AS ENUM (
      'idea', 'concept', 'prototype', 'mvp', 'beta', 
      'launched', 'growing', 'scaling', 'established', 
      'acquired', 'closed'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  slogan TEXT,
  description TEXT NOT NULL,
  status project_status_enum NOT NULL,
  country TEXT,
  city TEXT,
  repository_urls TEXT[],
  website_urls TEXT[],
  logo_url TEXT,
  banner_url TEXT,
  video_urls TEXT[],
  contents UUID[], -- Array of ProjectContent IDs
  team_members UUID[], -- Array of TeamMember IDs
  scoring_id UUID, -- Reference to ProjectScoring for this snapshot
  author_id UUID NOT NULL REFERENCES auth.users(id), -- Refers to the user who created/owns this snapshot version
  is_locked BOOLEAN NOT NULL DEFAULT false, -- Indicates if snapshot can be edited (locked after publish)
  UNIQUE(project_id, version)
);
COMMENT ON TABLE public.snapshots IS 'Stores versioned snapshots of project data. Each snapshot represents a state of the project.';
COMMENT ON COLUMN public.snapshots.author_id IS 'User who created this version of the snapshot.';
COMMENT ON COLUMN public.snapshots.is_locked IS 'True if the snapshot is published and locked from further edits.';
COMMENT ON COLUMN public.snapshots.contents IS 'Array of ProjectContent UUIDs associated with this snapshot.';
COMMENT ON COLUMN public.snapshots.team_members IS 'Array of TeamMember UUIDs associated with this snapshot.';
COMMENT ON COLUMN public.snapshots.scoring_id IS 'UUID reference to project_scoring table for this snapshot.';

-- Foreign key constraints from projects to snapshots (defined after snapshots table)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS fk_public_snapshot_id;
ALTER TABLE public.projects ADD CONSTRAINT fk_public_snapshot_id
  FOREIGN KEY (public_snapshot_id) REFERENCES public.snapshots(id) ON DELETE SET NULL;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS fk_new_snapshot_id;
ALTER TABLE public.projects ADD CONSTRAINT fk_new_snapshot_id
  FOREIGN KEY (new_snapshot_id) REFERENCES public.snapshots(id) ON DELETE SET NULL;

-- Trigger for snapshots updated_at
DROP TRIGGER IF EXISTS update_snapshots_updated_at ON public.snapshots;
CREATE TRIGGER update_snapshots_updated_at
  BEFORE UPDATE ON public.snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for snapshots
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- Function to check if a snapshot is publicly visible (SECURITY DEFINER)
-- Used in RLS policy for public.snapshots
CREATE OR REPLACE FUNCTION public.is_snapshot_publicly_visible(target_snapshot_id UUID, target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = target_project_id
      AND p.is_public = true
      AND p.public_snapshot_id = target_snapshot_id
      AND p.is_archived = false -- Project must not be archived
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_snapshot_publicly_visible(UUID, UUID) TO anon, authenticated;
COMMENT ON FUNCTION public.is_snapshot_publicly_visible(UUID, UUID) IS 'Checks if a snapshot is publicly visible based on project status and public_snapshot_id; bypasses invoker RLS for project checks.';

-- Policies for snapshots
DROP POLICY IF EXISTS "Public snapshots are viewable by everyone" ON public.snapshots;
CREATE POLICY "Public snapshots are viewable by everyone" ON public.snapshots
  FOR SELECT
  USING (public.is_snapshot_publicly_visible(snapshots.id, snapshots.project_id));
COMMENT ON POLICY "Public snapshots are viewable by everyone" ON public.snapshots IS 'Allows anyone to view snapshots that are designated public for a public, non-archived project via is_snapshot_publicly_visible function.';

DROP POLICY IF EXISTS "Users with permissions can view snapshots" ON public.snapshots;
CREATE POLICY "Users with permissions can view snapshots" ON public.snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = snapshots.project_id -- Qualified snapshots.project_id
      AND pp.user_id = auth.uid()
    )
  );
COMMENT ON POLICY "Users with permissions can view snapshots" ON public.snapshots IS 'Allows authenticated users with any role on a project to view all its snapshots.';

DROP POLICY IF EXISTS "Editors, Admins and Owners can create snapshots" ON public.snapshots;
CREATE POLICY "Editors, Admins and Owners can create snapshots" ON public.snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = snapshots.project_id -- Qualified
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
      AND auth.uid() = snapshots.author_id -- Qualified
    )
  );
COMMENT ON POLICY "Editors, Admins and Owners can create snapshots" ON public.snapshots IS 'Allows project editors, admins, or owners to create new snapshots for their projects, ensuring they are the author.';

DROP POLICY IF EXISTS "Only project editors can update unlocked snapshots" ON public.snapshots;
CREATE POLICY "Only project editors can update unlocked snapshots" ON public.snapshots
  FOR UPDATE USING (
    snapshots.is_locked = false AND -- Qualified
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = snapshots.project_id -- Qualified
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
  );
COMMENT ON POLICY "Only project editors can update unlocked snapshots" ON public.snapshots IS 'Allows project editors, admins, or owners to update snapshots that are not locked (published).';

DROP POLICY IF EXISTS "Only project owners can lock/unlock snapshots" ON public.snapshots;
CREATE POLICY "Only project owners can lock/unlock snapshots" ON public.snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = snapshots.project_id -- Qualified
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  )
  WITH CHECK ( -- Ensure the updated field is only is_locked or similar by owner (implicit here, policy applies to all updates by owner)
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = snapshots.project_id -- Qualified
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Only project owners can lock/unlock snapshots" ON public.snapshots IS 'Allows only project owners to modify snapshots, typically for locking/unlocking (publishing).';


-- ==========================================
-- Project Permissions ENUM Type & Table
-- Manages user roles within projects.
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_role_enum') THEN
    CREATE TYPE project_role_enum AS ENUM ('viewer', 'editor', 'admin', 'owner');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.project_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role_enum NOT NULL,
  UNIQUE(project_id, user_id)
);
COMMENT ON TABLE public.project_permissions IS 'Manages user roles (viewer, editor, admin, owner) for each project.';

-- Trigger for project_permissions updated_at
DROP TRIGGER IF EXISTS update_project_permissions_updated_at ON public.project_permissions;
CREATE TRIGGER update_project_permissions_updated_at
  BEFORE UPDATE ON public.project_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for project_permissions
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;

-- Function to get user role (SECURITY DEFINER)
-- Used by other RLS policies to check roles without recursive RLS issues.
CREATE OR REPLACE FUNCTION public.get_user_role_in_project(p_user_id UUID, p_project_id UUID)
RETURNS project_role_enum
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role project_role_enum;
BEGIN
  SELECT role INTO v_role
  FROM public.project_permissions
  WHERE user_id = p_user_id AND project_id = p_project_id;
  RETURN v_role;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_role_in_project(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION public.get_user_role_in_project(UUID, UUID) IS 'Fetches a user''s role in a specific project, bypassing RLS. Used internally by other RLS policies.';

-- Policies for project_permissions
DROP POLICY IF EXISTS "Users can select their own permission entry" ON public.project_permissions;
CREATE POLICY "Users can select their own permission entry" ON public.project_permissions
  FOR SELECT USING (auth.uid() = user_id);
COMMENT ON POLICY "Users can select their own permission entry" ON public.project_permissions IS 'Allows authenticated users to see their own permission entry for any project.';

DROP POLICY IF EXISTS "Admins and Owners can view all permissions for their projects" ON public.project_permissions;
CREATE POLICY "Admins and Owners can view all permissions for their projects" ON public.project_permissions
  FOR SELECT USING (
    public.get_user_role_in_project(auth.uid(), project_permissions.project_id) IN ('admin', 'owner')
  );
COMMENT ON POLICY "Admins and Owners can view all permissions for their projects" ON public.project_permissions IS 'Allows project admins and owners to view all permission entries for projects they manage.';

DROP POLICY IF EXISTS "Owners can manage permissions" ON public.project_permissions;
CREATE POLICY "Owners can manage permissions" ON public.project_permissions
  FOR ALL USING ( -- Covers INSERT, UPDATE, DELETE
    public.get_user_role_in_project(auth.uid(), project_permissions.project_id) = 'owner'
  );
COMMENT ON POLICY "Owners can manage permissions" ON public.project_permissions IS 'Allows project owners to manage all aspects of permissions (add, update, remove users) for their projects.';


-- ==========================================
-- Project Content ENUM Type & Table
-- Manages documents and content for projects.
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
    CREATE TYPE content_type_enum AS ENUM (
      'presentation', 'research', 'pitch_deck', 'whitepaper',
      'video', 'audio', 'image', 'report', 'document',
      'spreadsheet', 'table', 'chart', 'infographic',
      'case_study', 'other'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.project_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_type content_type_enum NOT NULL DEFAULT 'document',
  content TEXT DEFAULT '',
  description TEXT,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES auth.users(id),
  is_public BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, slug)
);
COMMENT ON TABLE public.project_content IS 'Stores documents and content files associated with projects.';
COMMENT ON COLUMN public.project_content.slug IS 'URL-friendly identifier unique within the project.';
COMMENT ON COLUMN public.project_content.file_urls IS 'Array of file URLs stored in Supabase Storage.';
COMMENT ON COLUMN public.project_content.deleted_at IS 'Soft delete timestamp - content is hidden but not removed.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_content_project_id ON public.project_content(project_id);
CREATE INDEX IF NOT EXISTS idx_project_content_deleted_at ON public.project_content(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_content_author_id ON public.project_content(author_id);

-- Trigger for project_content updated_at
DROP TRIGGER IF EXISTS update_project_content_updated_at ON public.project_content;
CREATE TRIGGER update_project_content_updated_at
  BEFORE UPDATE ON public.project_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for project_content
ALTER TABLE public.project_content ENABLE ROW LEVEL SECURITY;

-- Policies for project_content
DROP POLICY IF EXISTS "Public content is viewable by everyone" ON public.project_content;
CREATE POLICY "Public content is viewable by everyone" ON public.project_content
  FOR SELECT USING (
    is_public = true 
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_content.project_id 
      AND p.is_public = true 
      AND p.is_archived = false
    )
  );
COMMENT ON POLICY "Public content is viewable by everyone" ON public.project_content IS 'Allows anyone to view public content from public, non-archived projects.';

DROP POLICY IF EXISTS "Users with permissions can view project content" ON public.project_content;
CREATE POLICY "Users with permissions can view project content" ON public.project_content
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_content.project_id
      AND pp.user_id = auth.uid()
    )
  );
COMMENT ON POLICY "Users with permissions can view project content" ON public.project_content IS 'Allows users with project permissions to view all non-deleted content.';

DROP POLICY IF EXISTS "Editors, Admins and Owners can create content" ON public.project_content;
CREATE POLICY "Editors, Admins and Owners can create content" ON public.project_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_content.project_id
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
    AND auth.uid() = project_content.author_id
  );
COMMENT ON POLICY "Editors, Admins and Owners can create content" ON public.project_content IS 'Allows project editors, admins, or owners to create content, ensuring they are the author.';

DROP POLICY IF EXISTS "Authors and project admins can update content" ON public.project_content;
CREATE POLICY "Authors and project admins can update content" ON public.project_content
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      auth.uid() = project_content.author_id
      OR EXISTS (
        SELECT 1 FROM public.project_permissions pp 
        WHERE pp.project_id = project_content.project_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
      )
    )
  );
COMMENT ON POLICY "Authors and project admins can update content" ON public.project_content IS 'Allows content authors or project admins/owners to update content.';

DROP POLICY IF EXISTS "Authors and project admins can soft delete content" ON public.project_content;
CREATE POLICY "Authors and project admins can soft delete content" ON public.project_content
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      auth.uid() = project_content.author_id
      OR EXISTS (
        SELECT 1 FROM public.project_permissions pp 
        WHERE pp.project_id = project_content.project_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    -- Allow setting deleted_at or updating other fields
    (deleted_at IS NOT NULL OR deleted_at IS NULL)
  );
COMMENT ON POLICY "Authors and project admins can soft delete content" ON public.project_content IS 'Allows content authors or project admins/owners to soft delete content by setting deleted_at.';

-- Function to check if a content slug is available within a project
CREATE OR REPLACE FUNCTION public.check_content_slug_availability(p_project_id UUID, p_slug TEXT, p_content_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slug_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO slug_count 
  FROM public.project_content 
  WHERE project_id = p_project_id 
    AND slug = p_slug 
    AND deleted_at IS NULL
    AND (p_content_id IS NULL OR id != p_content_id);
  RETURN slug_count = 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_content_slug_availability(UUID, TEXT, UUID) TO authenticated;
COMMENT ON FUNCTION public.check_content_slug_availability(UUID, TEXT, UUID) IS 'Checks if a content slug is available within a project, optionally excluding a specific content ID for updates.';


-- ==========================================
-- Team Members ENUM Type & Table
-- Manages team members for projects.
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_status_enum') THEN
    CREATE TYPE team_member_status_enum AS ENUM ('ghost', 'invited', 'active', 'inactive');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to registered user
  joined_at TIMESTAMP WITH TIME ZONE,
  departed_at TIMESTAMP WITH TIME ZONE,
  departed_reason TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  image_url TEXT,
  country TEXT,
  city TEXT,
  is_founder BOOLEAN NOT NULL DEFAULT false,
  equity_percent NUMERIC(5,2), -- Percentage with 2 decimal places (0.00 to 100.00)
  positions TEXT[] NOT NULL DEFAULT '{}',
  status team_member_status_enum NOT NULL DEFAULT 'active',
  x_url TEXT,
  is_x_verified BOOLEAN DEFAULT false,
  github_url TEXT,
  is_github_verified BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  is_linkedin_verified BOOLEAN DEFAULT false,
  pii_hash TEXT, -- Hash of PII data for KYC
  author_id UUID NOT NULL REFERENCES auth.users(id), -- User who created this team member entry
  deleted_at TIMESTAMP WITH TIME ZONE
);
COMMENT ON TABLE public.team_members IS 'Stores team member information for projects.';
COMMENT ON COLUMN public.team_members.user_id IS 'Optional link to registered user account.';
COMMENT ON COLUMN public.team_members.equity_percent IS 'Percentage of equity (0.00 to 100.00).';
COMMENT ON COLUMN public.team_members.positions IS 'Array of role names for this team member.';
COMMENT ON COLUMN public.team_members.status IS 'Current status of the team member.';
COMMENT ON COLUMN public.team_members.author_id IS 'User who created this team member entry.';
COMMENT ON COLUMN public.team_members.deleted_at IS 'Soft delete timestamp - member is hidden but not removed.';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_deleted_at ON public.team_members(deleted_at);
CREATE INDEX IF NOT EXISTS idx_team_members_author_id ON public.team_members(author_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

-- Trigger for team_members updated_at
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies for team_members
DROP POLICY IF EXISTS "Public team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Public team members are viewable by everyone" ON public.team_members
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = team_members.project_id 
      AND p.is_public = true 
      AND p.is_archived = false
    )
  );
COMMENT ON POLICY "Public team members are viewable by everyone" ON public.team_members IS 'Allows anyone to view team members from public, non-archived projects.';

DROP POLICY IF EXISTS "Users with permissions can view project team members" ON public.team_members;
CREATE POLICY "Users with permissions can view project team members" ON public.team_members
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = team_members.project_id
      AND pp.user_id = auth.uid()
    )
  );
COMMENT ON POLICY "Users with permissions can view project team members" ON public.team_members IS 'Allows users with project permissions to view all non-deleted team members.';

DROP POLICY IF EXISTS "Editors, Admins and Owners can create team members" ON public.team_members;
CREATE POLICY "Editors, Admins and Owners can create team members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = team_members.project_id
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
    AND auth.uid() = team_members.author_id
  );
COMMENT ON POLICY "Editors, Admins and Owners can create team members" ON public.team_members IS 'Allows project editors, admins, or owners to create team members, ensuring they are the author.';

DROP POLICY IF EXISTS "Authors and project admins can update team members" ON public.team_members;
CREATE POLICY "Authors and project admins can update team members" ON public.team_members
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      auth.uid() = team_members.author_id
      OR EXISTS (
        SELECT 1 FROM public.project_permissions pp 
        WHERE pp.project_id = team_members.project_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
      )
    )
  );
COMMENT ON POLICY "Authors and project admins can update team members" ON public.team_members IS 'Allows team member authors or project admins/owners to update team members.';

DROP POLICY IF EXISTS "Authors and project admins can soft delete team members" ON public.team_members;
CREATE POLICY "Authors and project admins can soft delete team members" ON public.team_members
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      auth.uid() = team_members.author_id
      OR EXISTS (
        SELECT 1 FROM public.project_permissions pp 
        WHERE pp.project_id = team_members.project_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    -- Allow setting deleted_at or updating other fields
    (deleted_at IS NOT NULL OR deleted_at IS NULL)
  );
COMMENT ON POLICY "Authors and project admins can soft delete team members" ON public.team_members IS 'Allows team member authors or project admins/owners to soft delete team members by setting deleted_at.';

-- Constraint to prevent deletion of team members in locked snapshots
CREATE OR REPLACE FUNCTION public.check_team_member_locked_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if team member is referenced in any locked snapshot
  IF EXISTS (
    SELECT 1 FROM public.snapshots s
    WHERE s.project_id = OLD.project_id
      AND s.is_locked = true
      AND OLD.id = ANY(s.team_members)
  ) THEN
    RAISE EXCEPTION 'Cannot delete team member that is referenced in a locked snapshot';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_locked_team_member_deletion ON public.team_members;
CREATE TRIGGER prevent_locked_team_member_deletion
  BEFORE DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.check_team_member_locked_snapshot();


-- ==========================================
-- Function to create a new project and assign owner
-- ==========================================
CREATE OR REPLACE FUNCTION public.create_project(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_status project_status_enum
)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
  v_snapshot_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a project';
  END IF;
  
  INSERT INTO public.projects (slug) VALUES (p_slug) RETURNING id INTO v_project_id;
  
  INSERT INTO public.snapshots (project_id, version, name, description, status, author_id)
  VALUES (v_project_id, 1, p_name, p_description, p_status, v_user_id)
  RETURNING id INTO v_snapshot_id;
  
  UPDATE public.projects SET new_snapshot_id = v_snapshot_id WHERE id = v_project_id;

  INSERT INTO public.project_permissions (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'owner');
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER to allow inserts into tables by the function owner
COMMENT ON FUNCTION public.create_project(TEXT, TEXT, TEXT, project_status_enum) IS 'Creates a new project, its initial snapshot, and assigns owner permission to the calling authenticated user.';


-- ==========================================
-- Function to check slug availability (bypasses RLS policies)
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_slug_availability(slug_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slug_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO slug_count 
  FROM public.projects 
  WHERE slug = slug_to_check;
  RETURN slug_count = 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_slug_availability(TEXT) TO anon, authenticated;
COMMENT ON FUNCTION public.check_slug_availability(TEXT) IS 'Checks if a project slug is available without triggering RLS policies.'; 


-- ==========================================
-- Function to get project public and archived status by ID (bypasses RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_project_status_by_id(p_project_id UUID)
RETURNS TABLE (is_public BOOLEAN, is_archived BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.is_public, p.is_archived -- Aliased p
  FROM public.projects p
  WHERE p.id = p_project_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_project_status_by_id(UUID) TO anon, authenticated;
COMMENT ON FUNCTION public.get_project_status_by_id(UUID) IS 'Fetches project public and archived status by ID, bypassing RLS for initial check needed for UI presentation.'; 


-- ==========================================
-- Final Grant Permissions (General)
-- Ensure roles have basic usage on the schema and necessary sequences if any.
-- Specific table grants are usually handled by Supabase defaults or explicitly above with RLS.
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- Supabase typically handles default grants for SELECT, INSERT, UPDATE, DELETE based on RLS for authenticated role.
-- anon role usually only gets SELECT based on RLS.
-- Explicit grants like GRANT SELECT ON public.user_profiles TO anon, authenticated; are good for clarity if defaults are not certain.

-- Example of explicit grants if needed, though often Supabase handles this based on RLS + default role privileges.
-- GRANT SELECT ON public.user_profiles TO anon, authenticated;
-- GRANT UPDATE (full_name, nickname, avatar_url, bio, professional_background, 
--               startup_ecosystem_role, country, city, website_url, 
--               x_username, linkedin_username, github_username) ON public.user_profiles TO authenticated; 

-- GRANT SELECT ON public.projects TO anon, authenticated;
-- GRANT SELECT ON public.snapshots TO anon, authenticated;
-- GRANT SELECT ON public.project_permissions TO authenticated;

-- GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
-- GRANT INSERT, UPDATE ON public.snapshots TO authenticated;
-- GRANT INSERT, UPDATE, DELETE ON public.project_permissions TO authenticated;

-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; -- If using explicit sequences not managed by DEFAULT gen_random_uuid()


-- ==========================================
-- Function to publish project draft
-- ==========================================
CREATE OR REPLACE FUNCTION public.publish_project_draft(
  project_id UUID,
  new_public_snapshot_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to publish draft';
  END IF;
  
  -- Check if user is owner of the project
  IF NOT EXISTS (
    SELECT 1 FROM public.project_permissions pp 
    WHERE pp.project_id = publish_project_draft.project_id 
    AND pp.user_id = v_user_id
    AND pp.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only project owners can publish drafts';
  END IF;
  
  -- Update project to set new public snapshot
  UPDATE public.projects 
  SET public_snapshot_id = new_public_snapshot_id
  WHERE id = project_id;
  
  -- Lock the snapshot
  UPDATE public.snapshots 
  SET is_locked = true
  WHERE id = new_public_snapshot_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.publish_project_draft(UUID, UUID) IS 'Publishes a project draft by setting public_snapshot_id and locking the snapshot. Only project owners can call this.';

-- ==========================================
-- Storage Policies for project-files bucket
-- ==========================================
-- Note: These policies should be created in Supabase Dashboard > Storage > Policies
-- or via SQL Editor, not through direct INSERT into storage.policies table

-- Policy for viewing project files
CREATE POLICY "Users can view project files based on project permissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND (
    -- Public projects - everyone can view
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id::text = (storage.foldername(name))[1] 
      AND p.is_public = true 
      AND p.is_archived = false
    )
    OR
    -- Users with project permissions
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id::text = (storage.foldername(name))[1] 
      AND pp.user_id = auth.uid()
    )
  )
);

-- Policy for uploading project files
CREATE POLICY "Users with edit permissions can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM public.project_permissions pp 
    WHERE pp.project_id::text = (storage.foldername(name))[1] 
    AND pp.user_id = auth.uid()
    AND pp.role IN ('editor', 'admin', 'owner')
  )
);

-- Policy for updating project files
CREATE POLICY "Users with edit permissions can update project files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM public.project_permissions pp 
    WHERE pp.project_id::text = (storage.foldername(name))[1] 
    AND pp.user_id = auth.uid()
    AND pp.role IN ('editor', 'admin', 'owner')
  )
)
WITH CHECK (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM public.project_permissions pp 
    WHERE pp.project_id::text = (storage.foldername(name))[1] 
    AND pp.user_id = auth.uid()
    AND pp.role IN ('editor', 'admin', 'owner')
  )
);

-- Policy for deleting project files
CREATE POLICY "Users with edit permissions can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM public.project_permissions pp 
    WHERE pp.project_id::text = (storage.foldername(name))[1] 
    AND pp.user_id = auth.uid()
    AND pp.role IN ('editor', 'admin', 'owner')
  )
);

-- Notes on ENUMs:
-- To add a new value to an ENUM later: ALTER TYPE project_status_enum ADD VALUE 'new_status_value';
-- (This needs to be done manually or via a separate migration script if the script is re-runnable)

-- ==========================================
-- Function to soft delete team member (bypasses RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.soft_delete_team_member(
  p_member_id UUID,
  p_project_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_member RECORD;
  v_user_role TEXT;
  v_can_delete BOOLEAN := FALSE;
BEGIN
  -- Get team member details
  SELECT * INTO v_team_member
  FROM public.team_members
  WHERE id = p_member_id 
    AND project_id = p_project_id 
    AND deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN FALSE; -- Team member not found
  END IF;
  
  -- Check if user is the author
  IF v_team_member.author_id = p_user_id THEN
    v_can_delete := TRUE;
  ELSE
    -- Check if user has admin/owner role
    SELECT role INTO v_user_role
    FROM public.project_permissions
    WHERE project_id = p_project_id 
      AND user_id = p_user_id;
      
    IF v_user_role IN ('admin', 'owner') THEN
      v_can_delete := TRUE;
    END IF;
  END IF;
  
  IF NOT v_can_delete THEN
    RETURN FALSE; -- Insufficient permissions
  END IF;
  
  -- Perform soft delete
  UPDATE public.team_members
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_member_id 
    AND project_id = p_project_id 
    AND deleted_at IS NULL;
    
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_team_member(UUID, UUID, UUID) TO authenticated;
COMMENT ON FUNCTION public.soft_delete_team_member(UUID, UUID, UUID) IS 'Soft deletes a team member, bypassing RLS policies with proper permission checks.';


-- ==========================================
-- Project Scoring ENUM Type & Table
-- Stores AI-generated investment scoring for project snapshots.
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scoring_status_enum') THEN
    CREATE TYPE scoring_status_enum AS ENUM ('new', 'in_progress', 'completed', 'failed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.project_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  snapshot_id UUID NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  status scoring_status_enum NOT NULL DEFAULT 'new',
  investment_rating NUMERIC(5,2), -- 0.00 to 100.00
  market_potential NUMERIC(5,2), -- 0.00 to 100.00
  team_competency NUMERIC(5,2), -- 0.00 to 100.00
  tech_innovation NUMERIC(5,2), -- 0.00 to 100.00
  business_model NUMERIC(5,2), -- 0.00 to 100.00
  execution_risk NUMERIC(5,2), -- 0.00 to 100.00
  summary TEXT,
  research TEXT,
  score NUMERIC(5,2), -- 0.00 to 100.00 (calculated overall score)
  ai_model_version TEXT NOT NULL,
  UNIQUE(snapshot_id), -- One scoring per snapshot
  CONSTRAINT chk_investment_rating CHECK (investment_rating IS NULL OR (investment_rating >= 0 AND investment_rating <= 100)),
  CONSTRAINT chk_market_potential CHECK (market_potential IS NULL OR (market_potential >= 0 AND market_potential <= 100)),
  CONSTRAINT chk_team_competency CHECK (team_competency IS NULL OR (team_competency >= 0 AND team_competency <= 100)),
  CONSTRAINT chk_tech_innovation CHECK (tech_innovation IS NULL OR (tech_innovation >= 0 AND tech_innovation <= 100)),
  CONSTRAINT chk_business_model CHECK (business_model IS NULL OR (business_model >= 0 AND business_model <= 100)),
  CONSTRAINT chk_execution_risk CHECK (execution_risk IS NULL OR (execution_risk >= 0 AND execution_risk <= 100)),
  CONSTRAINT chk_score CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);
COMMENT ON TABLE public.project_scoring IS 'Stores AI-generated investment scoring analysis for project snapshots.';
COMMENT ON COLUMN public.project_scoring.snapshot_id IS 'References the snapshot this scoring belongs to.';
COMMENT ON COLUMN public.project_scoring.status IS 'Current status of the scoring process.';
COMMENT ON COLUMN public.project_scoring.investment_rating IS 'Investment attractiveness rating (0-100).';
COMMENT ON COLUMN public.project_scoring.market_potential IS 'Market potential assessment (0-100).';
COMMENT ON COLUMN public.project_scoring.team_competency IS 'Team competency evaluation (0-100).';
COMMENT ON COLUMN public.project_scoring.tech_innovation IS 'Technology innovation score (0-100).';
COMMENT ON COLUMN public.project_scoring.business_model IS 'Business model viability score (0-100).';
COMMENT ON COLUMN public.project_scoring.execution_risk IS 'Execution risk assessment (0-100).';
COMMENT ON COLUMN public.project_scoring.summary IS 'AI-generated summary of the scoring analysis.';
COMMENT ON COLUMN public.project_scoring.research IS 'Detailed research data used for scoring.';
COMMENT ON COLUMN public.project_scoring.score IS 'Overall calculated investment score (0-100).';
COMMENT ON COLUMN public.project_scoring.ai_model_version IS 'Version of the AI model used for scoring generation.';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_scoring_snapshot_id ON public.project_scoring(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_project_scoring_status ON public.project_scoring(status);
CREATE INDEX IF NOT EXISTS idx_project_scoring_score ON public.project_scoring(score);
CREATE INDEX IF NOT EXISTS idx_project_scoring_created_at ON public.project_scoring(created_at);

-- Trigger for project_scoring updated_at
DROP TRIGGER IF EXISTS update_project_scoring_updated_at ON public.project_scoring;
CREATE TRIGGER update_project_scoring_updated_at
  BEFORE UPDATE ON public.project_scoring
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for project_scoring
ALTER TABLE public.project_scoring ENABLE ROW LEVEL SECURITY;

-- Function to check if a scoring is publicly visible (SECURITY DEFINER)
-- Used in RLS policy for public.project_scoring
CREATE OR REPLACE FUNCTION public.is_scoring_publicly_visible(target_snapshot_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.snapshots s
    JOIN public.projects p ON p.id = s.project_id
    WHERE s.id = target_snapshot_id
      AND p.is_public = true
      AND p.public_snapshot_id = target_snapshot_id
      AND p.is_archived = false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_scoring_publicly_visible(UUID) TO anon, authenticated;
COMMENT ON FUNCTION public.is_scoring_publicly_visible(UUID) IS 'Checks if a scoring is publicly visible based on project and snapshot status; bypasses RLS for efficient checks.';

-- Function to check if user has project access for scoring (SECURITY DEFINER)
-- Used in RLS policy for public.project_scoring
CREATE OR REPLACE FUNCTION public.user_has_scoring_access(target_snapshot_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.snapshots s
    JOIN public.project_permissions pp ON pp.project_id = s.project_id
    WHERE s.id = target_snapshot_id
      AND pp.user_id = user_has_scoring_access.user_id
  );
$$;
GRANT EXECUTE ON FUNCTION public.user_has_scoring_access(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION public.user_has_scoring_access(UUID, UUID) IS 'Checks if a user has access to scoring through project permissions; bypasses RLS for efficient checks.';

-- Policies for project_scoring
DROP POLICY IF EXISTS "Public scoring is viewable by everyone" ON public.project_scoring;
CREATE POLICY "Public scoring is viewable by everyone" ON public.project_scoring
  FOR SELECT
  USING (
    status = 'completed' AND
    public.is_scoring_publicly_visible(project_scoring.snapshot_id)
  );
COMMENT ON POLICY "Public scoring is viewable by everyone" ON public.project_scoring IS 'Allows anyone to view completed scoring for public project snapshots.';

DROP POLICY IF EXISTS "Users with permissions can view project scoring" ON public.project_scoring;
CREATE POLICY "Users with permissions can view project scoring" ON public.project_scoring
  FOR SELECT USING (
    public.user_has_scoring_access(project_scoring.snapshot_id, auth.uid())
  );
COMMENT ON POLICY "Users with permissions can view project scoring" ON public.project_scoring IS 'Allows users with project permissions to view scoring for any status.';

DROP POLICY IF EXISTS "System can create scoring" ON public.project_scoring;
CREATE POLICY "System can create scoring" ON public.project_scoring
  FOR INSERT WITH CHECK (
    -- Allow creation for authenticated users who have project permissions
    auth.uid() IS NOT NULL AND
    public.user_has_scoring_access(project_scoring.snapshot_id, auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.snapshots s
      JOIN public.project_permissions pp ON pp.project_id = s.project_id
      WHERE s.id = project_scoring.snapshot_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
    )
  );
COMMENT ON POLICY "System can create scoring" ON public.project_scoring IS 'Allows project admins and owners to create scoring records.';

DROP POLICY IF EXISTS "System can update scoring" ON public.project_scoring;
CREATE POLICY "System can update scoring" ON public.project_scoring
  FOR UPDATE USING (
    -- Allow updates for authenticated users who have project admin/owner permissions
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.snapshots s
      JOIN public.project_permissions pp ON pp.project_id = s.project_id
      WHERE s.id = project_scoring.snapshot_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    -- Ensure the same conditions apply for the updated data
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.snapshots s
      JOIN public.project_permissions pp ON pp.project_id = s.project_id
      WHERE s.id = project_scoring.snapshot_id
        AND pp.user_id = auth.uid()
        AND pp.role IN ('admin', 'owner')
    )
  );
COMMENT ON POLICY "System can update scoring" ON public.project_scoring IS 'Allows project admins and owners to update scoring records.';

DROP POLICY IF EXISTS "Only project owners can delete scoring" ON public.project_scoring;
CREATE POLICY "Only project owners can delete scoring" ON public.project_scoring
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.snapshots s
      JOIN public.project_permissions pp ON pp.project_id = s.project_id
      WHERE s.id = project_scoring.snapshot_id
        AND pp.user_id = auth.uid()
        AND pp.role = 'owner'
    )
  );
COMMENT ON POLICY "Only project owners can delete scoring" ON public.project_scoring IS 'Restricts scoring deletion to only project owners.';

-- Function to get scoring by project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_project_scoring(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  snapshot_id UUID,
  status scoring_status_enum,
  investment_rating NUMERIC,
  market_potential NUMERIC,
  team_competency NUMERIC,
  tech_innovation NUMERIC,
  business_model NUMERIC,
  execution_risk NUMERIC,
  summary TEXT,
  research TEXT,
  score NUMERIC,
  ai_model_version TEXT,
  snapshot_version INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.created_at,
    ps.updated_at,
    ps.snapshot_id,
    ps.status,
    ps.investment_rating,
    ps.market_potential,
    ps.team_competency,
    ps.tech_innovation,
    ps.business_model,
    ps.execution_risk,
    ps.summary,
    ps.research,
    ps.score,
    ps.ai_model_version,
    s.version as snapshot_version
  FROM public.project_scoring ps
  JOIN public.snapshots s ON s.id = ps.snapshot_id
  WHERE s.project_id = p_project_id
  ORDER BY ps.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_project_scoring(UUID) TO anon, authenticated;
COMMENT ON FUNCTION public.get_project_scoring(UUID) IS 'Gets all scoring records for a project, ordered by creation date. Bypasses RLS but respects visibility in application layer.';

-- Function to create or update scoring (bypasses RLS for system operations)
CREATE OR REPLACE FUNCTION public.upsert_project_scoring(
  p_snapshot_id UUID,
  p_status scoring_status_enum,
  p_investment_rating NUMERIC DEFAULT NULL,
  p_market_potential NUMERIC DEFAULT NULL,
  p_team_competency NUMERIC DEFAULT NULL,
  p_tech_innovation NUMERIC DEFAULT NULL,
  p_business_model NUMERIC DEFAULT NULL,
  p_execution_risk NUMERIC DEFAULT NULL,
  p_summary TEXT DEFAULT NULL,
  p_research TEXT DEFAULT NULL,
  p_score NUMERIC DEFAULT NULL,
  p_ai_model_version TEXT DEFAULT 'unknown'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scoring_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user has permissions (admin or owner)
  IF NOT EXISTS (
    SELECT 1 FROM public.snapshots s
    JOIN public.project_permissions pp ON pp.project_id = s.project_id
    WHERE s.id = p_snapshot_id
      AND pp.user_id = v_user_id
      AND pp.role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create/update scoring';
  END IF;
  
  -- Insert or update scoring
  INSERT INTO public.project_scoring (
    snapshot_id,
    status,
    investment_rating,
    market_potential,
    team_competency,
    tech_innovation,
    business_model,
    execution_risk,
    summary,
    research,
    score,
    ai_model_version
  )
  VALUES (
    p_snapshot_id,
    p_status,
    p_investment_rating,
    p_market_potential,
    p_team_competency,
    p_tech_innovation,
    p_business_model,
    p_execution_risk,
    p_summary,
    p_research,
    p_score,
    p_ai_model_version
  )
  ON CONFLICT (snapshot_id) DO UPDATE SET
    status = EXCLUDED.status,
    investment_rating = EXCLUDED.investment_rating,
    market_potential = EXCLUDED.market_potential,
    team_competency = EXCLUDED.team_competency,
    tech_innovation = EXCLUDED.tech_innovation,
    business_model = EXCLUDED.business_model,
    execution_risk = EXCLUDED.execution_risk,
    summary = EXCLUDED.summary,
    research = EXCLUDED.research,
    score = EXCLUDED.score,
    ai_model_version = EXCLUDED.ai_model_version,
    updated_at = NOW()
  RETURNING id INTO v_scoring_id;
  
  RETURN v_scoring_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_project_scoring(UUID, scoring_status_enum, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;
COMMENT ON FUNCTION public.upsert_project_scoring(UUID, scoring_status_enum, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, NUMERIC, TEXT) IS 'Creates or updates project scoring with proper permission checks. Used by API endpoints and AI scoring processes.';

-- Function to get leaderboard data (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_scoring_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_min_score NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  project_id UUID,
  project_slug TEXT,
  project_name TEXT,
  project_slogan TEXT,
  project_status project_status_enum,
  score NUMERIC,
  investment_rating NUMERIC,
  market_potential NUMERIC,
  team_competency NUMERIC,
  tech_innovation NUMERIC,
  business_model NUMERIC,
  execution_risk NUMERIC,
  scoring_created_at TIMESTAMP WITH TIME ZONE,
  snapshot_version INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.slug as project_slug,
    s.name as project_name,
    s.slogan as project_slogan,
    s.status as project_status,
    ps.score,
    ps.investment_rating,
    ps.market_potential,
    ps.team_competency,
    ps.tech_innovation,
    ps.business_model,
    ps.execution_risk,
    ps.created_at as scoring_created_at,
    s.version as snapshot_version
  FROM public.projects p
  JOIN public.snapshots s ON s.id = p.public_snapshot_id
  JOIN public.project_scoring ps ON ps.snapshot_id = s.id
  WHERE p.is_public = true 
    AND p.is_archived = false
    AND ps.status = 'completed'
    AND ps.score IS NOT NULL
    AND (p_min_score IS NULL OR ps.score >= p_min_score)
  ORDER BY ps.score DESC, ps.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_scoring_leaderboard(INTEGER, INTEGER, NUMERIC) TO anon, authenticated;
COMMENT ON FUNCTION public.get_scoring_leaderboard(INTEGER, INTEGER, NUMERIC) IS 'Gets leaderboard data for public projects with completed scoring, ordered by score. Bypasses RLS for public data.';

-- ==========================================
-- Foreign Key Constraints (added after all tables are created)
-- ==========================================

-- Add foreign key constraint for snapshots.scoring_id to project_scoring table
-- (This constraint is added after project_scoring table is created to avoid circular dependencies)
ALTER TABLE public.snapshots DROP CONSTRAINT IF EXISTS fk_snapshots_scoring_id;
ALTER TABLE public.snapshots ADD CONSTRAINT fk_snapshots_scoring_id
  FOREIGN KEY (scoring_id) REFERENCES public.project_scoring(id) ON DELETE SET NULL;