/**
 * Utility functions for social media links
 */

export interface SocialLink {
  type: 'x' | 'github' | 'linkedin' | 'website';
  url: string;
  label: string;
  icon: string; // Icon name for Radix UI
}

/**
 * Generate social links from team member or user data
 */
export const generateSocialLinks = (data: {
  x_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}): SocialLink[] => {
  const links: SocialLink[] = [];

  if (data.x_url) {
    links.push({
      type: 'x',
      url: data.x_url,
      label: 'X (Twitter)',
      icon: 'TwitterLogoIcon',
    });
  }

  if (data.github_url) {
    links.push({
      type: 'github',
      url: data.github_url,
      label: 'GitHub',
      icon: 'GitHubLogoIcon',
    });
  }

  if (data.linkedin_url) {
    links.push({
      type: 'linkedin',
      url: data.linkedin_url,
      label: 'LinkedIn',
      icon: 'LinkedInLogoIcon',
    });
  }

  if (data.website_url) {
    links.push({
      type: 'website',
      url: data.website_url,
      label: 'Website',
      icon: 'GlobeIcon',
    });
  }

  return links;
};

/**
 * Validate social media URL format
 */
export const validateSocialUrl = (url: string, type: 'x' | 'github' | 'linkedin'): boolean => {
  if (!url) return true; // Empty is valid

  const patterns = {
    x: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
    github: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
  };

  return patterns[type].test(url);
};

/**
 * Extract username from social media URL
 */
export const extractUsername = (url: string, type: 'x' | 'github' | 'linkedin'): string => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (type) {
      case 'x':
        return pathname.replace(/^\//, '').replace(/\/$/, '');
      case 'github':
        return pathname.replace(/^\//, '').replace(/\/$/, '');
      case 'linkedin':
        return pathname.replace(/^\/in\//, '').replace(/\/$/, '');
      default:
        return '';
    }
  } catch {
    return '';
  }
};

/**
 * Generate social media URL from username
 */
export const generateSocialUrl = (username: string, type: 'x' | 'github' | 'linkedin'): string => {
  if (!username) return '';

  const baseUrls = {
    x: 'https://x.com/',
    github: 'https://github.com/',
    linkedin: 'https://linkedin.com/in/',
  };

  return baseUrls[type] + username;
};
