'use client';

import React, { useState } from 'react';
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
  Switch,
} from '@radix-ui/themes';
import { Cross2Icon, PlusIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import { useToastHelpers } from '../layout/ToastProvider';

// Helper type for use with React Hook Form
type ZodFormData = {
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    isFounder: boolean;
  }>;
  inviteCollaborators: Array<{
    email: string;
    role: 'viewer' | 'editor' | 'admin';
  }>;
};

// Define schema for team members and collaboration
const teamCollaborationSchema = z.object({
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        role: z.string().min(2, 'Role must be at least 2 characters'),
        isFounder: z.boolean().default(false),
      }),
    )
    .min(1, 'At least one team member is required'),
  inviteCollaborators: z
    .array(
      z.object({
        email: z.string().email('Invalid email address'),
        role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
      }),
    )
    .default([]),
});

export type TeamCollaborationFormData = z.infer<typeof teamCollaborationSchema>;

interface TeamCollaborationStepProps {
  onSubmit: (data: TeamCollaborationFormData) => void;
  initialData?: Partial<TeamCollaborationFormData>;
  isSubmitting?: boolean;
}

const roleOptions = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

export function TeamCollaborationStep({
  onSubmit,
  initialData = {},
  isSubmitting = false,
}: TeamCollaborationStepProps) {
  const { success, error: showError } = useToastHelpers();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');

  // Create properly typed defaultValues
  const defaultValues: ZodFormData = {
    teamMembers: [
      {
        name: '',
        email: '',
        role: '',
        isFounder: true,
      },
    ],
    inviteCollaborators: [],
    ...(initialData as Partial<ZodFormData>),
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
  } = useForm<ZodFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(teamCollaborationSchema) as any,
    defaultValues,
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
      showError('Please enter an email address');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(inviteEmail)) {
      showError('Please enter a valid email address');
      return;
    }

    // Check if email already exists in collaborators
    const existingCollaborator = getValues('inviteCollaborators').find(
      c => c.email === inviteEmail,
    );

    if (existingCollaborator) {
      showError('This collaborator has already been added');
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

  const handleFormSubmit = (data: ZodFormData) => {
    onSubmit(data as TeamCollaborationFormData);
  };

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSubmit={handleSubmit(handleFormSubmit as any)}
      className="team-collaboration-form"
    >
      <Flex direction="column" gap="4">
        {/* Team Members */}
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="3" weight="bold">
              Team Members
            </Text>
            <Button
              size="1"
              variant="soft"
              onClick={handleAddTeamMember}
              type="button"
              disabled={isSubmitting}
            >
              <PlusIcon /> Add Team Member
            </Button>
          </Flex>

          {teamMembersArray.fields.map((field, index) => (
            <Card key={field.id} variant="surface">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="start">
                  <Text weight="bold">
                    Team Member {index + 1} {index === 0 ? '(You)' : ''}
                  </Text>
                  {index > 0 && (
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={() => teamMembersArray.remove(index)}
                      type="button"
                      disabled={isSubmitting}
                    >
                      <Cross2Icon />
                    </IconButton>
                  )}
                </Flex>

                <Flex direction="column" gap="3">
                  <Box>
                    <Text as="label" size="2" weight="bold" htmlFor={`teamMembers.${index}.name`}>
                      Name
                    </Text>
                    <TextField.Root
                      {...register(`teamMembers.${index}.name`)}
                      placeholder="Team member name"
                      disabled={isSubmitting || index === 0}
                    />
                    {errors.teamMembers?.[index]?.name && (
                      <Text color="red" size="1">
                        {errors.teamMembers[index]?.name?.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="bold" htmlFor={`teamMembers.${index}.email`}>
                      Email
                    </Text>
                    <TextField.Root
                      {...register(`teamMembers.${index}.email`)}
                      placeholder="team.member@example.com"
                      disabled={isSubmitting || index === 0}
                    />
                    {errors.teamMembers?.[index]?.email && (
                      <Text color="red" size="1">
                        {errors.teamMembers[index]?.email?.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="bold" htmlFor={`teamMembers.${index}.role`}>
                      Role
                    </Text>
                    <TextField.Root
                      {...register(`teamMembers.${index}.role`)}
                      placeholder="CEO, CTO, Developer, etc."
                      disabled={isSubmitting}
                    />
                    {errors.teamMembers?.[index]?.role && (
                      <Text color="red" size="1">
                        {errors.teamMembers[index]?.role?.message}
                      </Text>
                    )}
                  </Box>

                  <Flex align="center" gap="2">
                    <Controller
                      control={control}
                      name={`teamMembers.${index}.isFounder`}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting || index === 0}
                        />
                      )}
                    />
                    <Text size="2">Founder</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}

          {errors.teamMembers && !Array.isArray(errors.teamMembers) && (
            <Text color="red" size="1">
              {errors.teamMembers.message}
            </Text>
          )}
        </Flex>

        {/* Invite Collaborators */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="bold">
            Invite Collaborators (Optional)
          </Text>

          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Flex gap="3" wrap="wrap" align="end">
                <Box style={{ flexGrow: 2, minWidth: '200px' }}>
                  <Text as="label" size="2" weight="bold" htmlFor="inviteEmail">
                    Email
                  </Text>
                  <TextField.Root
                    id="inviteEmail"
                    placeholder="collaborator@example.com"
                    disabled={isSubmitting}
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </Box>

                <Box style={{ width: '120px' }}>
                  <Text as="label" size="2" weight="bold" htmlFor="inviteRole">
                    Role
                  </Text>
                  <Select.Root
                    defaultValue="viewer"
                    value={inviteRole}
                    onValueChange={value => setInviteRole(value as 'viewer' | 'editor' | 'admin')}
                    disabled={isSubmitting}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {roleOptions.map(option => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Button
                  onClick={handleAddCollaborator}
                  type="button"
                  disabled={isSubmitting || !inviteEmail}
                >
                  <PlusIcon /> Add
                </Button>
              </Flex>

              {/* List of invited collaborators */}
              {collaboratorsArray.fields.length > 0 && (
                <Box mt="2">
                  <Text weight="bold" size="2" mb="2">
                    Invited Collaborators:
                  </Text>
                  <Flex direction="column" gap="2">
                    {collaboratorsArray.fields.map((collaborator, index) => (
                      <Flex key={collaborator.id} justify="between" align="center" gap="2">
                        <Flex gap="2" align="center">
                          <EnvelopeClosedIcon />
                          <Text>{collaborator.email}</Text>
                          <Text size="1" color="gray">
                            ({roleOptions.find(r => r.value === collaborator.role)?.label})
                          </Text>
                        </Flex>
                        <IconButton
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={() => collaboratorsArray.remove(index)}
                          disabled={isSubmitting}
                        >
                          <Cross2Icon />
                        </IconButton>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              )}
            </Flex>
          </Card>
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
