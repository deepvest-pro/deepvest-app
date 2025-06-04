'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Text,
  Heading,
  Avatar,
  Card,
  Grid,
  Button,
  Separator,
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
import { StatusBadge, HeroSection } from '@/components/ui';
import { ResponsiveContainer } from '@/components/layout';
import {
  ProjectDocuments,
  ProjectScoringBrief,
  ProjectScoringDetails,
  ProjectTeam,
} from '@/components/projects';
import { useToastHelpers } from '@/providers/ToastProvider';
import styles from './ProjectContent.module.scss';

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
      <Box>
        <HeroSection
          title="PROJECT NOT FOUND"
          subtitle="DeepVest"
          description="The requested project could not be loaded."
        />

        <ResponsiveContainer size="3" py="9">
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
        </ResponsiveContainer>
      </Box>
    );
  }

  return (
    <Box className={styles.projectContainer}>
      {/* Hero Section with Project Banner */}
      <Box className={styles.heroSection}>
        {/* Background Banner */}
        <Box
          className={styles.heroBackground}
          style={{
            background: projectData.bannerUrl
              ? `url(${projectData.bannerUrl})`
              : 'var(--gradient-hero)',
          }}
        />

        {/* Overlay */}
        <Box className={styles.heroOverlay} />

        {/* Hero Content */}
        <ResponsiveContainer size="4" style={{ position: 'relative', zIndex: 2 }}>
          <Flex direction="column" align="start" gap="6" py="8" style={{ minHeight: '400px' }}>
            <Flex direction="column" gap="4" className={styles.heroContent}>
              <Text size="2" weight="medium" className={styles.heroSubtitle}>
                Project Details
              </Text>

              <Heading size="9" weight="bold" className={styles.heroTitle}>
                {projectData.name}
              </Heading>

              {projectData.slogan && (
                <Text size="4" className={styles.heroSlogan}>
                  &ldquo;{projectData.slogan}&rdquo;
                </Text>
              )}

              {/* Project Badges */}
              <Flex gap="3" wrap="wrap" mt="4" className={styles.heroBadges}>
                <Badge color="green" size="2" variant="soft" radius="full">
                  <Flex gap="1" align="center">
                    <CheckCircledIcon />
                    <Text>{projectData.isPublic ? 'Public' : 'Private'}</Text>
                  </Flex>
                </Badge>

                {projectData.location && (
                  <Badge variant="soft" size="2" radius="full">
                    <Flex gap="1" align="center">
                      <GlobeIcon />
                      <Text>{projectData.location}</Text>
                    </Flex>
                  </Badge>
                )}

                {projectData.formattedCreatedAt && (
                  <Badge variant="soft" size="2" radius="full">
                    <Flex gap="1" align="center">
                      <CalendarIcon />
                      <Text>Created {projectData.formattedCreatedAt}</Text>
                    </Flex>
                  </Badge>
                )}
              </Flex>
            </Flex>
          </Flex>
        </ResponsiveContainer>
      </Box>

      {/* Main Content */}
      <ResponsiveContainer size="4" py="8">
        <Grid columns={{ initial: '1', md: '4' }} gap="6" className={styles.projectGrid}>
          {/* Left Column - Project Info */}
          <Box style={{ gridColumn: 'span 1' }} className={styles.leftColumn}>
            <Flex direction="column" gap="4">
              {/* Logo */}
              <Box className={styles.logoContainer}>
                <Avatar
                  size="8"
                  src={projectData.logoUrl || undefined}
                  alt="Project Logo"
                  radius="full"
                  fallback={getInitials(projectData.name)}
                  className={styles.projectLogo}
                />
              </Box>

              {/* Project Details Card */}
              <Card style={{ width: '100%' }} className={styles.projectCard}>
                <Flex direction="column" gap="3">
                  {/* Project Status */}
                  <Heading size="3">Project Status</Heading>
                  <Flex direction="column" gap="2">
                    <StatusBadge status={projectData.status} />

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
                  <Flex direction="column" gap="2" className={styles.projectActions}>
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
          <Box style={{ gridColumn: 'span 3' }} className={styles.rightColumn}>
            {/* Project Description */}
            <Card mb="6" className={styles.projectCard}>
              <Flex direction="column" gap="4">
                <Box className={styles.aboutSection}>
                  <Heading size="5" mb="3" className={styles.aboutTitle}>
                    About This Project
                  </Heading>
                  <Text size="3" className={styles.aboutText}>
                    {projectData.description}
                  </Text>
                </Box>

                {/* Additional Project Info */}
                {projectData.formattedUpdatedAt && (
                  <Box>
                    <Separator my="3" />
                    <Flex gap="3" wrap="wrap" className={styles.projectBadges}>
                      <Badge variant="soft" size="1" radius="full">
                        <Flex gap="1" align="center">
                          <InfoCircledIcon />
                          <Text>Updated {projectData.formattedUpdatedAt}</Text>
                        </Flex>
                      </Badge>
                    </Flex>
                  </Box>
                )}

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
      </ResponsiveContainer>
    </Box>
  );
}
