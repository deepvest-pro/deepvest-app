'use client';

import { Flex, Text, Box } from '@radix-ui/themes';
import { UserData } from '@/types/auth';

interface AuthStatusContentProps {
  userData: UserData | null;
}

export function AuthStatusContent({ userData }: AuthStatusContentProps) {
  if (!userData) {
    return (
      <Text size="2" color="gray">
        Not signed in
      </Text>
    );
  }

  return (
    <Flex align="center" gap="2">
      <Text size="2" weight="medium">
        {userData.profile?.full_name || userData.user.email}
      </Text>
      <Box
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--green-9)',
        }}
      />
    </Flex>
  );
}
