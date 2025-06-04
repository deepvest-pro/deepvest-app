'use client';

import React from 'react';
import Image from 'next/image';
import { Flex, Text } from '@radix-ui/themes';
import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';
import styles from './Footer.module.scss';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: GitHubLogoIcon,
      href: 'https://github.com',
      label: 'GitHub',
    },
    {
      icon: TwitterLogoIcon,
      href: 'https://twitter.com',
      label: 'Twitter',
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Brand Section */}
          <Flex align="center" gap="2" className={styles.brandSection}>
            <Image
              src="/images/logo.svg"
              alt="DeepVest Logo"
              width={24}
              height={18}
              className={styles.logo}
            />
            <Text size="3" className={styles.brandText}>
              DeepVest
            </Text>
          </Flex>

          {/* Copyright */}
          <Text size="2" className={styles.copyright}>
            © {currentYear} DeepVest. All rights reserved.
          </Text>

          {/* Social Links */}
          <Flex gap="3" align="center" className={styles.socialLinks}>
            {socialLinks.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={link.label}
                >
                  <Icon width="16" height="16" />
                </a>
              );
            })}
          </Flex>
        </div>
      </div>
    </footer>
  );
}
