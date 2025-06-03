'use client';

import Link from 'next/link';
import { Flex, Box, Text, Avatar, Button } from '@radix-ui/themes';
import { UserData } from '@/types/auth';
import { SignOutButton } from '@/components/auth/sign-out-button';

interface NavBarContentProps {
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

export function NavBarContent({ userData, isAuthenticated }: NavBarContentProps) {
  return (
    <Box style={{ borderBottom: '1px solid var(--gray-5)' }}>
      <Flex
        px="4"
        py="3"
        justify="between"
        align="center"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        <Link href="/">
          <span className="inline-block">
            <Text weight="bold" size="5" color="blue">
              DeepVest
            </Text>
          </span>
        </Link>

        <Flex gap="6" align="center">
          <Link href="/projects">
            <span className="inline-block">
              <Text color="gray">Projects</Text>
            </span>
          </Link>
          <Link href="/explore">
            <span className="inline-block">
              <Text color="gray">Explore</Text>
            </span>
          </Link>
          <Link href="/about">
            <span className="inline-block">
              <Text color="gray">About</Text>
            </span>
          </Link>

          {isAuthenticated ? (
            <Flex gap="4" align="center">
              <Link href="/account">
                <span className="inline-block">
                  <Flex gap="2" align="center">
                    {userData?.profile?.avatar_url ? (
                      <Avatar
                        src={userData.profile.avatar_url}
                        alt="Profile"
                        radius="full"
                        size="2"
                        fallback="?"
                      />
                    ) : (
                      <Avatar
                        color="blue"
                        radius="full"
                        size="2"
                        fallback={
                          userData?.profile?.full_name?.[0] || userData?.user.email?.[0] || '?'
                        }
                      />
                    )}
                    <Text>{userData?.profile?.nickname || 'Account'}</Text>
                  </Flex>
                </span>
              </Link>
              <SignOutButton variant="outline" />
            </Flex>
          ) : (
            <Flex gap="2" align="center">
              <Link href="/auth/sign-in">
                <span className="inline-block">
                  <Button variant="soft" color="blue">
                    Sign In
                  </Button>
                </span>
              </Link>
              <Link href="/auth/sign-up">
                <span className="inline-block">
                  <Button color="blue">Sign Up</Button>
                </span>
              </Link>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
