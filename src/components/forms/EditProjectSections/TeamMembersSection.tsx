'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Avatar,
  Card,
  Button,
  Dialog,
  TextField,
  Select,
  Checkbox,
  AlertDialog,
  Badge,
} from '@radix-ui/themes';
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  PersonIcon,
  StarIcon,
  StarFilledIcon,
} from '@radix-ui/react-icons';
import { TeamMember, TeamMemberStatus } from '@/types/supabase';
import { createTeamMember, updateTeamMember, deleteTeamMember } from '@/lib/api/team-api';
import { getInitials } from '@/lib/utils/format';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { TeamMemberStatusBadge } from '@/components/ui/StatusBadge';
import { SocialLinksInline } from '@/components/ui/SocialLinks';

interface TeamMembersSectionProps {
  projectId: string;
  teamMembers: TeamMember[];
  onTeamMembersChange: (teamMembers: TeamMember[]) => void;
  isLoading?: boolean;
}

interface TeamMemberFormData {
  name: string;
  email: string;
  positions: string[];
  status: string;
  is_founder: boolean;
  x_url: string;
  github_url: string;
  linkedin_url: string;
}

const initialFormData: TeamMemberFormData = {
  name: '',
  email: '',
  positions: [],
  status: 'active',
  is_founder: false,
  x_url: '',
  github_url: '',
  linkedin_url: '',
};

