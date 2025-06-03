-- ==========================================
-- TeamMember Migration Script for DeepVest
-- 
-- ИНСТРУКЦИЯ ПО ВЫПОЛНЕНИЮ:
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите в SQL Editor
-- 3. Скопируйте и вставьте весь этот скрипт
-- 4. Нажмите "Run" для выполнения
-- 
-- Этот скрипт:
-- - Создает таблицу team_members с полной структурой
-- - Добавляет поле team_members в таблицу snapshots
-- - Создает RLS политики для безопасности
-- - Создает индексы для производительности
-- - Настраивает права доступа
-- ==========================================

-- ==========================================
-- TEAM MEMBERS TABLE MIGRATION
-- ==========================================

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS public.team_members CASCADE;

-- Create team_members table
CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    positions TEXT[] NOT NULL DEFAULT '{}', -- Changed from 'roles' to 'positions' to avoid confusion with user roles
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('ghost', 'invited', 'active', 'inactive')),
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

-- Create indexes for better performance
CREATE INDEX idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_author_id ON public.team_members(author_id);
CREATE INDEX idx_team_members_status ON public.team_members(status);
CREATE INDEX idx_team_members_deleted_at ON public.team_members(deleted_at);

-- Create unique constraint for active team members (prevent duplicates)
CREATE UNIQUE INDEX idx_team_members_unique_active 
ON public.team_members(project_id, email) 
WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;

-- RLS Policies for team_members

-- 1. SELECT: Users can view team members of projects they have access to
CREATE POLICY "team_members_select_policy" ON public.team_members
    FOR SELECT
    USING (
        deleted_at IS NULL AND (
            -- Public projects are viewable by everyone
            EXISTS (
                SELECT 1 FROM public.projects p 
                WHERE p.id = team_members.project_id 
                AND p.is_public = true
                AND p.is_archived = false
            )
            OR
            -- Private projects are viewable by project members and owners
            EXISTS (
                SELECT 1 FROM public.project_permissions pp 
                WHERE pp.project_id = team_members.project_id 
                AND pp.user_id = auth.uid()
            )
        )
    );

-- 2. INSERT: Only project owners can add team members
CREATE POLICY "team_members_insert_policy" ON public.team_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_permissions pp 
            WHERE pp.project_id = team_members.project_id 
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
        AND author_id = auth.uid()
    );

-- 3. UPDATE: Only project owners can update team members
CREATE POLICY "team_members_update_policy" ON public.team_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_permissions pp 
            WHERE pp.project_id = team_members.project_id 
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_permissions pp 
            WHERE pp.project_id = team_members.project_id 
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );

-- 4. DELETE: Only project owners can delete team members
CREATE POLICY "team_members_delete_policy" ON public.team_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_permissions pp 
            WHERE pp.project_id = team_members.project_id 
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_members_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.team_members IS 'Stores team member information for projects.';
COMMENT ON COLUMN public.team_members.project_id IS 'Reference to the project';
COMMENT ON COLUMN public.team_members.user_id IS 'Optional link to registered user account.';
COMMENT ON COLUMN public.team_members.author_id IS 'User who created this team member entry.';
COMMENT ON COLUMN public.team_members.name IS 'Display name of the team member';
COMMENT ON COLUMN public.team_members.email IS 'Email address of the team member';
COMMENT ON COLUMN public.team_members.positions IS 'Array of business positions/roles for this team member (CEO, CTO, etc).';
COMMENT ON COLUMN public.team_members.is_founder IS 'Whether this person is a founder';
COMMENT ON COLUMN public.team_members.status IS 'Current status of the team member';
COMMENT ON COLUMN public.team_members.equity_percent IS 'Percentage of equity (0.00 to 100.00).';
COMMENT ON COLUMN public.team_members.deleted_at IS 'Soft delete timestamp - member is hidden but not removed.';

-- ==========================================
-- Add team_members field to snapshots table
-- ==========================================
DO $$
BEGIN
  -- Check if team_members column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'snapshots' 
    AND column_name = 'team_members'
  ) THEN
    ALTER TABLE public.snapshots ADD COLUMN team_members UUID[] DEFAULT '{}';
    COMMENT ON COLUMN public.snapshots.team_members IS 'Array of TeamMember UUIDs associated with this snapshot.';
  END IF;
END$$;

-- ==========================================
-- Grant necessary permissions
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- ==========================================
-- Success message
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'TeamMember migration completed successfully!';
  RAISE NOTICE 'Created table: public.team_members';
  RAISE NOTICE 'Added field: public.snapshots.team_members';
  RAISE NOTICE 'Created RLS policies for team_members';
  RAISE NOTICE 'Created indexes for performance';
  RAISE NOTICE 'IMPORTANT: Field "roles" renamed to "positions" to avoid confusion with user system roles';
END$$; 