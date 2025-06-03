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
  author_id UUID NOT NULL REFERENCES auth.users(id), -- Refers to the user who created/owns this snapshot version
  is_locked BOOLEAN NOT NULL DEFAULT false, -- Indicates if snapshot can be edited (locked after publish)
  UNIQUE(project_id, version)
);
COMMENT ON TABLE public.snapshots IS 'Stores versioned snapshots of project data. Each snapshot represents a state of the project.';
COMMENT ON COLUMN public.snapshots.author_id IS 'User who created this version of the snapshot.';
COMMENT ON COLUMN public.snapshots.is_locked IS 'True if the snapshot is published and locked from further edits.';

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


-- Removed old policy for projects: DROP POLICY IF EXISTS "Users with permissions can view projects" ON public.projects;
-- This was replaced by the combination of "Public projects are viewable by everyone" and "Owners can view their non-archived projects".

-- Notes on ENUMs:
-- To add a new value to an ENUM later: ALTER TYPE project_status_enum ADD VALUE 'new_status_value';
-- (This needs to be done manually or via a separate migration script if the script is re-runnable)