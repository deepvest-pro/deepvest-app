'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Avatar,
  Card,
  Grid,
  Button,
  Separator,
  AspectRatio,
  Badge,
  Section,
} from '@radix-ui/themes';
import {
  InfoCircledIcon,
  Pencil1Icon,
  GlobeIcon,
  LinkedInLogoIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
  PersonIcon,
  SizeIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons';
import { UserData } from '@/types/auth';

interface ProfileContentProps {
  userData: UserData | null;
}

export function ProfileContent({ userData }: ProfileContentProps) {
  if (!userData) {
    return (
      <Container size="3" py="9">
        <Card size="3">
          <Flex direction="column" align="center" justify="center" gap="4" p="6">
            <SizeIcon width="40" height="40" color="var(--gray-9)" />
            <Heading size="5" align="center">
              Profile Not Found
            </Heading>
            <Text color="gray" align="center">
              Your profile information could not be loaded.
            </Text>
            <Link href="/auth/sign-in" passHref>
              <Button color="blue" highContrast size="3">
                Sign In
              </Button>
            </Link>
          </Flex>
        </Card>
      </Container>
    );
  }

  const { user, profile } = userData;

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container>
      {/* Cover Image */}
      <Box position="relative" mb="8">
        <AspectRatio ratio={16 / 6} style={{ maxHeight: '300px', borderRadius: 'var(--radius-3)' }}>
          {profile?.cover_url ? (
            <Image
              src={profile.cover_url}
              alt="Profile cover"
              fill
              style={{ objectFit: 'cover', borderRadius: 'var(--radius-3)' }}
              priority
            />
          ) : (
            <Box
              style={{
                background: 'linear-gradient(135deg, var(--accent-9), var(--accent-10))',
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-3)',
              }}
            />
          )}
        </AspectRatio>
      </Box>

      <Grid columns={{ initial: '1', md: '4' }} gap="6">
        {/* Left Column - Profile Info */}
        <Box style={{ gridColumn: 'span 1' }}>
          <Flex direction="column" gap="4" align="center">
            {/* Avatar */}
            <Box
              style={{
                margin: '-80px 0 0',
                padding: '4px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-3)',
              }}
            >
              <Avatar
                size="8"
                src={profile?.avatar_url || undefined}
                alt="Profile Avatar"
                radius="full"
                fallback={profile?.full_name?.[0] || user.email?.[0] || '?'}
                style={{ width: '160px', height: '160px' }}
              />
            </Box>

            {/* User Details Card */}
            <Card style={{ width: '100%' }}>
              <Flex direction="column" gap="3">
                {/* Account Details */}
                <Heading size="3">Account Details</Heading>
                <Flex direction="column" gap="1">
                  <Flex justify="between">
                    <Text weight="medium">Email</Text>
                    <Text>{user.email}</Text>
                  </Flex>

                  {user.email_confirmed_at ? (
                    <Flex gap="2" align="center">
                      <CheckCircledIcon color="var(--green-9)" />
                      <Text size="2">Verified on {formatDate(user.email_confirmed_at)}</Text>
                    </Flex>
                  ) : (
                    <Text size="2" color="gray">
                      Email not yet verified
                    </Text>
                  )}
                </Flex>

                <Separator my="2" />

                {/* Actions */}
                <Link href="/profile/edit" passHref>
                  <Button color="blue" size="2" style={{ width: '100%' }}>
                    <Pencil1Icon />
                    Edit Profile
                  </Button>
                </Link>
              </Flex>
            </Card>

            {/* Social Links Card */}
            {(profile?.website_url ||
              profile?.x_username ||
              profile?.linkedin_username ||
              profile?.github_username) && (
              <Card style={{ width: '100%' }}>
                <Heading size="3" mb="3">
                  Connect
                </Heading>
                <Flex direction="column" gap="2">
                  {profile?.website_url && (
                    <Link
                      href={
                        profile.website_url.startsWith('http')
                          ? profile.website_url
                          : `https://${profile.website_url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <GlobeIcon />
                        Website
                      </Button>
                    </Link>
                  )}
                  {profile?.x_username && (
                    <Link
                      href={`https://x.com/${profile.x_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <TwitterLogoIcon />
                        Twitter
                      </Button>
                    </Link>
                  )}
                  {profile?.linkedin_username && (
                    <Link
                      href={`https://linkedin.com/in/${profile.linkedin_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <LinkedInLogoIcon />
                        LinkedIn
                      </Button>
                    </Link>
                  )}
                  {profile?.github_username && (
                    <Link
                      href={`https://github.com/${profile.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <GitHubLogoIcon />
                        GitHub
                      </Button>
                    </Link>
                  )}
                </Flex>
              </Card>
            )}
          </Flex>
        </Box>

        {/* Right Column - Profile Content */}
        <Box style={{ gridColumn: 'span 3' }}>
          <Card mb="6">
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Flex align="center" gap="2">
                  <Heading size="7">{profile?.full_name || 'No Name Set'}</Heading>
                  {user.email_confirmed_at && (
                    <Badge color="blue" size="1" variant="soft" radius="full">
                      <Flex gap="1" align="center">
                        <CheckCircledIcon />
                        <Text>Verified</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>

                <Text size="3" color="gray">
                  @{profile?.nickname || 'user'}
                </Text>

                <Flex mt="2" gap="3" wrap="wrap">
                  {profile?.country && profile?.city && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <PersonIcon />
                        <Text>
                          {profile.city}, {profile.country}
                        </Text>
                      </Flex>
                    </Badge>
                  )}

                  {user.created_at && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <InfoCircledIcon />
                        <Text>Joined {formatDate(user.created_at)}</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>
              </Flex>

              {profile?.bio && (
                <Box>
                  <Separator my="3" />
                  <Text size="2">{profile.bio}</Text>
                </Box>
              )}
            </Flex>
          </Card>

          {/* Professional Background */}
          {profile?.professional_background && (
            <Section mb="6">
              <Card>
                <Heading size="5" mb="3">
                  Professional Background
                </Heading>
                <Text size="2">{profile.professional_background}</Text>
              </Card>
            </Section>
          )}
        </Box>
      </Grid>
    </Container>
  );
}
