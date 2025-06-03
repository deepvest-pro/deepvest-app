'use client';

import React from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextField,
  Flex,
  Text,
  Button,
  Card,
  Select,
  Box,
  IconButton,
  TextArea,
} from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';

// Helper type that we'll use for handling the Zod schema output
type ZodFormData = {
  fundingGoal: number | null | undefined;
  currency: string;
  timeline: {
    startDate?: string;
    endDate?: string;
  };
  milestones: Array<{
    title: string;
    description: string;
    targetDate?: string;
    status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  }>;
};

// Define the schema for funding details
const projectFundingDetailsSchema = z.object({
  fundingGoal: z.number().nullable().optional(),
  currency: z.string().default('USD'),
  timeline: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3, 'Title must be at least 3 characters'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        targetDate: z.string().optional(),
        status: z
          .enum(['planned', 'in_progress', 'completed', 'delayed', 'cancelled'])
          .default('planned'),
      }),
    )
    .default([]),
});

export type ProjectFundingDetailsFormData = z.infer<typeof projectFundingDetailsSchema>;

interface ProjectFundingDetailsStepProps {
  onSubmit: (data: ProjectFundingDetailsFormData) => void;
  initialData?: Partial<ProjectFundingDetailsFormData>;
  isSubmitting?: boolean;
}

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ProjectFundingDetailsStep({
  onSubmit,
  initialData = {},
  isSubmitting = false,
}: ProjectFundingDetailsStepProps) {
  // Create default values with properly typed structure
  const defaultValues: ZodFormData = {
    fundingGoal: null,
    currency: 'USD',
    timeline: {
      startDate: '',
      endDate: '',
    },
    milestones: [],
    ...(initialData as Partial<ZodFormData>),
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<ZodFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectFundingDetailsSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  const currency = watch('currency');

  const handleAddMilestone = () => {
    append({
      title: '',
      description: '',
      targetDate: '',
      status: 'planned',
    });
  };

  const handleFormSubmit = (data: ZodFormData) => {
    // Convert empty string to null for fundingGoal
    if (data.fundingGoal !== undefined && data.fundingGoal === null) {
      data.fundingGoal = undefined;
    }
    onSubmit(data as ProjectFundingDetailsFormData);
  };

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSubmit={handleSubmit(handleFormSubmit as any)}
      className="funding-details-form"
    >
      <Flex direction="column" gap="4">
        {/* Funding Goal */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="bold">
            Funding Information
          </Text>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flexGrow: 1, minWidth: '200px' }}>
              <Text as="label" size="2" weight="bold" htmlFor="fundingGoal">
                Funding Goal (Optional)
              </Text>
              <TextField.Root
                {...register('fundingGoal', {
                  setValueAs: v => (v === '' ? null : Number(v) || null),
                })}
                type="number"
                placeholder="Enter funding goal"
                disabled={isSubmitting}
              />
              {errors.fundingGoal && (
                <Text color="red" size="1">
                  {errors.fundingGoal.message}
                </Text>
              )}
            </Box>

            <Box style={{ width: '120px' }}>
              <Text as="label" size="2" weight="bold" htmlFor="currency">
                Currency
              </Text>
              <Select.Root
                {...register('currency')}
                defaultValue={currency}
                disabled={isSubmitting}
              >
                <Select.Trigger />
                <Select.Content>
                  {currencies.map(option => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        </Flex>

        {/* Timeline */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="bold">
            Timeline (Optional)
          </Text>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flexGrow: 1, minWidth: '200px' }}>
              <Text as="label" size="2" weight="bold" htmlFor="timeline.startDate">
                Start Date
              </Text>
              <TextField.Root
                {...register('timeline.startDate')}
                type="date"
                disabled={isSubmitting}
              />
            </Box>

            <Box style={{ flexGrow: 1, minWidth: '200px' }}>
              <Text as="label" size="2" weight="bold" htmlFor="timeline.endDate">
                End Date
              </Text>
              <TextField.Root
                {...register('timeline.endDate')}
                type="date"
                disabled={isSubmitting}
              />
            </Box>
          </Flex>
        </Flex>

        {/* Milestones */}
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="3" weight="bold">
              Milestones
            </Text>
            <Button
              size="1"
              variant="soft"
              onClick={handleAddMilestone}
              type="button"
              disabled={isSubmitting}
            >
              <PlusIcon /> Add Milestone
            </Button>
          </Flex>

          {fields.length === 0 && (
            <Card variant="surface">
              <Flex align="center" justify="center" p="4" direction="column" gap="2">
                <Text color="gray">No milestones added yet</Text>
                <Button size="1" onClick={handleAddMilestone} type="button" disabled={isSubmitting}>
                  <PlusIcon /> Add First Milestone
                </Button>
              </Flex>
            </Card>
          )}

          {fields.map((field, index) => (
            <Card key={field.id} variant="surface">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="start">
                  <Text weight="bold">Milestone {index + 1}</Text>
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => remove(index)}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <Cross2Icon />
                  </IconButton>
                </Flex>

                <Flex direction="column" gap="3">
                  <Box>
                    <Text as="label" size="2" weight="bold" htmlFor={`milestones.${index}.title`}>
                      Title
                    </Text>
                    <TextField.Root
                      {...register(`milestones.${index}.title`)}
                      placeholder="Milestone title"
                      disabled={isSubmitting}
                    />
                    {errors.milestones?.[index]?.title && (
                      <Text color="red" size="1">
                        {errors.milestones[index]?.title?.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="bold"
                      htmlFor={`milestones.${index}.description`}
                    >
                      Description
                    </Text>
                    <TextArea
                      {...register(`milestones.${index}.description`)}
                      placeholder="Describe what this milestone involves"
                      disabled={isSubmitting}
                    />
                    {errors.milestones?.[index]?.description && (
                      <Text color="red" size="1">
                        {errors.milestones[index]?.description?.message}
                      </Text>
                    )}
                  </Box>

                  <Flex gap="3" wrap="wrap">
                    <Box style={{ flexGrow: 1, minWidth: '200px' }}>
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor={`milestones.${index}.targetDate`}
                      >
                        Target Date
                      </Text>
                      <TextField.Root
                        {...register(`milestones.${index}.targetDate`)}
                        type="date"
                        disabled={isSubmitting}
                      />
                    </Box>

                    <Box style={{ width: '150px' }}>
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor={`milestones.${index}.status`}
                      >
                        Status
                      </Text>
                      <Controller
                        control={control}
                        name={`milestones.${index}.status`}
                        render={({ field }) => (
                          <Select.Root
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting}
                          >
                            <Select.Trigger />
                            <Select.Content>
                              {statusOptions.map(option => (
                                <Select.Item key={option.value} value={option.value}>
                                  {option.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Root>
                        )}
                      />
                    </Box>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Flex justify="end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
