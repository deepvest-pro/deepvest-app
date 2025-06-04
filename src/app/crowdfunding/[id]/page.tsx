import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CrowdfundingContent } from '@/components/crowdfunding';
import { mockCrowdfundingProjects } from '@/lib/mock-data/crowdfunding';

interface CrowdfundingProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params: paramsPromise }: CrowdfundingProjectPageProps): Promise<Metadata> {
  const params = await paramsPromise;
  const { id } = params;
  
  const project = mockCrowdfundingProjects.find(p => p.id === id);

  if (!project) {
    return {
      title: 'Project Not Found | DeepVest Crowdfunding',
      description: 'The requested crowdfunding project was not found.',
    };
  }

  return {
    title: `${project.name} | DeepVest Crowdfunding`,
    description: project.description,
    keywords: `crowdfunding, investment, ${project.category}, ${project.name}, ${project.country}`,
  };
}

export async function generateStaticParams() {
  return mockCrowdfundingProjects.map((project) => ({
    id: project.id,
  }));
}

export default async function CrowdfundingProjectPage({ params: paramsPromise }: CrowdfundingProjectPageProps) {
  const params = await paramsPromise;
  const { id } = params;
  
  const project = mockCrowdfundingProjects.find(p => p.id === id);

  if (!project) {
    notFound();
  }

  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'var(--gray-1)',
      paddingTop: '80px',
      paddingBottom: '80px'
    }}>
      <CrowdfundingContent project={project} />
    </main>
  );
}
