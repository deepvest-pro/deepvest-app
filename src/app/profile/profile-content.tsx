'use client';

import Link from 'next/link';
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
} from '@radix-ui/themes';
import { UserData } from '@/types/auth';

interface ProfileContentProps {
  userData: UserData | null;
}

export function ProfileContent({ userData }: ProfileContentProps) {
  if (!userData) {
    return null; // This shouldn't happen due to ProtectedRoute, but TypeScript needs it
  }

  const { user, profile } = userData;

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        <Heading size="8" mb="2">
          Your Profile
        </Heading>

        <Card>
          <Flex gap="4" align="center" mb="4">
            {profile?.avatar_url ? (
              <Avatar
                size="5"
                src={profile.avatar_url}
                alt="Profile"
                radius="full"
                fallback={profile?.full_name?.[0] || user.email?.[0] || '?'}
              />
            ) : (
              <Avatar
                size="5"
                color="blue"
                radius="full"
                fallback={profile?.full_name?.[0] || user.email?.[0] || '?'}
              />
            )}

            <Box>
              <Heading size="5" mb="1">
                {profile?.full_name || 'No Name Set'}
              </Heading>
              <Text size="3" color="gray">
                @{profile?.nickname || 'user'}
              </Text>
            </Box>
          </Flex>
        </Card>

        <Grid columns={{ initial: '1', md: '2' }} gap="6">
          <Card>
            <Heading size="4" mb="4">
              Profile Information
            </Heading>
            <Flex direction="column" gap="3">
              <Flex justify="between">
                <Text weight="medium">Email</Text>
                <Text>{user.email}</Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text weight="medium">Profile Created</Text>
                <Text>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text weight="medium">Email Verified</Text>
                <Text>{user.email_confirmed_at ? 'Yes' : 'No'}</Text>
              </Flex>
            </Flex>
          </Card>

          <Card>
            <Heading size="4" mb="4">
              Profile Information
            </Heading>
            <Flex direction="column" gap="3">
              <Flex justify="between">
                <Text weight="medium">Professional Background</Text>
                <Text>{profile?.professional_background || 'Not provided'}</Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text weight="medium">Location</Text>
                <Text>
                  {profile?.city && profile?.country
                    ? `${profile.city}, ${profile.country}`
                    : 'Not provided'}
                </Text>
              </Flex>
              <Separator size="4" />
              <Box>
                <Text weight="medium" mb="2">
                  Bio
                </Text>
                <Text>{profile?.bio || 'No bio provided'}</Text>
              </Box>
            </Flex>
          </Card>
        </Grid>

        <Flex justify="center" mt="4">
          <Link href="/profile/edit">
            <Button size="3" color="blue">
              Edit Profile
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Container>
  );
}
