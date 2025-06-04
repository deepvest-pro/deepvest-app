'use client';

import { Button, Text, Box, Flex } from '@radix-ui/themes';
import { StarIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { ProjectScoring } from '@/types/supabase';

interface ProjectScoringBriefProps {
  scoring: ProjectScoring;
  onMoreDetails: () => void;
}

export function ProjectScoringBrief({ scoring, onMoreDetails }: ProjectScoringBriefProps) {
  const overallScore = scoring.score || 0;

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <Box
      p="4"
      style={{
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        background: 'var(--gray-1)',
      }}
    >
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="3">
          <StarIcon width="20" height="20" color="var(--orange-9)" />
          <Box>
            <Text size="2" weight="medium" color="gray">
              Investment Score
            </Text>
            <Flex align="center" gap="2" mt="1">
              <Text size="6" weight="bold" color={scoreColor}>
                {overallScore.toFixed(1)}
              </Text>
              <Text size="2" color="gray">
                / 100
              </Text>
            </Flex>
          </Box>
        </Flex>

        <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={onMoreDetails}
          style={{ cursor: 'pointer' }}
        >
          <ChevronDownIcon />
          More about scoring
        </Button>
      </Flex>
    </Box>
  );
}
