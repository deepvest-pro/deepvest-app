'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Button, Text } from '@radix-ui/themes';

interface LeaderboardPaginationProps {
  currentPage: number;
  hasMore: boolean;
  totalShown: number;
  offset: number;
}

export function LeaderboardPagination({
  currentPage,
  hasMore,
  totalShown,
  offset,
}: LeaderboardPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);

    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }

    router.push(`/leaderboard?${params.toString()}`);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigateToPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      navigateToPage(currentPage + 1);
    }
  };

  return (
    <Flex
      justify="between"
      align="center"
      mt="6"
      pt="4"
      style={{ borderTop: '1px solid var(--gray-6)' }}
    >
      <Button variant="soft" disabled={currentPage <= 1} onClick={handlePrevious}>
        Previous
      </Button>

      <Flex direction="column" align="center" gap="1">
        <Text size="2" color="gray">
          Page {currentPage}
        </Text>
        <Text size="1" color="gray">
          Showing {offset + 1}-{offset + totalShown} results
          {hasMore && ' • More available'}
        </Text>
      </Flex>

      <Button variant="soft" disabled={!hasMore} onClick={handleNext}>
        Next
      </Button>
    </Flex>
  );
}
