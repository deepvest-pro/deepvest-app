-- DeepVest Database Schema
-- This file contains the SQL definitions for the DeepVest database

-- ==========================================
-- User Profiles Table
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

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all profiles (public data)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);

-- Allow users to update only their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only allow the owner to delete their profile (though this will rarely be used due to CASCADE)
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
BEGIN
  -- Generate a unique nickname based on email or metadata
  default_nickname := split_part(NEW.email, '@', 1) || floor(random() * 1000)::text;
  
  -- Extract full name from the user metadata if available
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column on profile update
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: Create a custom function to check if a nickname is available
CREATE OR REPLACE FUNCTION public.is_nickname_available(nickname TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  nickname_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nickname_count FROM public.user_profiles WHERE user_profiles.nickname = is_nickname_available.nickname;
  RETURN nickname_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT UPDATE (full_name, nickname, avatar_url, bio, professional_background, 
              startup_ecosystem_role, country, city, website_url, 
              x_username, linkedin_username, github_username) ON public.user_profiles TO authenticated; 

-- ==========================================
-- Projects Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  public_snapshot_id UUID,
  new_snapshot_id UUID,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Trigger to update the updated_at column on project update
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Snapshots Table
-- ==========================================
CREATE TYPE project_status_enum AS ENUM (
  'idea', 'concept', 'prototype', 'mvp', 'beta', 
  'launched', 'growing', 'scaling', 'established', 
  'acquired', 'closed'
);

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
  author_id UUID NOT NULL REFERENCES auth.users(id),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(project_id, version)
);

-- Foreign key constraints on projects table (had to be added after snapshots table creation)
ALTER TABLE public.projects ADD CONSTRAINT fk_public_snapshot_id
FOREIGN KEY (public_snapshot_id) REFERENCES public.snapshots(id) ON DELETE SET NULL;

ALTER TABLE public.projects ADD CONSTRAINT fk_new_snapshot_id
FOREIGN KEY (new_snapshot_id) REFERENCES public.snapshots(id) ON DELETE SET NULL;

-- Trigger to update the updated_at column on snapshot update
CREATE TRIGGER update_snapshots_updated_at
BEFORE UPDATE ON public.snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Project Permissions Table
-- ==========================================
CREATE TYPE project_role_enum AS ENUM ('viewer', 'editor', 'admin', 'owner');

CREATE TABLE IF NOT EXISTS public.project_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role_enum NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Trigger to update the updated_at column on permissions update
CREATE TRIGGER update_project_permissions_updated_at
BEFORE UPDATE ON public.project_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Enable Row Level Security and Set Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;

-- Project Permissions Policies
DROP POLICY IF EXISTS "Users can select permissions they're involved with" ON public.project_permissions;
CREATE POLICY "Users can select permissions they're involved with" ON public.project_permissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and Owners can view all permissions for their projects" ON public.project_permissions;
CREATE POLICY "Admins and Owners can view all permissions for their projects" ON public.project_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Owners can manage permissions" ON public.project_permissions;
CREATE POLICY "Owners can manage permissions" ON public.project_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );

-- Projects Policies
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
  FOR SELECT USING (is_public = true AND is_archived = false);

DROP POLICY IF EXISTS "Users with permissions can view projects" ON public.projects;
CREATE POLICY "Users with permissions can view projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = id 
      AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Editors, Admins and Owners can update projects" ON public.projects;
CREATE POLICY "Editors, Admins and Owners can update projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Only Owners can delete projects" ON public.projects;
CREATE POLICY "Only Owners can delete projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Only Owners can change publicity status" ON public.projects;
CREATE POLICY "Only Owners can change publicity status" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );

-- Snapshots Policies
DROP POLICY IF EXISTS "Public snapshots are viewable by everyone" ON public.snapshots;
CREATE POLICY "Public snapshots are viewable by everyone" ON public.snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id 
      AND p.is_public = true 
      AND p.public_snapshot_id = id
    )
  );

DROP POLICY IF EXISTS "Users with permissions can view snapshots" ON public.snapshots;
CREATE POLICY "Users with permissions can view snapshots" ON public.snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Editors, Admins and Owners can create snapshots" ON public.snapshots;
CREATE POLICY "Editors, Admins and Owners can create snapshots" ON public.snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
      AND auth.uid() = author_id
    )
  );

DROP POLICY IF EXISTS "Only project editors can update unlocked snapshots" ON public.snapshots;
CREATE POLICY "Only project editors can update unlocked snapshots" ON public.snapshots
  FOR UPDATE USING (
    is_locked = false AND
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
      AND pp.role IN ('editor', 'admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Only project owners can lock/unlock snapshots" ON public.snapshots;
CREATE POLICY "Only project owners can lock/unlock snapshots" ON public.snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_permissions pp 
      WHERE pp.project_id = project_id 
      AND pp.user_id = auth.uid()
      AND pp.role = 'owner'
    )
  );

-- Function to create a new project and assign owner
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
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Insert project
  INSERT INTO public.projects (slug)
  VALUES (p_slug)
  RETURNING id INTO v_project_id;
  
  -- Insert initial snapshot
  INSERT INTO public.snapshots (
    project_id,
    version,
    name,
    description,
    status,
    author_id
  )
  VALUES (
    v_project_id,
    1,
    p_name,
    p_description,
    p_status,
    v_user_id
  )
  RETURNING id INTO v_snapshot_id;
  
  -- Set as new snapshot
  UPDATE public.projects 
  SET new_snapshot_id = v_snapshot_id
  WHERE id = v_project_id;

  -- Assign owner permission
  INSERT INTO public.project_permissions (
    project_id,
    user_id,
    role
  )
  VALUES (
    v_project_id,
    v_user_id,
    'owner'
  );
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Grant Permissions
-- ==========================================

-- Grant appropriate permissions on the new tables
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.snapshots TO anon, authenticated;
GRANT SELECT ON public.project_permissions TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT INSERT, UPDATE ON public.snapshots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_permissions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 