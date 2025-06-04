-- Restore missing contents column in snapshots table
-- This script adds the contents column if it's missing from your local database

-- Check current table structure
SELECT 'Current snapshots table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'snapshots'
ORDER BY ordinal_position;

-- Add the missing contents column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'snapshots' 
      AND column_name = 'contents'
  ) THEN
    -- Add the missing contents column
    ALTER TABLE public.snapshots 
    ADD COLUMN contents UUID[] DEFAULT '{}';
    
    -- Add comment for the column
    COMMENT ON COLUMN public.snapshots.contents IS 'Array of ProjectContent UUIDs associated with this snapshot.';
    
    RAISE NOTICE '✅ Added missing contents column to snapshots table';
  ELSE
    RAISE NOTICE '✅ Contents column already exists in snapshots table';
  END IF;
END$$;

-- Verify the fix
SELECT 'After fix - snapshots table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default,
  CASE 
    WHEN column_name = 'contents' THEN '✅ FOUND'
    WHEN column_name = 'team_members' THEN '✅ FOUND'
    ELSE ''
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'snapshots'
  AND column_name IN ('contents', 'team_members', 'id', 'name', 'project_id')
ORDER BY 
  CASE 
    WHEN column_name = 'contents' THEN 1
    WHEN column_name = 'team_members' THEN 2
    ELSE 3
  END; 