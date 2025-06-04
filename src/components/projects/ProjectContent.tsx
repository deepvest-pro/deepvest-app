'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  StarIcon,
} from '@radix-ui/react-icons';
import { ProjectWithSnapshot, ProjectRole, TeamMember } from '@/types/supabase';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { toggleProjectPublication, publishDraft } from '@/app/projects/[id]/actions';
import { useProjectData, useProjectPermissions } from '@/lib/hooks/useProjectData';
import { getInitials } from '@/lib/utils/format';
import { ProjectStatusBadge } from '@/components/ui/StatusBadge';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { ProjectDocuments } from './ProjectDocuments';
import { ProjectTeam } from './ProjectTeam';
import { ProjectScoringBrief } from './ProjectScoringBrief';
import { ProjectScoringDetails } from './ProjectScoringDetails';

interface ProjectContentProps {
  project: ProjectWithSnapshot;
  documents: ProjectDocumentWithAuthor[];
  team: TeamMember[];
  isAuthenticated: boolean;
  userId?: string;
  userRole?: ProjectRole | null;
}

export function ProjectContent({
  project: initialProject,
  documents: initialDocuments,
  team: initialTeam,
  userId,
}: ProjectContentProps) {
  const [project, setProject] = useState<ProjectWithSnapshot>(initialProject);
  const [documents] = useState<ProjectDocumentWithAuthor[]>(initialDocuments);
  const [team] = useState<TeamMember[]>(initialTeam);
  const [isPending, startTransition] = useTransition();
  const [isScoringPending, setScoringPending] = useState(false);
  const { success: toastSuccess, error: toastError } = useToastHelpers();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for data processing
  const projectData = useProjectData(project);
  const permissions = useProjectPermissions(project, userId);

  // Handle scroll to scoring details
  const handleScrollToScoring = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle scoring generation
  const handleGenerateScoring = async () => {
    if (!permissions.isOwner) {
      toastError('Only project owners can generate scoring.');
      return;
    }

    setScoringPending(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/scoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: false }),
      });

      const result = await response.json();

      if (result.success) {
        toastSuccess('Project scoring generated successfully!');

        setProject(prev => {
          const updatedProject = { ...prev };

          if (updatedProject.public_snapshot && !updatedProject.new_snapshot_id) {
            updatedProject.public_snapshot = {
              ...updatedProject.public_snapshot,
              scoring_id: result.data.scoring.id,
              scoring: result.data.scoring,
            };
          } else if (updatedProject.new_snapshot) {
            updatedProject.new_snapshot = {
              ...updatedProject.new_snapshot,
              scoring_id: result.data.scoring.id,
              scoring: result.data.scoring,
            };
          }

          return updatedProject as ProjectWithSnapshot;
        });
      } else {
        toastError(result.error || 'Failed to generate project scoring.');
      }
    } catch {
      toastError('An unexpected error occurred while generating scoring.');
    } finally {
      setScoringPending(false);
    }
  };

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

  return (
    <Container>
      {/* Banner Image */}
      <Box position="relative" mb="8">
        <AspectRatio ratio={16 / 6} style={{ maxHeight: '300px', borderRadius: 'var(--radius-3)' }}>
          {projectData.bannerUrl ? (
            <Image
              src={projectData.bannerUrl}
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
                src={projectData.logoUrl || undefined}
                alt="Project Logo"
                radius="full"
                fallback={getInitials(projectData.name)}
                style={{ width: '160px', height: '160px' }}
              />
            </Box>

            {/* Project Details Card */}
            <Card style={{ width: '100%' }}>
              <Flex direction="column" gap="3">
                {/* Project Status */}
                <Heading size="3">Project Status</Heading>
                <Flex direction="column" gap="2">
                  <ProjectStatusBadge status={projectData.status} />

                  <Flex gap="2" align="center">
                    {projectData.isPublic ? (
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

                  {projectData.formattedCreatedAt && (
                    <Flex gap="2" align="center">
                      <CalendarIcon color="var(--gray-9)" />
                      <Text size="2">Created {projectData.formattedCreatedAt}</Text>
                    </Flex>
                  )}
                </Flex>

                <Separator my="2" />

                {/* Actions */}
                <Flex direction="column" gap="2">
                  {permissions.isOwner && projectData.hasDraftToPublish && (
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
                              setProject(
                                prev =>
                                  ({
                                    ...prev,
                                    public_snapshot_id: prev.new_snapshot_id,
                                  }) as ProjectWithSnapshot,
                              );
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
                      {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}

                  {permissions.isOwner &&
                    !projectData.hasDraftToPublish &&
                    !projectData.hasScoring && (
                      <Button
                        variant="solid"
                        color="orange"
                        size="2"
                        style={{ width: '100%' }}
                        onClick={handleGenerateScoring}
                        disabled={isScoringPending}
                      >
                        <StarIcon />
                        {isScoringPending ? 'Generating...' : 'Make Scoring'}
                      </Button>
                    )}

                  {permissions.isOwner && (
                    <Button
                      variant={projectData.isPublic ? 'soft' : 'solid'}
                      color={projectData.isPublic ? 'red' : 'green'}
                      size="2"
                      style={{ width: '100%' }}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            const result = await toggleProjectPublication({
                              projectId: project.id,
                              isCurrentlyPublic: projectData.isPublic,
                            });

                            if (result.success && typeof result.isPublic === 'boolean') {
                              setProject(
                                prev =>
                                  ({
                                    ...prev,
                                    is_public: result.isPublic!,
                                  }) as ProjectWithSnapshot,
                              );
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
                      {projectData.isPublic ? <EyeClosedIcon /> : <GlobeIcon />}
                      {isPending
                        ? projectData.isPublic
                          ? 'Making Private...'
                          : 'Making Public...'
                        : projectData.isPublic
                          ? 'Make Private'
                          : 'Make Public'}
                    </Button>
                  )}

                  {permissions.canEdit && (
                    <Link href={`/projects/${project.id}/edit`} passHref>
                      <Button color="blue" size="2" style={{ width: '100%' }}>
                        <Pencil1Icon />
                        Edit Project
                      </Button>
                    </Link>
                  )}
                </Flex>
              </Flex>
            </Card>

            {/* Links Card */}
            {(projectData.websiteUrls.length > 0 || projectData.repositoryUrls.length > 0) && (
              <Card style={{ width: '100%' }}>
                <Heading size="3" mb="3">
                  Links
                </Heading>
                <Flex direction="column" gap="2">
                  {projectData.websiteUrls.map((url, index) => (
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
                  {projectData.repositoryUrls.map((url, index) => (
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
                  <Heading size="7">{projectData.name}</Heading>
                  {projectData.isPublic && (
                    <Badge color="green" size="1" variant="soft" radius="full">
                      <Flex gap="1" align="center">
                        <CheckCircledIcon />
                        <Text>Public</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>

                {projectData.slogan && (
                  <Text size="3" style={{ fontStyle: 'italic' }} color="gray" mt="1">
                    &ldquo;{projectData.slogan}&rdquo;
                  </Text>
                )}

                <Flex mt="2" gap="3" wrap="wrap">
                  {projectData.location && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <GlobeIcon />
                        <Text>{projectData.location}</Text>
                      </Flex>
                    </Badge>
                  )}

                  {projectData.formattedCreatedAt && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <CalendarIcon />
                        <Text>Created {projectData.formattedCreatedAt}</Text>
                      </Flex>
                    </Badge>
                  )}

                  {projectData.formattedUpdatedAt && (
                    <Badge variant="soft" size="1" radius="full">
                      <Flex gap="1" align="center">
                        <InfoCircledIcon />
                        <Text>Updated {projectData.formattedUpdatedAt}</Text>
                      </Flex>
                    </Badge>
                  )}
                </Flex>
              </Flex>

              <Box>
                <Separator my="3" />
                <Text size="2">{projectData.description}</Text>
              </Box>

              {/* Scoring Brief */}
              {projectData.scoring && (
                <Box>
                  <Separator my="3" />
                  <ProjectScoringBrief
                    scoring={projectData.scoring}
                    onMoreDetails={handleScrollToScoring}
                  />
                </Box>
              )}
            </Flex>
          </Card>

          {/* Documents Section */}
          <ProjectDocuments documents={documents} />

          {/* Team Section */}
          <Box mt="6">
            <ProjectTeam teamMembers={team} />
          </Box>

          {/* Scoring Details Section */}
          {projectData.scoring && (
            <Box mt="6" ref={scrollRef}>
              <ProjectScoringDetails scoring={projectData.scoring} />
            </Box>
          )}

          {/* Additional sections can be added here */}
          {/* For example: milestones, funding rounds, etc. */}
        </Box>
      </Grid>
    </Container>
  );
}
