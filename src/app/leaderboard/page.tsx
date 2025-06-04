import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';

export const metadata = {
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

export default function LeaderboardPage() {
  return <LeaderboardList />;
}
