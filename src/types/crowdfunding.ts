export interface CrowdfundingProject {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  country: string;
  category: string;
  
  // Funding details
  raised: number;
  target: number;
  investors: number;
  daysLeft: number;
  
  // Progress
  percentage: number;
  
  // Status
  status: 'active' | 'funded' | 'ended';
  
  // Additional info
  foundedYear?: number;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  
  // Team
  team?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  
  // Detailed info for project page
  fullDescription?: string;
  highlights?: string[];
  roadmap?: {
    title: string;
    description: string;
    completed: boolean;
    date?: string;
  }[];
  
  // Metrics for project page
  metrics?: {
    label: string;
    value: string;
    icon?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CrowdfundingStats {
  totalProjects: number;
  totalRaised: number;
  totalInvestors: number;
  successRate: number;
}
