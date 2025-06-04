'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flex, Box, Text, Avatar, Button } from '@radix-ui/themes';
import { UserData } from '@/types/auth';
import { SignOutButton } from '@/components/auth';
import { MobileMenu } from '../MobileMenu/MobileMenu';

interface NavBarContentProps {
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

export function NavBarContent({ userData, isAuthenticated }: NavBarContentProps) {
  return (
    <Box
      style={{
        borderBottom: '1px solid var(--gray-5)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Flex
        px="6"
        py="4"
        justify="between"
        align="center"
        style={{ maxWidth: '1400px', margin: '0 auto' }}
      >
        <Link href="/">
          <span className="inline-block">
            <Flex gap="1" align="center">
              <Image
                src="/images/logo.svg"
                alt="DeepVest Logo"
                width={32}
                height={24}
                style={{ flexShrink: 0 }}
              />
              <Text
                weight="bold"
                size="6"
                style={{
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                DeepVest
              </Text>
            </Flex>
          </span>
        </Link>

        <Flex gap="4" align="center">
          {/* Desktop Navigation Links */}
          <Flex gap="8" mr="6" align="center" className="desktop-nav-links">
            <Link href="/projects">
              <span className="inline-block">
                <Text
                  weight="medium"
                  size="3"
                  style={{
                    color: 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                    cursor: 'pointer',
                  }}
                  className="hover:text-[var(--flow-green)]"
                >
                  Projects
                </Text>
              </span>
            </Link>
            <Link href="/leaderboard">
              <span className="inline-block">
                <Text
                  weight="medium"
                  size="3"
                  style={{
                    color: 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                    cursor: 'pointer',
                  }}
                  className="hover:text-[var(--flow-green)]"
                >
                  Leaderboard
                </Text>
              </span>
            </Link>
          </Flex>

          {isAuthenticated ? (
            <Flex gap="4" align="center">
              <Link href="/profile">
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
                    <Text className="desktop-nav-links">
                      {userData?.profile?.nickname || 'Profile'}
                    </Text>
                  </Flex>
                </span>
              </Link>
              <div className="desktop-nav-links">
                <SignOutButton variant="outline" />
              </div>
            </Flex>
          ) : (
            <Flex gap="3" align="center">
              <Link href="/auth/sign-in">
                <span className="inline-block">
                  <Button
                    variant="ghost"
                    color="green"
                    size="3"
                    style={{
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Sign In
                  </Button>
                </span>
              </Link>
              <Link href="/auth/sign-up">
                <span className="inline-block">
                  <Button
                    color="green"
                    size="3"
                    style={{
                      background: 'var(--gradient-accent)',
                      border: 'none',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0, 168, 107, 0.25)',
                    }}
                  >
                    Sign Up
                  </Button>
                </span>
              </Link>
            </Flex>
          )}

          {/* Mobile Menu */}
          <MobileMenu userData={userData} isAuthenticated={isAuthenticated} />
        </Flex>
      </Flex>
    </Box>
  );
}
