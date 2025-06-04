-- Add scoring_id column to snapshots table
-- This script adds the scoring_id column with foreign key reference to project_scoring

-- Check current table structure
SELECT 'Current snapshots table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'snapshots'
  AND column_name IN ('contents', 'team_members', 'scoring_id')
ORDER BY ordinal_position;

-- Add the scoring_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'snapshots' 
      AND column_name = 'scoring_id'
  ) THEN
    -- Add the scoring_id column
    ALTER TABLE public.snapshots 
    ADD COLUMN scoring_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE public.snapshots 
    ADD CONSTRAINT fk_snapshots_scoring_id 
    FOREIGN KEY (scoring_id) REFERENCES public.project_scoring(id) ON DELETE SET NULL;
    
    -- Add comment for the column
    COMMENT ON COLUMN public.snapshots.scoring_id IS 'UUID reference to project_scoring table for this snapshot.';
    
    RAISE NOTICE '✅ Added scoring_id column to snapshots table with foreign key constraint';
  ELSE
    RAISE NOTICE '✅ scoring_id column already exists in snapshots table';
  END IF;
END$$;

-- Verify the fix
SELECT 'After fix - relevant snapshots columns:' as info;
SELECT column_name, data_type, is_nullable, column_default,
  CASE 
    WHEN column_name = 'scoring_id' THEN '✅ ADDED'
    WHEN column_name = 'contents' THEN '✅ EXISTS'
    WHEN column_name = 'team_members' THEN '✅ EXISTS'
    ELSE ''
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'snapshots'
  AND column_name IN ('scoring_id', 'contents', 'team_members')
ORDER BY 
  CASE 
    WHEN column_name = 'scoring_id' THEN 1
    WHEN column_name = 'contents' THEN 2
    WHEN column_name = 'team_members' THEN 3
    ELSE 4
  END; 