-- Populate snapshots with contents and team_members from their projects
-- This script fills empty contents and team_members arrays in snapshots based on project data

-- Show current state before update
SELECT 'BEFORE UPDATE - Snapshots with empty arrays:' as info;
SELECT 
  s.id as snapshot_id,
  s.name as snapshot_name,
  p.slug as project_slug,
  array_length(s.contents, 1) as contents_count,
  array_length(s.team_members, 1) as team_members_count,
  CASE 
    WHEN array_length(s.contents, 1) IS NULL AND array_length(s.team_members, 1) IS NULL THEN '❌ Both empty'
    WHEN array_length(s.contents, 1) IS NULL THEN '⚠️ Contents empty'
    WHEN array_length(s.team_members, 1) IS NULL THEN '⚠️ Team empty'
    ELSE '✅ Populated'
  END as status
FROM public.snapshots s
JOIN public.projects p ON p.id = s.project_id
ORDER BY s.created_at DESC;

-- Update snapshots with project contents and team members
DO $$
DECLARE
  snapshot_record RECORD;
  content_ids UUID[];
  team_member_ids UUID[];
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all snapshots
  FOR snapshot_record IN 
    SELECT s.id as snapshot_id, s.project_id, s.name as snapshot_name
    FROM public.snapshots s
    ORDER BY s.created_at DESC
  LOOP
    -- Get all public, non-deleted content for this project
    SELECT array_agg(pc.id) INTO content_ids
    FROM public.project_content pc
    WHERE pc.project_id = snapshot_record.project_id
      AND pc.is_public = true
      AND pc.deleted_at IS NULL;
    
    -- Get all active (non-deleted) team members for this project
    SELECT array_agg(tm.id) INTO team_member_ids
    FROM public.team_members tm
    WHERE tm.project_id = snapshot_record.project_id
      AND tm.deleted_at IS NULL;
    
    -- Handle NULL arrays (convert to empty arrays)
    IF content_ids IS NULL THEN
      content_ids := '{}';
    END IF;
    
    IF team_member_ids IS NULL THEN
      team_member_ids := '{}';
    END IF;
    
    -- Update the snapshot
    UPDATE public.snapshots 
    SET 
      contents = content_ids,
      team_members = team_member_ids,
      updated_at = NOW()
    WHERE id = snapshot_record.snapshot_id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE 'Updated snapshot % (%) - Contents: %, Team: %', 
      snapshot_record.snapshot_name, 
      snapshot_record.snapshot_id,
      array_length(content_ids, 1),
      array_length(team_member_ids, 1);
      
  END LOOP;
  
  RAISE NOTICE '✅ Updated % snapshots total', updated_count;
END$$;

-- Show results after update
SELECT 'AFTER UPDATE - Updated snapshots:' as info;
SELECT 
  s.id as snapshot_id,
  s.name as snapshot_name,
  p.slug as project_slug,
  array_length(s.contents, 1) as contents_count,
  array_length(s.team_members, 1) as team_members_count,
  CASE 
    WHEN array_length(s.contents, 1) IS NULL AND array_length(s.team_members, 1) IS NULL THEN '❌ Both empty'
    WHEN array_length(s.contents, 1) IS NULL THEN '⚠️ Contents empty'
    WHEN array_length(s.team_members, 1) IS NULL THEN '⚠️ Team empty'
    ELSE '✅ Populated'
  END as status
FROM public.snapshots s
JOIN public.projects p ON p.id = s.project_id
ORDER BY s.created_at DESC;

-- Show detailed breakdown for verification
SELECT 'DETAILED BREAKDOWN:' as info;
SELECT 
  p.slug as project,
  s.name as snapshot,
  (
    SELECT COUNT(*) 
    FROM public.project_content pc 
    WHERE pc.project_id = s.project_id 
      AND pc.is_public = true 
      AND pc.deleted_at IS NULL
  ) as available_public_content,
  (
    SELECT COUNT(*) 
    FROM public.team_members tm 
    WHERE tm.project_id = s.project_id 
      AND tm.deleted_at IS NULL
  ) as available_team_members,
  array_length(s.contents, 1) as snapshot_contents,
  array_length(s.team_members, 1) as snapshot_team_members
FROM public.snapshots s
JOIN public.projects p ON p.id = s.project_id
ORDER BY p.slug, s.version; 