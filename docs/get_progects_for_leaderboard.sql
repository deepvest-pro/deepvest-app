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
ORDER BY ps.score DESC, ps.created_at DESC
LIMIT 50;