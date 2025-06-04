'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import type { UserData } from '@/types/auth';
import { SignOutButton } from '@/components/auth';
import styles from './MobileMenu.module.scss';

interface MobileMenuProps {
  userData: UserData | null;
  isAuthenticated: boolean;
}

export function MobileMenu({ userData, isAuthenticated }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Toggle body scroll lock
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    // Restore body scroll
    document.body.style.overflow = '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="3"
        onClick={toggleMenu}
        className={`${styles.mobileMenuButton} mobile-menu-button`}
      >
        {isOpen ? (
          <Cross1Icon width="20" height="20" />
        ) : (
          <HamburgerMenuIcon width="20" height="20" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <Box className={`${styles.mobileMenuOverlay} mobile-menu-overlay`} onClick={closeMenu} />
      )}

      {/* Mobile Menu Content */}
      <Box
        className={`${styles.mobileMenuContent} ${isOpen ? styles.open : styles.closed} mobile-menu-content`}
      >
        <Flex direction="column" gap="4" className={styles.menuContainer}>
          {/* Header */}
          <Flex justify="between" align="center" p="4" className={styles.menuHeader}>
            <Flex gap="2" align="center">
              <Image
                src="/images/logo.svg"
                alt="DeepVest Logo"
                width={24}
                height={18}
                style={{ flexShrink: 0 }}
              />
              <Text weight="bold" size="4" className={styles.brandText}>
                DeepVest
              </Text>
            </Flex>
            <Button variant="ghost" size="2" onClick={closeMenu} className={styles.closeButton}>
              <Cross1Icon width="16" height="16" />
            </Button>
          </Flex>

          {/* Navigation Links */}
          <Flex direction="column" gap="2">
            <Link href="/projects" onClick={closeMenu}>
              <Box className={styles.navLink}>
                <Text weight="medium" size="3" className={styles.navLinkText}>
                  Projects
                </Text>
              </Box>
            </Link>

            <Link href="/leaderboard" onClick={closeMenu}>
              <Box className={styles.navLink}>
                <Text weight="medium" size="3" className={styles.navLinkText}>
                  Leaderboard
                </Text>
              </Box>
            </Link>

            <Link href="/crowdfunding" onClick={closeMenu}>
              <Box className={styles.navLink}>
                <Text weight="medium" size="3" className={styles.navLinkText}>
                  Crowdfunding
                </Text>
              </Box>
            </Link>

            {isAuthenticated && (
              <Link href="/profile" onClick={closeMenu}>
                <Box className={styles.navLink}>
                  <Text weight="medium" size="3" className={styles.navLinkText}>
                    Profile
                  </Text>
                </Box>
              </Link>
            )}
          </Flex>

          {/* Auth Section */}
          <Box p="4" className={styles.authSection}>
            {isAuthenticated ? (
              <Flex direction="column" gap="4">
                {userData?.profile && (
                  <Box className={styles.userInfo}>
                    <Text size="2" weight="medium" className={styles.userName}>
                      {userData.profile.nickname || 'User'}
                    </Text>
                    <Text size="1" className={styles.userEmail}>
                      {userData.user.email}
                    </Text>
                  </Box>
                )}
                <SignOutButton variant="outline" className="w-full" />
              </Flex>
            ) : (
              <Flex direction="column" gap="3">
                <Link href="/auth/sign-in" onClick={closeMenu}>
                  <Button variant="ghost" color="green" size="3" className={styles.authButton}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up" onClick={closeMenu}>
                  <Button
                    color="green"
                    size="3"
                    className={`${styles.authButton} ${styles.signUpButton}`}
                  >
                    Sign Up
                  </Button>
                </Link>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
