'use client';

import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Switch,
} from '@radix-ui/themes';
import {
  CheckIcon,
  PersonIcon,
  PlusIcon,
  Cross2Icon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons';
import { useToastHelpers } from '@/components/layout/ToastProvider';

// Validation schema for team section
const teamSchema = z.object({
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        role: z.string().min(2, 'Role must be at least 2 characters'),
        isFounder: z.boolean(),
      }),
    )
    .min(1, 'At least one team member is required'),
  inviteCollaborators: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      role: z.enum(['viewer', 'editor', 'admin']),
    }),
  ),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamSectionProps {
  initialData: {
    teamMembers?: Array<{
      name: string;
      email: string;
      role: string;
      isFounder: boolean;
    }>;
    inviteCollaborators?: Array<{
      email: string;
      role: 'viewer' | 'editor' | 'admin';
    }>;
  };
  projectId: string;
  onSave: (data: TeamFormData) => Promise<void>;
  isLoading?: boolean;
}

const roleOptions = [
  { value: 'viewer', label: 'Viewer - Can view project details' },
  { value: 'editor', label: 'Editor - Can edit project content' },
  { value: 'admin', label: 'Admin - Can manage team and settings' },
];

export function TeamSection({ initialData, onSave, isLoading = false }: TeamSectionProps) {
  const { success, error } = useToastHelpers();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    getValues,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamMembers: initialData.teamMembers || [
        {
          name: '',
          email: '',
          role: '',
          isFounder: true,
        },
      ],
      inviteCollaborators: initialData.inviteCollaborators || [],
    },
  });

  const teamMembersArray = useFieldArray({
    control,
    name: 'teamMembers',
  });

  const collaboratorsArray = useFieldArray({
    control,
    name: 'inviteCollaborators',
  });

  const handleAddTeamMember = () => {
    teamMembersArray.append({
      name: '',
      email: '',
      role: '',
      isFounder: false,
    });
  };

  const handleAddCollaborator = () => {
    if (!inviteEmail) {
      error('Please enter an email address');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(inviteEmail)) {
      error('Please enter a valid email address');
      return;
    }

    // Check if email already exists in collaborators
    const existingCollaborator = getValues('inviteCollaborators').find(
      c => c.email === inviteEmail,
    );

    if (existingCollaborator) {
      error('This collaborator has already been added');
      return;
    }

    collaboratorsArray.append({
      email: inviteEmail,
      role: inviteRole,
    });

    // Reset the form
    setInviteEmail('');
    setInviteRole('viewer');
    success('Collaborator added');
  };

  const onSubmit = handleSubmit(async (data: TeamFormData) => {
    try {
      await onSave(data);
      success('Team information saved successfully!');
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
            <PersonIcon width="20" height="20" color="var(--blue-9)" />
            <Heading size="5">Team & Collaboration</Heading>
          </Flex>

          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="6">
              {/* Team Members Section */}
              <Box>
                <Flex justify="between" align="center" mb="3">
                  <Text size="3" weight="medium">
                    Team Members ({teamMembersArray.fields.length})
                  </Text>
                  <Button
                    type="button"
                    onClick={handleAddTeamMember}
                    size="2"
                    variant="soft"
                    disabled={isLoading}
                  >
                    <PlusIcon />
                    Add Team Member
                  </Button>
                </Flex>

                <Flex direction="column" gap="4">
                  {teamMembersArray.fields.map((field, index) => (
                    <Card key={field.id} variant="surface">
                      <Box p="4">
                        <Flex direction="column" gap="4">
                          <Flex justify="between" align="center">
                            <Text size="2" weight="medium" color="gray">
                              Team Member #{index + 1} {index === 0 ? '(You)' : ''}
                            </Text>
                            {index > 0 && (
                              <IconButton
                                type="button"
                                onClick={() => teamMembersArray.remove(index)}
                                size="1"
                                variant="ghost"
                                color="red"
                                disabled={isLoading}
                              >
                                <Cross2Icon />
                              </IconButton>
                            )}
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
                                Full Name *
                              </Text>
                              <input
                                {...register(`teamMembers.${index}.name`)}
                                placeholder="Enter full name"
                                disabled={isLoading}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-2)',
                                  border: '1px solid var(--gray-6)',
                                  fontSize: '14px',
                                }}
                              />
                              {errors.teamMembers?.[index]?.name && (
                                <Text size="1" color="red" mt="1">
                                  {errors.teamMembers[index]?.name?.message}
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
                                Email Address *
                              </Text>
                              <input
                                {...register(`teamMembers.${index}.email`)}
                                type="email"
                                placeholder="email@example.com"
                                disabled={isLoading}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-2)',
                                  border: '1px solid var(--gray-6)',
                                  fontSize: '14px',
                                }}
                              />
                              {errors.teamMembers?.[index]?.email && (
                                <Text size="1" color="red" mt="1">
                                  {errors.teamMembers[index]?.email?.message}
                                </Text>
                              )}
                            </Box>
                          </Grid>

                          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Box>
                              <Text
                                as="label"
                                size="2"
                                weight="medium"
                                mb="2"
                                style={{ display: 'block' }}
                              >
                                Role/Position *
                              </Text>
                              <input
                                {...register(`teamMembers.${index}.role`)}
                                placeholder="e.g., CEO, CTO, Designer"
                                disabled={isLoading}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-2)',
                                  border: '1px solid var(--gray-6)',
                                  fontSize: '14px',
                                }}
                              />
                              {errors.teamMembers?.[index]?.role && (
                                <Text size="1" color="red" mt="1">
                                  {errors.teamMembers[index]?.role?.message}
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
                                Founder Status
                              </Text>
                              <Flex align="center" gap="2" mt="2">
                                <Switch
                                  {...register(`teamMembers.${index}.isFounder`)}
                                  disabled={isLoading}
                                />
                                <Text size="2" color="gray">
                                  This person is a founder
                                </Text>
                              </Flex>
                            </Box>
                          </Grid>
                        </Flex>
                      </Box>
                    </Card>
                  ))}
                </Flex>
              </Box>

              {/* Collaborators Section */}
              <Box>
                <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                  Invite Collaborators
                </Text>

                <Card variant="surface" mb="4">
                  <Box p="4">
                    <Text size="2" weight="medium" mb="3" style={{ display: 'block' }}>
                      Add New Collaborator
                    </Text>
                    <Grid columns={{ initial: '1', sm: '3' }} gap="3">
                      <Box>
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          mb="2"
                          style={{ display: 'block' }}
                        >
                          Email Address
                        </Text>
                        <input
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          type="email"
                          placeholder="collaborator@example.com"
                          disabled={isLoading}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-2)',
                            border: '1px solid var(--gray-6)',
                            fontSize: '14px',
                          }}
                        />
                      </Box>

                      <Box>
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          mb="2"
                          style={{ display: 'block' }}
                        >
                          Role
                        </Text>
                        <Select.Root
                          value={inviteRole}
                          onValueChange={value =>
                            setInviteRole(value as 'viewer' | 'editor' | 'admin')
                          }
                          disabled={isLoading}
                        >
                          <Select.Trigger style={{ width: '100%' }} />
                          <Select.Content>
                            {roleOptions.map(option => (
                              <Select.Item key={option.value} value={option.value}>
                                {option.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Box>

                      <Box style={{ display: 'flex', alignItems: 'end' }}>
                        <Button
                          type="button"
                          onClick={handleAddCollaborator}
                          disabled={isLoading}
                          style={{ width: '100%' }}
                        >
                          <EnvelopeClosedIcon />
                          Add Collaborator
                        </Button>
                      </Box>
                    </Grid>
                  </Box>
                </Card>

                {/* Collaborators List */}
                {collaboratorsArray.fields.length > 0 && (
                  <Box>
                    <Text size="2" weight="medium" mb="3" style={{ display: 'block' }}>
                      Pending Invitations ({collaboratorsArray.fields.length})
                    </Text>
                    <Flex direction="column" gap="2">
                      {collaboratorsArray.fields.map((field, index) => (
                        <Card key={field.id} variant="surface">
                          <Box p="3">
                            <Flex justify="between" align="center">
                              <Flex direction="column" gap="1">
                                <Text size="2" weight="medium">
                                  {getValues(`inviteCollaborators.${index}.email`)}
                                </Text>
                                <Text size="1" color="gray">
                                  Role:{' '}
                                  {
                                    roleOptions.find(
                                      r =>
                                        r.value === getValues(`inviteCollaborators.${index}.role`),
                                    )?.label
                                  }
                                </Text>
                              </Flex>
                              <IconButton
                                type="button"
                                onClick={() => collaboratorsArray.remove(index)}
                                size="1"
                                variant="ghost"
                                color="red"
                                disabled={isLoading}
                              >
                                <Cross2Icon />
                              </IconButton>
                            </Flex>
                          </Box>
                        </Card>
                      ))}
                    </Flex>
                  </Box>
                )}
              </Box>

              {/* Tips */}
              <Box
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--purple-2)',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--purple-6)',
                }}
              >
                <Text size="2" color="purple" weight="medium" mb="2" style={{ display: 'block' }}>
                  👥 Team Tips
                </Text>
                <Flex direction="column" gap="1">
                  <Text size="2" color="purple">
                    • Include all key team members and their roles
                  </Text>
                  <Text size="2" color="purple">
                    • Mark founders to highlight founding team
                  </Text>
                  <Text size="2" color="purple">
                    • Invite collaborators to work on the project together
                  </Text>
                  <Text size="2" color="purple">
                    • Different roles have different permissions in the system
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
