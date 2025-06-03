'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Avatar,
  Card,
  Grid,
  Button,
  Separator,
  AspectRatio,
  Badge,
  AlertDialog,
} from '@radix-ui/themes';
import {
  InfoCircledIcon,
  Pencil1Icon,
  GlobeIcon,
  GitHubLogoIcon,
  SizeIcon,
  CheckCircledIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CalendarIcon,
  RocketIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { ProjectWithSnapshot, ProjectRole } from '@/types/supabase';
import { toggleProjectPublication, publishDraft, deleteProject } from '@/app/projects/[id]/actions';
import { useToastHelpers } from '@/components/layout/ToastProvider';

interface ProjectContentProps {
  project: ProjectWithSnapshot;
  isAuthenticated: boolean;
  userId?: string;
  userRole?: ProjectRole | null;
}

export function ProjectContent({ project: initialProject, userRole }: ProjectContentProps) {
  const [project, setProject] = useState(initialProject);
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { success: toastSuccess, error: toastError } = useToastHelpers();
  const router = useRouter();

  if (!project) {
    return (
      <Container size="3" py="9">
        <Card size="3">
          <Flex direction="column" align="center" justify="center" gap="4" p="6">
            <SizeIcon width="40" height="40" color="var(--gray-9)" />
            <Heading size="5" align="center">
              Project Not Found
            </Heading>
            <Text color="gray" align="center">
              The requested project could not be loaded.
            </Text>
            <Link href="/projects" passHref>
              <Button color="blue" highContrast size="3">
                Browse Projects
              </Button>
            </Link>
          </Flex>
        </Card>
      </Container>
    );
  }

  // Get current snapshot data
  const currentSnapshot = project.new_snapshot || project.public_snapshot;
  const projectName = currentSnapshot?.name || 'Unnamed Project';
  const projectDescription = currentSnapshot?.description || 'No description provided.';
  const projectStatus = currentSnapshot?.status || 'idea';
  const projectSlogan = currentSnapshot?.slogan;
  const projectCountry = currentSnapshot?.country;
  const projectCity = currentSnapshot?.city;
  const websiteUrls = currentSnapshot?.website_urls || [];
  const repositoryUrls = currentSnapshot?.repository_urls || [];
  const logoUrl = currentSnapshot?.logo_url;
  const bannerUrl = currentSnapshot?.banner_url;

  const canEdit = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
  const isOwner = userRole === 'owner';

  // Check if there's a draft to publish
  const hasDraftToPublish =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea':
        return 'gray';
      case 'concept':
        return 'blue';
      case 'prototype':
        return 'cyan';
      case 'mvp':
        return 'green';
      case 'beta':
        return 'yellow';
      case 'launched':
        return 'orange';
      case 'growing':
        return 'red';
      case 'scaling':
        return 'purple';
      case 'established':
        return 'indigo';
      case 'acquired':
        return 'pink';
      case 'closed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Container>
      {/* Banner Image */}
      <Box position="relative" mb="8">
        <AspectRatio ratio={16 / 6} style={{ maxHeight: '300px', borderRadius: 'var(--radius-3)' }}>
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt="Project banner"
              fill
              style={{ objectFit: 'cover', borderRadius: 'var(--radius-3)' }}
              priority
            />
          ) : (
            <Box
              style={{
                background: 'linear-gradient(135deg, var(--accent-9), var(--accent-10))',
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-3)',
              }}
            />
          )}
        </AspectRatio>
      </Box>

      <Grid columns={{ initial: '1', md: '4' }} gap="6">
        {/* Left Column - Project Info */}
        <Box style={{ gridColumn: 'span 1' }}>
          <Flex direction="column" gap="4" align="center">
            {/* Logo */}
            <Box
              style={{
                margin: '-80px 0 0',
                padding: '4px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-3)',
              }}
            >
              <Avatar
                size="8"
                src={logoUrl || undefined}
                alt="Project Logo"
                radius="full"
                fallback={projectName[0] || '?'}
                style={{ width: '160px', height: '160px' }}
              />
            </Box>

            {/* Project Details Card */}
            <Card style={{ width: '100%' }}>
              <Flex direction="column" gap="3">
                {/* Project Status */}
                <Heading size="3">Project Status</Heading>
                <Flex direction="column" gap="2">
                  <Badge
                    color={getStatusColor(projectStatus)}
                    size="2"
                    variant="soft"
                    radius="full"
                  >
                    <Flex gap="1" align="center">
                      <RocketIcon />
                      <Text>{formatStatus(projectStatus)}</Text>
                    </Flex>
                  </Badge>

                  <Flex gap="2" align="center">
                    {project.is_public ? (
                      <>
                        <EyeOpenIcon color="var(--green-9)" />
                        <Text size="2">Public Project</Text>
                      </>
                    ) : (
                      <>
                        <EyeClosedIcon color="var(--gray-9)" />
                        <Text size="2">Private Project</Text>
                      </>
                    )}
                  </Flex>

                  {project.created_at && (
                    <Flex gap="2" align="center">
                      <CalendarIcon color="var(--gray-9)" />
                      <Text size="2">Created {formatDate(project.created_at)}</Text>
                    </Flex>
                  )}
                </Flex>

                <Separator my="2" />

                {/* Actions */}
                <Flex direction="column" gap="2">
                  {isOwner && hasDraftToPublish && (
                    <Button
                      variant="solid"
                      color="blue"
                      size="2"
                      style={{ width: '100%' }}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            const result = await publishDraft({
                              projectId: project.id,
                            });

                            if (result.success) {
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
                      size="2"
                      style={{ width: '100%' }}
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
                              toastError(
                                result.error || 'Failed to update project publication status.',
                              );
                            }
                          } catch {
                            toastError(
                              'An unexpected error occurred while updating project status.',
                            );
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
                      <Button color="blue" size="2" style={{ width: '100%' }}>
                        <Pencil1Icon />
                        Edit Project
                      </Button>
                    </Link>
                  )}

                  {isOwner && (
                    <Button
                      variant="soft"
                      color="red"
                      size="2"
                      style={{ width: '100%' }}
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isPending}
                    >
                      <TrashIcon />
                      Delete Project
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Card>

            {/* Links Card */}
            {(websiteUrls.length > 0 || repositoryUrls.length > 0) && (
              <Card style={{ width: '100%' }}>
                <Heading size="3" mb="3">
                  Links
                </Heading>
                <Flex direction="column" gap="2">
                  {websiteUrls.map((url, index) => (
                    <Link
                      key={index}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <GlobeIcon />
                        Website
                      </Button>
                    </Link>
                  ))}
                  {repositoryUrls.map((url, index) => (
                    <Link
                      key={index}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="soft" color="gray" size="2" style={{ width: '100%' }}>
                        <GitHubLogoIcon />
                        Repository
                      </Button>
                    </Link>
                  ))}
                </Flex>
              </Card>
            )}
          </Flex>
        </Box>

        {/* Right Column - Project Content */}
        <Box style={{ gridColumn: 'span 3' }}>
          <Card mb="6">
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Flex align="center" gap="2">
                  <Heading size="7">{projectName}</Heading>
                  {project.is_public && (
                    <Badge color="green" size="1" variant="soft" radius="full">
                      <Flex gap="1" align="center">
                        <CheckCircledIcon />
                        <Text>Public</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>

                {projectSlogan && (
                  <Text size="3" style={{ fontStyle: 'italic' }} color="gray" mt="1">
                    &ldquo;{projectSlogan}&rdquo;
                  </Text>
                )}

                <Flex mt="2" gap="3" wrap="wrap">
                  {projectCountry && projectCity && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <GlobeIcon />
                        <Text>
                          {projectCity}, {projectCountry}
                        </Text>
                      </Flex>
                    </Badge>
                  )}

                  {project.created_at && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <CalendarIcon />
                        <Text>Created {formatDate(project.created_at)}</Text>
                      </Flex>
                    </Badge>
                  )}

                  {project.updated_at && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <InfoCircledIcon />
                        <Text>Updated {formatDate(project.updated_at)}</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>
              </Flex>

              <Box>
                <Separator my="3" />
                <Text size="2">{projectDescription}</Text>
              </Box>
            </Flex>
          </Card>

          {/* Additional sections can be added here */}
          {/* For example: Team members, milestones, funding rounds, etc. */}
        </Box>
      </Grid>

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
