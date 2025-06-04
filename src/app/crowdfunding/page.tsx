import { Metadata } from 'next';
import { CrowdfundingList } from '@/components/crowdfunding';
import { mockCrowdfundingProjects, mockCrowdfundingStats } from '@/lib/mock-data/crowdfunding';

export const metadata: Metadata = {
  title: 'Crowdfunding Projects | DeepVest',
  description: 'Discover and invest in innovative crowdfunding projects. Join thousands of investors supporting breakthrough ideas on DeepVest platform.',
  keywords: 'crowdfunding, investment, startups, projects, funding, investors',
};

export default function CrowdfundingPage() {
  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'var(--gray-1)',
      paddingTop: '80px',
      paddingBottom: '80px'
    }}>
      <CrowdfundingList 
        projects={mockCrowdfundingProjects}
        stats={mockCrowdfundingStats}
      />
    </main>
  );
}
