'use client';

import { Box, Heading, Flex, Text, Avatar, Card, Badge } from '@radix-ui/themes';
import { PersonIcon, StarIcon } from '@radix-ui/react-icons';
import { TeamMember } from '@/types/supabase';
import { formatDate, getInitials } from '@/lib/utils/format';
import { TeamMemberStatusBadge } from '@/components/ui/StatusBadge';
import { SocialLinksInline } from '@/components/ui/SocialLinks';

interface ProjectTeamProps {
  teamMembers: TeamMember[];
}

export function ProjectTeam({ teamMembers }: ProjectTeamProps) {
  if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    return (
      <Box>
        <Heading size="4" mb="3">
          Team
        </Heading>
        <Card size="3">
          <Flex direction="column" align="center" gap="3" p="6">
            <PersonIcon width="32" height="32" style={{ color: 'var(--gray-9)' }} />
            <Text size="3" color="gray" align="center">
              No team members available for this project.
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="4" mb="4">
        Team ({teamMembers.length})
      </Heading>

      <Flex direction="column" gap="3">
        {teamMembers.map(member => (
          <Card key={member.id} size="3" className="team-member-card">
            <Flex gap="4" align="start">
              {/* Avatar */}
              <Avatar
                size="5"
                src={member.image_url || undefined}
                alt={member.name}
                radius="full"
                fallback={getInitials(member.name)}
              />

              {/* Member Info */}
              <Box style={{ flex: 1 }}>
                <Flex justify="between" align="start" mb="2">
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Text size="4" weight="bold">
                        {member.name}
                      </Text>
                      {member.is_founder && (
                        <Badge color="gold" size="1" variant="soft">
                          <StarIcon width="12" height="12" />
                          Founder
                        </Badge>
                      )}
                    </Flex>

                    {/* Positions */}
                    {member.positions && member.positions.length > 0 && (
                      <Flex gap="1" wrap="wrap" mb="2">
                        {member.positions.map((position, index) => (
                          <Badge key={index} color="blue" size="1" variant="soft">
                            {position}
                          </Badge>
                        ))}
                      </Flex>
                    )}

                    {/* Equity */}
                    {member.equity_percent && (
                      <Text size="2" color="gray" mb="2">
                        Equity: {member.equity_percent}%
                      </Text>
                    )}

                    {/* Social Links */}
                    <SocialLinksInline
                      data={{
                        x_url: member.x_url,
                        github_url: member.github_url,
                        linkedin_url: member.linkedin_url,
                        website_url: null,
                      }}
                    />
                  </Box>

                  {/* Status and Join Date */}
                  <Flex direction="column" align="end" gap="2">
                    <TeamMemberStatusBadge status={member.status} />
                    {member.joined_at && (
                      <Text size="1" color="gray">
                        Joined {formatDate(member.joined_at)}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}
