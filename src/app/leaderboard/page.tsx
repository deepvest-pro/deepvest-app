import type { Metadata } from 'next';
import { getLeaderboardProjects } from '@/lib/supabase/helpers';
import { LeaderboardDisplay } from '@/components/leaderboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leaderboard | DeepVest',
  description: 'Discover the highest-scoring startups on DeepVest, ranked by our AI analysis',
  keywords: [
    'startup leaderboard',
    'best startups',
    'AI startup analysis',
    'venture capital',
    'investment opportunities',
    'startup ranking',
    'entrepreneurship',
    'business scoring',
  ],
  openGraph: {
    title: 'Project Leaderboard | DeepVest',
    description: 'Discover the highest-scoring startups on DeepVest, ranked by our AI analysis',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Leaderboard | DeepVest',
    description: 'Discover the highest-scoring startups on DeepVest, ranked by our AI analysis',
  },
};

interface LeaderboardPageProps {
  searchParams: Promise<{
    min_score?: string;
    page?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  // Parse search parameters (await needed for Next.js 15)
  const params = await searchParams;
  const minScore = params.min_score ? Number(params.min_score) : undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Fetch leaderboard data on server side
  const { data, error } = await getLeaderboardProjects({
    limit: pageSize,
    offset,
    minScore,
  });

  if (error) {
    console.error('Failed to load leaderboard:', error);
  }

  return <LeaderboardDisplay initialData={data} error={error} currentPage={page} />;
}
