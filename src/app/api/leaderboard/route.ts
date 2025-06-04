import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandler } from '@/lib/api/base-handler';
import { ValidationSchemas } from '@/lib/validations';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

// Leaderboard-specific validation schema
const leaderboardQuerySchema = ValidationSchemas.api.pagination.extend({
  min_score: z.coerce.number().min(0).max(100).optional(),
});

export type LeaderboardProject = {
  project_id: string;
  project_slug: string;
  project_name: string;
  project_slogan: string | null;
  project_status: string;
  score: number;
  investment_rating: number | null;
  market_potential: number | null;
  team_competency: number | null;
  tech_innovation: number | null;
  business_model: number | null;
  execution_risk: number | null;
  scoring_created_at: string;
  snapshot_version: number;
};

export const GET = createAPIHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const params = leaderboardQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    min_score: searchParams.get('min_score'),
  });

  // Calculate offset from page
  const offset = (params.page - 1) * params.limit;

  const supabase = await SupabaseClientFactory.getServerClient();

  // Use the existing get_scoring_leaderboard function
  const { data, error } = await supabase.rpc('get_scoring_leaderboard', {
    p_limit: params.limit,
    p_offset: offset,
    p_min_score: params.min_score || null,
  });

  if (error) {
    console.error('Leaderboard query error:', error);
    throw new Error('Failed to fetch leaderboard data');
  }

  return {
    projects: data as LeaderboardProject[],
    pagination: {
      page: params.page,
      limit: params.limit,
      offset,
      hasMore: data?.length === params.limit,
    },
  };
});
