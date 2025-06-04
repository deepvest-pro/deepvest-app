'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Text, Select } from '@radix-ui/themes';

export function LeaderboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMinScore = searchParams.get('min_score') || 'all';

  const handleScoreFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === 'all') {
      params.delete('min_score');
    } else {
      params.set('min_score', value);
    }

    // Reset to first page when changing filters
    params.delete('page');

    router.push(`/leaderboard?${params.toString()}`);
  };

  return (
    <Flex align="center" gap="2">
      <Text size="2" color="gray">
        Min Score:
      </Text>
      <Select.Root value={currentMinScore} onValueChange={handleScoreFilterChange}>
        <Select.Trigger variant="soft" />
        <Select.Content>
          <Select.Item value="all">All projects</Select.Item>
          <Select.Item value="90">90+ points</Select.Item>
          <Select.Item value="80">80+ points</Select.Item>
          <Select.Item value="70">70+ points</Select.Item>
          <Select.Item value="60">60+ points</Select.Item>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
