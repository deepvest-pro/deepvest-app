'use client';

import { Text, Box, Flex, Separator, Progress, Tooltip } from '@radix-ui/themes';
import { StarIcon, CalendarIcon, RocketIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { ProjectScoring } from '@/types/supabase';
import { formatDate } from '@/lib/utils/format';
import { MarkdownViewer } from '@/components/ui';

interface ProjectScoringDetailsProps {
  scoring: ProjectScoring;
}

interface ScoringMetric {
  label: string;
  value: number | null;
  description: string;
  expandedDescription: string;
  icon: React.ReactNode;
}

export function ProjectScoringDetails({ scoring }: ProjectScoringDetailsProps) {
  const overallScore = scoring.score || 0;

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const metrics: ScoringMetric[] = [
    {
      label: 'Investment Rating',
      value: scoring.investment_rating,
      description: 'Overall investment attractiveness',
      expandedDescription:
        'Comprehensive evaluation of the investment opportunity including potential returns, market position, competitive advantages, scalability prospects, and overall attractiveness to investors. Considers risk-reward ratio and alignment with typical VC investment criteria.',
      icon: <StarIcon width="16" height="16" />,
    },
    {
      label: 'Market Potential',
      value: scoring.market_potential,
      description: 'Size and growth of target market',
      expandedDescription:
        'Assessment of the total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM). Evaluates market growth rate, accessibility, customer acquisition potential, and market timing for the product or service.',
      icon: <RocketIcon width="16" height="16" />,
    },
    {
      label: 'Team Competency',
      value: scoring.team_competency,
      description: 'Founding team skills and experience',
      expandedDescription:
        "Evaluation of the founding team's track record, relevant industry experience, technical capabilities, leadership qualities, team dynamics, and ability to execute the business plan. Includes assessment of team completeness and key skill gaps.",
      icon: <CalendarIcon width="16" height="16" />,
    },
    {
      label: 'Tech Innovation',
      value: scoring.tech_innovation,
      description: 'Technical differentiation level',
      expandedDescription:
        "Analysis of the technology's novelty, intellectual property potential, technical barriers to entry, competitive differentiation, scalability of the technology stack, and potential for creating sustainable competitive advantages through technology.",
      icon: <StarIcon width="16" height="16" />,
    },
    {
      label: 'Business Model',
      value: scoring.business_model,
      description: 'Revenue model viability',
      expandedDescription:
        "Assessment of the revenue model's clarity, diversity of revenue streams, pricing strategy, unit economics, path to profitability, scalability, and sustainability. Includes evaluation of monetization strategy and customer lifetime value.",
      icon: <RocketIcon width="16" height="16" />,
    },
    {
      label: 'Execution Risk',
      value: scoring.execution_risk,
      description: 'Implementation challenges (lower is better)',
      expandedDescription:
        'Evaluation of potential risks and challenges in executing the business plan including market risks, technical risks, regulatory hurdles, competitive threats, funding requirements, and operational challenges. Higher scores indicate lower risk levels.',
      icon: <CalendarIcon width="16" height="16" />,
    },
  ];

  return (
    <Box
      p="6"
      style={{
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        background: 'var(--gray-1)',
      }}
    >
      {/* Header */}
      <Flex align="center" justify="between" mb="4">
        <Flex align="center" gap="3">
          <StarIcon width="24" height="24" color="var(--orange-9)" />
          <Box>
            <Text size="5" weight="bold">
              Investment Scoring Analysis
            </Text>
            <Flex align="center" gap="2" mt="1">
              <Text size="2" color="gray">
                Generated on {formatDate(scoring.created_at)}
              </Text>
            </Flex>
          </Box>
        </Flex>

        <Box style={{ textAlign: 'right' }}>
          <Text size="2" weight="medium" color="gray" mb="1">
            Overall Score
          </Text>{' '}
          <Text size="8" weight="bold" color={getScoreColor(overallScore)}>
            {overallScore.toFixed(1)}
          </Text>
        </Box>
      </Flex>

      <Separator size="4" mb="4" />

      {/* Metrics Grid */}
      <Box mb="5">
        <Text size="4" weight="medium" mb="3">
          Detailed Metrics
        </Text>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {metrics.map((metric, index) => (
            <Box
              key={index}
              p="3"
              style={{
                border: '1px solid var(--gray-5)',
                borderRadius: 'var(--radius-2)',
                background: 'var(--color-background)',
              }}
            >
              <Flex align="center" justify="between" mb="2">
                <Flex align="center" gap="2">
                  {metric.icon}
                  <Text size="3" weight="medium">
                    {metric.label}
                  </Text>
                  <Tooltip content={metric.expandedDescription}>
                    <InfoCircledIcon
                      width="14"
                      height="14"
                      color="var(--gray-9)"
                      style={{ cursor: 'help' }}
                    />
                  </Tooltip>
                </Flex>
                <Text
                  size="4"
                  weight="bold"
                  color={
                    metric.label === 'Execution Risk'
                      ? getScoreColor(100 - (metric.value || 0))
                      : getScoreColor(metric.value || 0)
                  }
                >
                  {metric.value?.toFixed(1) || 'N/A'}
                </Text>
              </Flex>
              <Text size="2" color="gray" mb="2">
                {metric.description}
              </Text>
              {metric.value !== null && (
                <Progress
                  value={metric.value}
                  color={
                    metric.label === 'Execution Risk'
                      ? getScoreColor(100 - metric.value)
                      : getScoreColor(metric.value)
                  }
                  size="2"
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Analysis Summary */}
      {scoring.summary && (
        <Box mb="4">
          <Text size="4" weight="medium" mb="2">
            Analysis Summary
          </Text>
          <Box
            p="3"
            style={{
              border: '1px solid var(--gray-5)',
              borderRadius: 'var(--radius-2)',
              background: 'var(--color-background)',
            }}
          >
            <MarkdownViewer
              content={scoring.summary}
              style={{
                padding: 0,
                backgroundColor: 'transparent',
                fontSize: 'var(--font-size-3)',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Research Notes */}
      {scoring.research && (
        <Box>
          <Text size="4" weight="medium" mb="2">
            Research Notes
          </Text>
          <Box
            p="3"
            style={{
              border: '1px solid var(--gray-5)',
              borderRadius: 'var(--radius-2)',
              background: 'var(--color-background)',
            }}
          >
            <MarkdownViewer
              content={scoring.research}
              style={{
                padding: 0,
                backgroundColor: 'transparent',
                fontSize: 'var(--font-size-3)',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
