'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Card, Flex, Text, Heading, Button, Grid, Spinner, Select } from '@radix-ui/themes';
import { CheckIcon, DashboardIcon } from '@radix-ui/react-icons';
import { useToastHelpers } from '@/components/layout/ToastProvider';

const fundingSchema = z.object({
  fundingGoal: z.number().nullable().optional(),
  currency: z.string().min(1, 'Currency is required'),
  investmentStage: z.string().optional(),
  timeline: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

type FundingFormData = z.infer<typeof fundingSchema>;

interface FundingSectionProps {
  initialData: {
    fundingGoal?: number;
    currency: string;
    investmentStage?: string;
    timeline: {
      startDate?: string;
      endDate?: string;
    };
  };
  projectId?: string; // Optional since not used yet
  onSave: (data: FundingFormData) => Promise<void>;
  isLoading?: boolean;
}

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
];

const investmentStages = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'series-c', label: 'Series C' },
  { value: 'series-d', label: 'Series D+' },
  { value: 'bridge', label: 'Bridge Round' },
  { value: 'ipo', label: 'IPO' },
  { value: 'acquisition', label: 'Acquisition' },
];

export function FundingSection({ initialData, onSave, isLoading = false }: FundingSectionProps) {
  const { success, error } = useToastHelpers();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<FundingFormData>({
    resolver: zodResolver(fundingSchema),
    defaultValues: {
      fundingGoal: initialData.fundingGoal || null,
      currency: initialData.currency || 'USD',
      investmentStage: initialData.investmentStage || undefined,
      timeline: {
        startDate: initialData.timeline?.startDate || '',
        endDate: initialData.timeline?.endDate || '',
      },
    },
  });

  const onSubmit = handleSubmit(async data => {
    try {
      await onSave(data);
      success('Funding information saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      error(errorMessage);
    }
  });

  const currency = watch('currency');

  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="2" mb="3">
            <DashboardIcon width="20" height="20" color="var(--blue-9)" />
            <Heading size="5">Funding Details</Heading>
          </Flex>

          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="5">
              {/* Funding Goal and Currency */}
              <Box>
                <Box
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--red-2)',
                    borderRadius: 'var(--radius-3)',
                    border: '1px solid var(--red-6)',
                  }}
                  mb="6"
                >
                  <Text
                    size="2"
                    color="red"
                    weight="medium"
                    style={{ display: 'block', textAlign: 'center' }}
                  >
                    🚧 This section is not yet implemented! 🚧
                  </Text>
                </Box>

                <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                  Funding Information
                </Text>
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Funding Goal
                    </Text>
                    <input
                      {...register('fundingGoal', {
                        setValueAs: v => (v === '' ? null : Number(v) || null),
                      })}
                      type="number"
                      placeholder="Enter funding goal"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-2)',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                    />
                    {errors.fundingGoal && (
                      <Text size="1" color="red" mt="1">
                        {errors.fundingGoal.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Currency
                    </Text>
                    <Select.Root
                      value={currency}
                      onValueChange={value => setValue('currency', value)}
                      disabled={isLoading}
                    >
                      <Select.Trigger style={{ width: '100%' }} />
                      <Select.Content>
                        {currencies.map(option => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.currency && (
                      <Text size="1" color="red" mt="1">
                        {errors.currency.message}
                      </Text>
                    )}
                  </Box>
                </Grid>
              </Box>

              {/* Investment Stage */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Investment Stage
                </Text>
                <Select.Root
                  value={watch('investmentStage') || undefined}
                  onValueChange={value => setValue('investmentStage', value)}
                  disabled={isLoading}
                >
                  <Select.Trigger style={{ width: '100%' }} placeholder="Select investment stage" />
                  <Select.Content>
                    {investmentStages.map(stage => (
                      <Select.Item key={stage.value} value={stage.value}>
                        {stage.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.investmentStage && (
                  <Text size="1" color="red" mt="1">
                    {errors.investmentStage.message}
                  </Text>
                )}
              </Box>

              {/* Timeline */}
              <Box>
                <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                  Funding Timeline
                </Text>
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Start Date
                    </Text>
                    <input
                      {...register('timeline.startDate')}
                      type="date"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-2)',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                    />
                    {errors.timeline?.startDate && (
                      <Text size="1" color="red" mt="1">
                        {errors.timeline.startDate.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      End Date
                    </Text>
                    <input
                      {...register('timeline.endDate')}
                      type="date"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-2)',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                    />
                    {errors.timeline?.endDate && (
                      <Text size="1" color="red" mt="1">
                        {errors.timeline.endDate.message}
                      </Text>
                    )}
                  </Box>
                </Grid>
              </Box>

              {/* Additional Information */}
              <Box
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--blue-2)',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--blue-6)',
                }}
              >
                <Text size="2" color="blue" weight="medium" mb="2" style={{ display: 'block' }}>
                  💡 Funding Tips
                </Text>
                <Flex direction="column" gap="1">
                  <Text size="2" color="blue">
                    • Be realistic with your funding goals and timeline
                  </Text>
                  <Text size="2" color="blue">
                    • Consider different funding sources (VCs, angels, grants)
                  </Text>
                  <Text size="2" color="blue">
                    • Prepare detailed financial projections and use of funds
                  </Text>
                  <Text size="2" color="blue">
                    • Update this information as your funding strategy evolves
                  </Text>
                </Flex>
              </Box>

              {/* Save Button */}
              <Flex justify="end" mt="4">
                <Button type="submit" disabled={!isDirty || isLoading} size="3" color="blue">
                  {isLoading && <Spinner mr="2" />}
                  <CheckIcon />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Flex>
      </Box>
    </Card>
  );
}
