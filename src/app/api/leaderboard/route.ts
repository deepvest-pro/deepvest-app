import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/client';

const leaderboardSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = leaderboardSchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      min_score: searchParams.get('min_score'),
    });

    const supabase = await createSupabaseServerClient();

    // Use the existing get_scoring_leaderboard function
    const { data, error } = await supabase.rpc('get_scoring_leaderboard', {
      p_limit: params.limit,
      p_offset: params.offset,
      p_min_score: params.min_score,
    });

    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
    }

    return NextResponse.json({
      projects: data as LeaderboardProject[],
      pagination: {
        limit: params.limit,
        offset: params.offset,
        hasMore: data?.length === params.limit,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }
}
