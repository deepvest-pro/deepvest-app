'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@radix-ui/themes';
import { Pencil1Icon, GlobeIcon, EyeClosedIcon, TrashIcon } from '@radix-ui/react-icons';
import { Heading, Text, Card, Box, Flex, Button, Tabs, AlertDialog } from '@radix-ui/themes';
import { ProjectRole, ProjectWithSnapshot } from '@/types/supabase';
import { toggleProjectPublication, publishDraft, deleteProject } from '@/app/projects/[id]/actions';
import { useToastHelpers } from '@/components/layout/ToastProvider';

interface ProjectDetailsProps {
  project: ProjectWithSnapshot;
  isAuthenticated: boolean;
  userId?: string;
  userRole?: ProjectRole | null;
}

export function ProjectDetails({
  project: initialProject,
  isAuthenticated,
  userRole,
}: ProjectDetailsProps) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState('details');
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { success: toastSuccess, error: toastError } = useToastHelpers();
  const router = useRouter();

  const canEdit = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
  const isOwner = userRole === 'owner';

  // Check if there's a draft to publish
  const hasDraftToPublish =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;

  // Get the current snapshot info
  const currentSnapshot = project.new_snapshot || project.public_snapshot;
  const projectName = currentSnapshot?.name || 'Unnamed Project';
  const projectDescription = currentSnapshot?.description || 'No description provided.';
  const projectStatus = currentSnapshot?.status || 'Unknown';

  return (
    <Container size="2" py="6">
      <Flex justify="between" align="center" mb="4">
        <Box>
          <Heading size="7" mb="2">
            {projectName}
          </Heading>
          <Text size="2" color="gray">
            {project.slug || ''}
          </Text>
        </Box>
        <Flex gap="3" align="center">
          {isOwner && hasDraftToPublish && (
            <Button
              variant="solid"
              color="blue"
              onClick={() => {
                startTransition(async () => {
                  try {
                    const result = await publishDraft({
                      projectId: project.id,
                    });

                    if (result.success) {
                      // Update the project state to reflect that draft is now published
                      setProject(prev => ({
                        ...prev,
                        public_snapshot_id: prev.new_snapshot_id,
                      }));
                      toastSuccess('Draft published successfully!');
                    } else {
                      toastError(result.error || 'Failed to publish draft.');
                    }
                  } catch {
                    toastError('An unexpected error occurred while publishing draft.');
                  }
                });
              }}
              disabled={isPending}
            >
              {isPending ? 'Publishing...' : 'Publish Draft'}
            </Button>
          )}
          {isOwner && (
            <Button
              variant={project.is_public ? 'soft' : 'solid'}
              color={project.is_public ? 'red' : 'green'}
              onClick={() => {
                startTransition(async () => {
                  try {
                    const result = await toggleProjectPublication({
                      projectId: project.id,
                      isCurrentlyPublic: project.is_public,
                    });

                    if (result.success && typeof result.isPublic === 'boolean') {
                      setProject(prev => ({ ...prev, is_public: result.isPublic! }));
                      toastSuccess(
                        result.isPublic
                          ? 'Project published successfully!'
                          : 'Project unpublished successfully!',
                      );
                    } else {
                      toastError(result.error || 'Failed to update project publication status.');
                    }
                  } catch {
                    toastError('An unexpected error occurred while updating project status.');
                  }
                });
              }}
              disabled={isPending}
            >
              {project.is_public ? <EyeClosedIcon /> : <GlobeIcon />}
              {isPending
                ? project.is_public
                  ? 'Unpublishing...'
                  : 'Publishing...'
                : project.is_public
                  ? 'Unpublish'
                  : 'Publish'}
            </Button>
          )}
          {canEdit && (
            <Link href={`/projects/${project.id}/edit`} passHref>
              <Button>
                <Pencil1Icon /> Edit Project
              </Button>
            </Link>
          )}
          {isOwner && (
            <Button
              variant="soft"
              color="red"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
            >
              <TrashIcon />
            </Button>
          )}
        </Flex>
      </Flex>

      <Card mb="6">
        <Box p="4">
          <Text size="3" mb="3">
            {projectDescription}
          </Text>

          <Flex gap="4">
            <Box>
              <Text size="2" weight="bold">
                Status
              </Text>
              <Text size="2">{projectStatus}</Text>
            </Box>
            <Box>
              <Text size="2" weight="bold">
                Created
              </Text>
              <Text size="2">
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString('en-GB')
                  : 'Unknown'}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Card>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="details">Details</Tabs.Trigger>
          <Tabs.Trigger value="snapshots">Snapshots</Tabs.Trigger>
          {(userRole === 'admin' || userRole === 'owner') && (
            <Tabs.Trigger value="members">Team Members</Tabs.Trigger>
          )}
        </Tabs.List>

        <Box mt="4">
          <Tabs.Content value="details">
            <Card>
              <Box p="4">
                <Heading size="4" mb="2">
                  Project Information
                </Heading>
                <Text mb="2">
                  This is a detailed view of the project. Additional information and project data
                  will be displayed here.
                </Text>
                {project.new_snapshot_id && (
                  <Text size="2" color="gray">
                    Current working snapshot ID: {project.new_snapshot_id}
                  </Text>
                )}
              </Box>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="snapshots">
            <Card>
              <Box p="4">
                <Heading size="4" mb="2">
                  Project Snapshots
                </Heading>
                <Text>You can view and manage project snapshots here.</Text>

                {isAuthenticated ? (
                  <Box mt="4">
                    <Text size="2" color="gray">
                      No snapshots available yet.
                    </Text>
                  </Box>
                ) : (
                  <Text size="2" color="gray" mt="4">
                    Please sign in to view project snapshots.
                  </Text>
                )}
              </Box>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="members">
            <Card>
              <Box p="4">
                <Heading size="4" mb="2">
                  Team Members
                </Heading>
                <Text>Manage project collaborators and permissions.</Text>

                <Box mt="4">
                  <Text size="2" color="gray">
                    No team members have been added yet.
                  </Text>
                </Box>
              </Box>
            </Card>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>Delete Project</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to delete &ldquo;{projectName}&rdquo;? This action cannot be
            undone and will permanently remove the project and all its data.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                variant="solid"
                color="red"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      const result = await deleteProject({
                        projectId: project.id,
                      });

                      if (result.success) {
                        toastSuccess('Project deleted successfully');
                        // Redirect to projects page using Next.js router
                        router.push('/projects');
                      } else {
                        toastError(result.error || 'Failed to delete project');
                        setShowDeleteDialog(false);
                      }
                    } catch (error) {
                      console.error('Delete project error:', error);
                      toastError('An unexpected error occurred while deleting project.');
                      setShowDeleteDialog(false);
                    }
                  });
                }}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete Project'}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Container>
  );
}
