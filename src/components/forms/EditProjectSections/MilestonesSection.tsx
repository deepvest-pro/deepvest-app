'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckIcon, TargetIcon, PlusIcon, Cross2Icon } from '@radix-ui/react-icons';
import {
  Box,
  Card,
  Flex,
  Text,
  Heading,
  Button,
  Grid,
  Spinner,
  Select,
  IconButton,
} from '@radix-ui/themes';
import { MilestoneStatus } from '@/types/supabase';
import { useToastHelpers } from '@/components/layout/ToastProvider';

// Validation schema for milestones section
const milestonesSchema = z.object({
  milestones: z.array(
    z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      targetDate: z.string().optional(),
      completionDate: z.string().optional(),
      status: z.enum(['planned', 'in_progress', 'completed', 'delayed', 'cancelled'] as const),
    }),
  ),
});

type MilestonesFormData = z.infer<typeof milestonesSchema>;

interface MilestonesSectionProps {
  initialData: {
    milestones?: Array<{
      title: string;
      description: string;
      targetDate?: string;
      completionDate?: string;
      status: MilestoneStatus;
    }>;
  };
  projectId: string;
  onSave: (data: MilestonesFormData) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'delayed', label: 'Delayed', color: 'orange' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

export function MilestonesSection({
  initialData,
  onSave,
  isLoading = false,
}: MilestonesSectionProps) {
  const { success, error } = useToastHelpers();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<MilestonesFormData>({
    resolver: zodResolver(milestonesSchema),
    defaultValues: {
      milestones: (initialData.milestones || []).map(milestone => ({
        ...milestone,
        status: milestone.status || 'planned',
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  const handleAddMilestone = () => {
    append({
      title: '',
      description: '',
      targetDate: '',
      completionDate: '',
      status: 'planned',
    });
  };

  const onSubmit = handleSubmit(async data => {
    try {
      await onSave(data);
      success('Milestones saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      error(errorMessage);
    }
  });

  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="2" mb="3">
            <TargetIcon width="20" height="20" color="var(--blue-9)" />
            <Heading size="5">Project Milestones</Heading>
          </Flex>

          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="5">
              <Box
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--red-2)',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--red-6)',
                }}
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

              {/* Milestones List */}
              <Box>
                <Flex justify="between" align="center" mb="3">
                  <Text size="3" weight="medium">
                    Milestones ({fields.length})
                  </Text>
                  <Button
                    type="button"
                    onClick={handleAddMilestone}
                    size="2"
                    variant="soft"
                    disabled={isLoading}
                  >
                    <PlusIcon />
                    Add Milestone
                  </Button>
                </Flex>

                {fields.length === 0 ? (
                  <Box
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      backgroundColor: 'var(--gray-2)',
                      borderRadius: 'var(--radius-3)',
                      border: '2px dashed var(--gray-6)',
                    }}
                  >
                    <TargetIcon
                      width="48"
                      height="48"
                      color="var(--gray-8)"
                      style={{ margin: '0 auto 16px' }}
                    />
                    <Heading size="4" mb="2" color="gray">
                      No Milestones Yet
                    </Heading>
                    <Text size="3" color="gray" mb="4">
                      Add milestones to track your project&apos;s progress and key achievements.
                    </Text>
                    <br />
                    <br />
                    <Button
                      type="button"
                      onClick={handleAddMilestone}
                      size="3"
                      disabled={isLoading}
                    >
                      <PlusIcon />
                      Add Your First Milestone
                    </Button>
                  </Box>
                ) : (
                  <Flex direction="column" gap="4">
                    {fields.map((field, index) => (
                      <Card key={field.id} variant="surface">
                        <Box p="4">
                          <Flex direction="column" gap="4">
                            <Flex justify="between" align="center">
                              <Text size="2" weight="medium" color="gray">
                                Milestone #{index + 1}
                              </Text>
                              <IconButton
                                type="button"
                                onClick={() => remove(index)}
                                size="1"
                                variant="ghost"
                                color="red"
                                disabled={isLoading}
                              >
                                <Cross2Icon />
                              </IconButton>
                            </Flex>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                              <Box>
                                <Text
                                  as="label"
                                  size="2"
                                  weight="medium"
                                  mb="2"
                                  style={{ display: 'block' }}
                                >
                                  Title *
                                </Text>
                                <input
                                  {...register(`milestones.${index}.title`)}
                                  placeholder="Milestone title"
                                  disabled={isLoading}
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-2)',
                                    border: '1px solid var(--gray-6)',
                                    fontSize: '14px',
                                  }}
                                />
                                {errors.milestones?.[index]?.title && (
                                  <Text size="1" color="red" mt="1">
                                    {errors.milestones[index]?.title?.message}
                                  </Text>
                                )}
                              </Box>

                              <Box>
                                <Text
                                  as="label"
                                  size="2"
                                  weight="medium"
                                  mb="2"
                                  style={{ display: 'block' }}
                                >
                                  Status
                                </Text>
                                <Select.Root
                                  value={watch(`milestones.${index}.status`)}
                                  onValueChange={value =>
                                    setValue(`milestones.${index}.status`, value as MilestoneStatus)
                                  }
                                  disabled={isLoading}
                                >
                                  <Select.Trigger style={{ width: '100%' }} />
                                  <Select.Content>
                                    {statusOptions.map(option => (
                                      <Select.Item key={option.value} value={option.value}>
                                        {option.label}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select.Root>
                                {errors.milestones?.[index]?.status && (
                                  <Text size="1" color="red" mt="1">
                                    {errors.milestones[index]?.status?.message}
                                  </Text>
                                )}
                              </Box>
                            </Grid>

                            <Box>
                              <Text
                                as="label"
                                size="2"
                                weight="medium"
                                mb="2"
                                style={{ display: 'block' }}
                              >
                                Description *
                              </Text>
                              <textarea
                                {...register(`milestones.${index}.description`)}
                                placeholder="Describe this milestone and what it involves"
                                rows={3}
                                disabled={isLoading}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-2)',
                                  border: '1px solid var(--gray-6)',
                                  fontSize: '14px',
                                  resize: 'vertical',
                                }}
                              />
                              {errors.milestones?.[index]?.description && (
                                <Text size="1" color="red" mt="1">
                                  {errors.milestones[index]?.description?.message}
                                </Text>
                              )}
                            </Box>

                            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                              <Box>
                                <Text
                                  as="label"
                                  size="2"
                                  weight="medium"
                                  mb="2"
                                  style={{ display: 'block' }}
                                >
                                  Target Date
                                </Text>
                                <input
                                  {...register(`milestones.${index}.targetDate`)}
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
                                {errors.milestones?.[index]?.targetDate && (
                                  <Text size="1" color="red" mt="1">
                                    {errors.milestones[index]?.targetDate?.message}
                                  </Text>
                                )}
                              </Box>

                              <Box>
                                <Text
                                  as="label"
                                  size="2"
                                  weight="medium"
                                  mb="2"
                                  style={{ display: 'block' }}
                                >
                                  Completion Date
                                </Text>
                                <input
                                  {...register(`milestones.${index}.completionDate`)}
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
                                {errors.milestones?.[index]?.completionDate && (
                                  <Text size="1" color="red" mt="1">
                                    {errors.milestones[index]?.completionDate?.message}
                                  </Text>
                                )}
                              </Box>
                            </Grid>
                          </Flex>
                        </Box>
                      </Card>
                    ))}
                  </Flex>
                )}
              </Box>

              {/* Tips */}
              <Box
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--green-2)',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--green-6)',
                }}
              >
                <Text size="2" color="green" weight="medium" mb="2" style={{ display: 'block' }}>
                  🎯 Milestone Tips
                </Text>
                <Flex direction="column" gap="1">
                  <Text size="2" color="green">
                    • Set specific, measurable, and achievable milestones
                  </Text>
                  <Text size="2" color="green">
                    • Include both technical and business milestones
                  </Text>
                  <Text size="2" color="green">
                    • Update status regularly to track progress
                  </Text>
                  <Text size="2" color="green">
                    • Use milestones to communicate progress to stakeholders
                  </Text>
                </Flex>
              </Box>

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