export function TeamMembersSection({
  projectId,
  teamMembers,
  onTeamMembersChange,
  isLoading,
}: TeamMembersSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<TeamMemberFormData>(initialFormData);
  const [positionInput, setPositionInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success: toastSuccess, error: toastError } = useToastHelpers();

  // Show loading state
  if (isLoading) {
    return (
      <Card size="3">
        <Flex direction="column" align="center" gap="3" p="6">
          <Text size="3">Loading team members...</Text>
        </Flex>
      </Card>
    );
  }

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email || '',
        positions: member.positions || [],
        status: member.status,
        is_founder: member.is_founder,
        x_url: member.x_url || '',
        github_url: member.github_url || '',
        linkedin_url: member.linkedin_url || '',
      });
    } else {
      setEditingMember(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData(initialFormData);
    setPositionInput('');
  };

  const handleAddPosition = () => {
    if (positionInput.trim() && !formData.positions.includes(positionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        positions: [...prev.positions, positionInput.trim()],
      }));
      setPositionInput('');
    }
  };

  const handleRemovePosition = (position: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p !== position),
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toastError('Name is required');
      return;
    }

    startTransition(async () => {
      try {
        if (editingMember) {
          const updatedMember = await updateTeamMember(projectId, editingMember.id, {
            name: formData.name,
            email: formData.email || null,
            positions: formData.positions,
            status: formData.status as TeamMemberStatus,
            is_founder: formData.is_founder,
            x_url: formData.x_url || null,
            github_url: formData.github_url || null,
            linkedin_url: formData.linkedin_url || null,
          });

          onTeamMembersChange(
            teamMembers.map(member => (member.id === editingMember.id ? updatedMember : member)),
          );
          toastSuccess('Team member updated successfully');
        } else {
          const newMember = await createTeamMember(projectId, {
            name: formData.name,
            email: formData.email || null,
            positions: formData.positions,
            status: formData.status as TeamMemberStatus,
            is_founder: formData.is_founder,
            x_url: formData.x_url || null,
            github_url: formData.github_url || null,
            linkedin_url: formData.linkedin_url || null,
          });

          onTeamMembersChange([...teamMembers, newMember]);
          toastSuccess('Team member added successfully');
        }

        handleCloseDialog();
      } catch (error) {
        console.error('Error saving team member:', error);
        toastError('Failed to save team member');
      }
    });
  };

  const handleDelete = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!memberToDelete) return;

    startTransition(async () => {
      try {
        await deleteTeamMember(projectId, memberToDelete.id);
        onTeamMembersChange(teamMembers.filter(member => member.id !== memberToDelete.id));
        toastSuccess('Team member deleted successfully');
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } catch (error) {
        console.error('Error deleting team member:', error);
        toastError('Failed to delete team member');
      }
    });
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Heading size="5">Team Members</Heading>
        <Button onClick={() => handleOpenDialog()} disabled={isPending}>
          <PlusIcon />
          Add Member
        </Button>
      </Flex>

      {teamMembers.length === 0 ? (
        <Card>
          <Flex direction="column" align="center" justify="center" gap="3" py="6">
            <PersonIcon width="32" height="32" color="var(--gray-9)" />
            <Text color="gray" align="center">
              No team members added yet. Add your first team member to get started.
            </Text>
            <Button onClick={() => handleOpenDialog()}>
              <PlusIcon />
              Add Team Member
            </Button>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {teamMembers.map(member => (
            <Card key={member.id}>
              <Flex gap="3" align="start">
                <Avatar
                  size="4"
                  src={member.image_url || undefined}
                  alt={member.name}
                  radius="full"
                  fallback={getInitials(member.name)}
                />

                <Box style={{ flex: 1 }}>
                  <Flex justify="between" align="start" mb="2">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text weight="bold" size="3">
                          {member.name}
                        </Text>
                        {member.is_founder && (
                          <Badge color="orange" size="1" variant="soft" radius="full">
                            <Flex gap="1" align="center">
                              <StarFilledIcon />
                              <Text>Founder</Text>
                            </Flex>
                          </Badge>
                        )}
                        <TeamMemberStatusBadge status={member.status} />
                      </Flex>

                      {member.email && (
                        <Text size="2" color="gray">
                          {member.email}
                        </Text>
                      )}

                      {member.positions && member.positions.length > 0 && (
                        <Flex gap="1" wrap="wrap" mt="1">
                          {member.positions.map((position, index) => (
                            <Badge
                              key={index}
                              variant="soft"
                              size="1"
                              radius="full"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemovePosition(position)}
                            >
                              {position}
                            </Badge>
                          ))}
                        </Flex>
                      )}
                    </Flex>

                    <Flex gap="2">
                      <Button
                        variant="soft"
                        color="gray"
                        size="1"
                        onClick={() => handleOpenDialog(member)}
                        disabled={isPending}
                      >
                        <Pencil1Icon />
                      </Button>
                      <Button
                        variant="soft"
                        color="red"
                        size="1"
                        onClick={() => handleDelete(member)}
                        disabled={isPending}
                      >
                        <TrashIcon />
                      </Button>
                    </Flex>
                  </Flex>

                  <SocialLinksInline
                    data={{
                      x_url: member.x_url,
                      github_url: member.github_url,
                      linkedin_url: member.linkedin_url,
                      website_url: null,
                    }}
                  />
                </Box>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {/* Add/Edit Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</Dialog.Title>

          <Flex direction="column" gap="4" mt="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Name *
              </Text>
              <TextField.Root
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Email
              </Text>
              <TextField.Root
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Positions
              </Text>
              <Flex gap="2" mb="2">
                <TextField.Root
                  value={positionInput}
                  onChange={e => setPositionInput(e.target.value)}
                  placeholder="Enter position (e.g., CEO, CTO)"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPosition();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleAddPosition} disabled={!positionInput.trim()}>
                  Add
                </Button>
              </Flex>
              {formData.positions.length > 0 && (
                <Flex gap="1" wrap="wrap">
                  {formData.positions.map((position, index) => (
                    <Badge
                      key={index}
                      variant="soft"
                      size="1"
                      radius="full"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemovePosition(position)}
                    >
                      {position}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>

            <Flex gap="4">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" mb="1">
                  Status
                </Text>
                <Select.Root
                  value={formData.status}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="active">Active</Select.Item>
                    <Select.Item value="inactive">Inactive</Select.Item>
                    <Select.Item value="alumni">Alumni</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Flex align="end" pb="1">
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={formData.is_founder}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, is_founder: Boolean(checked) }))
                      }
                    />
                    <StarIcon />
                    Founder
                  </Flex>
                </Text>
              </Flex>
            </Flex>

            {/* Social Links */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Social Links
              </Text>
              <Flex direction="column" gap="2">
                <TextField.Root
                  value={formData.x_url}
                  onChange={e => setFormData(prev => ({ ...prev, x_url: e.target.value }))}
                  placeholder="X (Twitter) URL"
                />
                <TextField.Root
                  value={formData.github_url}
                  onChange={e => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                  placeholder="GitHub URL"
                />
                <TextField.Root
                  placeholder="Enter LinkedIn URL"
                  value={formData.linkedin_url}
                  onChange={e => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                />
              </Flex>
            </Box>
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" onClick={handleCloseDialog}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={isPending || !formData.name.trim()}>
              {isPending
                ? editingMember
                  ? 'Updating...'
                  : 'Adding...'
                : editingMember
                  ? 'Update Member'
                  : 'Add Member'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>Delete Team Member</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to remove {memberToDelete?.name} from the team? This action cannot
            be undone.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={confirmDelete} disabled={isPending}>
                {isPending ? 'Deleting...' : 'Delete Member'}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
