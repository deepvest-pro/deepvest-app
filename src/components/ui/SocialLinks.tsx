/**
 * Reusable component for displaying social media links
 */

import Link from 'next/link';
import { Flex, Button } from '@radix-ui/themes';
import {
  GitHubLogoIcon,
  GlobeIcon,
  TwitterLogoIcon,
  LinkedInLogoIcon,
} from '@radix-ui/react-icons';
import { generateSocialLinks, type SocialLink } from '@/lib/utils/social';
import { formatUrl } from '@/lib/utils/format';

interface SocialLinksProps {
  data: {
    x_url?: string | null;
    github_url?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
  };
  size?: '1' | '2' | '3' | '4';
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  color?: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple';
  showLabels?: boolean;
  className?: string;
}

const iconMap = {
  TwitterLogoIcon: TwitterLogoIcon,
  GitHubLogoIcon: GitHubLogoIcon,
  LinkedInLogoIcon: LinkedInLogoIcon,
  GlobeIcon: GlobeIcon,
};

export function SocialLinks({
  data,
  size = '2',
  variant = 'soft',
  color = 'gray',
  showLabels = false,
  className,
}: SocialLinksProps) {
  const socialLinks = generateSocialLinks(data);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <Flex gap="2" wrap="wrap" className={className}>
      {socialLinks.map((link: SocialLink) => {
        const IconComponent = iconMap[link.icon as keyof typeof iconMap];

        return (
          <Link
            key={link.type}
            href={formatUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <Button variant={variant} color={color} size={size} style={{ cursor: 'pointer' }}>
              {IconComponent && <IconComponent />}
              {showLabels && link.label}
            </Button>
          </Link>
        );
      })}
    </Flex>
  );
}

/**
 * Compact version for inline display
 */
export function SocialLinksInline({
  data,
  className,
}: Pick<SocialLinksProps, 'data' | 'className'>) {
  return (
    <SocialLinks
      data={data}
      size="1"
      variant="ghost"
      color="gray"
      showLabels={false}
      className={className}
    />
  );
}

/**
 * Card version with labels
 */
export function SocialLinksCard({ data, className }: Pick<SocialLinksProps, 'data' | 'className'>) {
  return (
    <SocialLinks
      data={data}
      size="2"
      variant="soft"
      color="blue"
      showLabels={true}
      className={className}
    />
  );
}
