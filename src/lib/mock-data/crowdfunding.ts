import type { CrowdfundingProject, CrowdfundingStats } from '@/types/crowdfunding';

export const mockCrowdfundingProjects: CrowdfundingProject[] = [
  {
    id: 'twype',
    name: 'Twype',
    description: 'Grow with us!',
    logoUrl:
      'https://vdalyzcwxoxtsxueqgir.supabase.co/storage/v1/object/public/project-files/460d5c6a-075d-4fa5-bdf2-70c7ee5bf02c/logo_1748334002021.png',
    bannerUrl:
      'https://vdalyzcwxoxtsxueqgir.supabase.co/storage/v1/object/public/project-files/460d5c6a-075d-4fa5-bdf2-70c7ee5bf02c/banner_1748333984082.jpeg',
    country: 'Bosnia and Herzegovina',
    category: 'Sports',
    raised: 6600,
    target: 10000,
    investors: 1472,
    daysLeft: 28,
    percentage: 66,
    status: 'active',
    foundedYear: 2016,
    website: 'https://hashtagunited.com',
    socialLinks: {
      twitter: 'https://twitter.com/hashtagutd',
      linkedin: 'https://linkedin.com/company/hashtag-united',
    },
    team: [
      {
        id: '1',
        name: 'Spencer Owen',
        role: 'Founder & Chairman',
        avatar: '/images/team/spencer-owen.jpg',
      },
      {
        id: '2',
        name: 'Jay Cartwright',
        role: 'CEO',
        avatar: '/images/team/jay-cartwright.jpg',
      },
    ],
    fullDescription:
      'Hashtag United is a revolutionary football club that started as a YouTube channel and has grown into a real football team. We are now seeking investment to secure our own ground and establish permanent roots in the football community.',
    highlights: [
      'Over 1M YouTube subscribers',
      'Professional football team in the Isthmian League',
      'Strong community engagement',
      'Innovative digital-first approach',
    ],
    roadmap: [
      {
        title: 'Secure Ground',
        description: 'Purchase and develop our own football stadium',
        completed: false,
        date: '2024 Q2',
      },
      {
        title: 'Youth Academy',
        description: 'Establish professional youth development program',
        completed: false,
        date: '2024 Q3',
      },
    ],
    metrics: [
      { label: 'YouTube Subscribers', value: '1.2M', icon: 'users' },
      { label: 'Match Attendance', value: '2,500', icon: 'eye' },
      { label: 'Years Active', value: '8', icon: 'calendar' },
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'tonpass',
    name: 'Tonpass',
    description:
      'CAESL develops inventive products, including TASHEX, a smart solar add-on, & provides NetZero consultancy',
    logoUrl: '/projects/tonpass/logo.png',
    bannerUrl: '/projects/tonpass/tickets_cover.jpg',
    country: 'Serbia',
    category: 'CleanTech',
    raised: 2500,
    target: 4000,
    investors: 50,
    daysLeft: 28,
    percentage: 63,
    status: 'active',
    foundedYear: 2019,
    website: 'https://caesl.com',
    socialLinks: {
      twitter: 'https://twitter.com/caesl',
      linkedin: 'https://linkedin.com/company/caesl',
    },
    team: [
      {
        id: '1',
        name: 'Dr. Sarah Chen',
        role: 'CEO & Founder',
        avatar: '/images/team/sarah-chen.jpg',
      },
      {
        id: '2',
        name: 'Michael Rodriguez',
        role: 'CTO',
        avatar: '/images/team/michael-rodriguez.jpg',
      },
    ],
    fullDescription:
      'CAESL is at the forefront of clean energy innovation, developing smart solar solutions that maximize efficiency and reduce costs. Our flagship product TASHEX revolutionizes solar energy management.',
    highlights: [
      '40% increase in solar efficiency',
      'Patent-pending technology',
      'Partnerships with major energy companies',
      'Award-winning innovation team',
    ],
    roadmap: [
      {
        title: 'Product Launch',
        description: 'Commercial launch of TASHEX system',
        completed: true,
        date: '2023 Q4',
      },
      {
        title: 'Scale Production',
        description: 'Increase manufacturing capacity',
        completed: false,
        date: '2024 Q2',
      },
    ],
    metrics: [
      { label: 'Energy Saved', value: '2.5GWh', icon: 'lightning' },
      { label: 'Installations', value: '150+', icon: 'home' },
      { label: 'Patents', value: '3', icon: 'shield' },
    ],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: 'langear',
    name: 'Langear',
    description:
      'Langear automatically detects, translates, and releases your translated content - with no dev work required.',
    logoUrl: '/projects/langear/logo.png',
    bannerUrl: '/projects/langear/cover.png',
    country: 'Montenegro',
    category: 'Food & Beverage',
    raised: 8500,
    target: 8000,
    investors: 270,
    daysLeft: 22,
    percentage: 106,
    status: 'funded',
    foundedYear: 2017,
    website: 'https://barradistillers.com',
    socialLinks: {
      twitter: 'https://twitter.com/barradistillers',
      linkedin: 'https://linkedin.com/company/barra-distillers',
    },
    team: [
      {
        id: '1',
        name: 'Hamish MacLeod',
        role: 'Master Distiller',
        avatar: '/images/team/hamish-macleod.jpg',
      },
      {
        id: '2',
        name: 'Fiona Campbell',
        role: 'Operations Director',
        avatar: '/images/team/fiona-campbell.jpg',
      },
    ],
    fullDescription:
      "Isle of Barra Distillers brings the spirit of the Scottish Hebrides to life through exceptional craft spirits. Our award-winning gin has gained international recognition, and we are now expanding to produce the island's first whisky.",
    highlights: [
      'Award-winning craft gin',
      'Sustainable island production',
      'International distribution',
      'First whisky distillery on Barra',
    ],
    roadmap: [
      {
        title: 'Whisky Production',
        description: 'Launch whisky distillation operations',
        completed: false,
        date: '2024 Q1',
      },
      {
        title: 'Visitor Center',
        description: 'Open distillery tours and tasting room',
        completed: false,
        date: '2024 Q3',
      },
    ],
    metrics: [
      { label: 'Awards Won', value: '12', icon: 'trophy' },
      { label: 'Countries', value: '15', icon: 'globe' },
      { label: 'Bottles Sold', value: '50K+', icon: 'package' },
    ],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
];

export const mockCrowdfundingStats: CrowdfundingStats = {
  totalProjects: 156,
  totalRaised: 45200,
  totalInvestors: 8750,
  successRate: 78,
};
