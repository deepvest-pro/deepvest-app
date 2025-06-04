'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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
  AspectRatio,
  Badge,
  AlertDialog,
  Separator,
} from '@radix-ui/themes';
import {
  CalendarIcon,
  ArrowLeftIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { ProjectWithSnapshot, ProjectPermission, TeamMember } from '@/types/supabase';
import { formatDate } from '@/lib/utils/format';
import { deleteProject } from '@/app/projects/[id]/actions';
import { useProjectPermissions } from '@/lib/hooks/useProjectData';
import { getCurrentUser } from '@/lib/supabase/client';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Import section components
import {
  SectionNavigation,
  ProjectSection,
} from '@/components/forms/EditProjectSections/SectionNavigation';
import { CommonInfoSection } from '@/components/forms/EditProjectSections/CommonInfoSection';
import { DocumentsSection } from '@/components/forms/EditProjectSections/DocumentsSection';
import { FundingSection } from '@/components/forms/EditProjectSections/FundingSection';
import { MilestonesSection } from '@/components/forms/EditProjectSections/MilestonesSection';
import { TeamMembersSection } from '@/components/forms/EditProjectSections/TeamMembersSection';

// Type for project with details (matching getProjectWithDetails return)
type ProjectWithDetails = ProjectWithSnapshot & {
  permissions: ProjectPermission[];
};

interface EditProjectContentProps {
  project: ProjectWithDetails;
}

export function EditProjectContent({ project }: EditProjectContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error } = useToastHelpers();

  // Get current section from URL params, default to 'common'
  const currentSection = (searchParams.get('section') as ProjectSection) || 'common';

  // State for tracking completed sections and loading states
  const [completedSections, setCompletedSections] = useState<Set<ProjectSection>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // State for delete functionality
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get user permissions
  const permissions = useProjectPermissions(project, userId || undefined);

  // Get current snapshot data for editing
  const isEditingDraft =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;
  const currentSnapshot = isEditingDraft ? project.new_snapshot : project.public_snapshot;

  // Get current snapshot data
  const projectName = currentSnapshot?.name || 'Unnamed Project';
  const projectStatus = currentSnapshot?.status || 'idea';
  const logoUrl = currentSnapshot?.logo_url;
  const bannerUrl = currentSnapshot?.banner_url;

  const loadTeamMembers = useCallback(async () => {
    setTeamLoading(true);
    try {
      const { getTeamMembers } = await import('@/lib/api/team-api');
      const teamMembers = await getTeamMembers(project.id);
      setTeamMembers(teamMembers || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  }, [project.id]);

  // Load team members when component mounts or when switching to team section
  useEffect(() => {
    if (currentSection === 'team') {
      loadTeamMembers();
    }
  }, [currentSection, project.id, loadTeamMembers]);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  // Prepare initial data for sections
  const commonInfoData = {
    name: currentSnapshot?.name || project.slug || '',
    slug: project.slug,
    slogan: currentSnapshot?.slogan || '',
    description: currentSnapshot?.description || '',
    status: currentSnapshot?.status || 'idea',
    country: currentSnapshot?.country || '',
    city: currentSnapshot?.city || '',
    website_urls: currentSnapshot?.website_urls || [],
    logo_url: currentSnapshot?.logo_url || undefined,
    banner_url: currentSnapshot?.banner_url || undefined,
  };

  const fundingData = {
    fundingGoal: undefined, // Not stored in DB yet
    currency: 'USD',
    investmentStage: '',
    timeline: {
      startDate: '',
      endDate: '',
    },
  };

  const milestonesData = {
    milestones: [], // Not stored in DB yet
  };

  // Generic save handler for all sections
  const handleSectionSave = async (sectionId: ProjectSection, data: Record<string, unknown>) => {
    setIsLoading(true);

    try {
      let snapshotData: Record<string, unknown> = {};

      // Prepare data based on section
      switch (sectionId) {
        case 'common':
          snapshotData = {
            name: data.name,
            slogan: data.slogan || null,
            description: data.description,
            status: data.status,
            country: data.country || null,
            city: data.city || null,
            website_urls: data.website_url ? [data.website_url] : [],
            logo_url: data.logo_url || null,
            banner_url: data.banner_url || null,
          };
          break;

        case 'funding':
          // For now, funding data is not saved to DB as the schema doesn't support it yet
          success('Funding information saved locally (DB schema update needed)');
          setCompletedSections(prev => new Set([...prev, sectionId]));
          return;

        case 'milestones':
          // For now, milestones data is not saved to DB as the schema doesn't support it yet
          success('Milestones saved locally (DB schema update needed)');
          setCompletedSections(prev => new Set([...prev, sectionId]));
          return;

        default:
          throw new Error(`Unknown section: ${sectionId}`);
      }

      // Create/update snapshot for common info
      const response = await fetch(`/api/projects/${project.id}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snapshotData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      // If slug changed in common info, also update the project
      if (sectionId === 'common' && data.slug && data.slug !== project.slug) {
        const projectResponse = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: data.slug }),
        });

        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();
          console.error('Failed to update project slug:', errorData);
          throw new Error(errorData.error || 'Failed to update project slug');
        }
      }

      // Mark section as completed
      setCompletedSections(prev => new Set([...prev, sectionId]));
    } catch (err) {
      console.error(`Error saving ${sectionId} section:`, err);
      throw err; // Re-throw to let section handle the error display
    } finally {
      setIsLoading(false);
    }
  };

  // Render current section
  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'common':
        return (
          <CommonInfoSection
            initialData={commonInfoData}
            projectId={project.id}
            onSave={data => handleSectionSave('common', data)}
            isLoading={isLoading}
          />
        );

      case 'documents':
        return <DocumentsSection projectId={project.id} />;

      case 'funding':
        return (
          <FundingSection
            initialData={fundingData}
            projectId={project.id}
            onSave={data => handleSectionSave('funding', data)}
            isLoading={isLoading}
          />
        );

      case 'milestones':
        return (
          <MilestonesSection
            initialData={milestonesData}
            projectId={project.id}
            onSave={data => handleSectionSave('milestones', data)}
            isLoading={isLoading}
          />
        );

      case 'team':
        return (
          <TeamMembersSection
            projectId={project.id}
            teamMembers={teamMembers}
            onTeamMembersChange={setTeamMembers}
            isLoading={teamLoading}
          />
        );

      default:
        return (
          <Card size="3">
            <Box p="5">
              <Text>Section not found</Text>
            </Box>
          </Card>
        );
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

        {/* Navigation Buttons */}
        <Box position="absolute" top="3" left="3">
          <Flex gap="2">
            <Link href={`/projects/${project.id}`} passHref>
              <Button variant="solid" color="gray" size="2">
                <ArrowLeftIcon />
                Back to Project
              </Button>
            </Link>
          </Flex>
        </Box>
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

            {/* Section Navigation */}
            <Card style={{ width: '100%' }}>
              <Heading size="3" mb="3">
                Edit Sections
              </Heading>
              <SectionNavigation
                currentSection={currentSection}
                projectId={project.id}
                completedSections={completedSections}
                hasUnsavedChanges={false} // TODO: Implement unsaved changes detection
                isVertical={true}
              />
            </Card>

            {/* Project Details Card */}
            <Card style={{ width: '100%' }}>
              <Flex direction="column" gap="3">
                {/* Project Status */}
                <Heading size="3">Project Status</Heading>
                <Flex direction="column" gap="2">
                  <StatusBadge
                    status={projectStatus}
                    type="project"
                    size="2"
                    variant="soft"
                    showIcon={true}
                  />

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

                {/* Editing Mode Indicator */}
                <Box
                  style={{
                    padding: '12px',
                    backgroundColor: isEditingDraft ? 'var(--amber-2)' : 'var(--blue-2)',
                    borderRadius: 'var(--radius-3)',
                    border: `1px solid ${isEditingDraft ? 'var(--amber-6)' : 'var(--blue-6)'}`,
                  }}
                >
                  <Badge size="2" color={isEditingDraft ? 'amber' : 'blue'} mb="2">
                    {isEditingDraft ? 'Editing Draft' : 'Creating New Draft'}
                  </Badge>
                  <div>
                    <Text size="2" color={isEditingDraft ? 'amber' : 'blue'}>
                      {isEditingDraft
                        ? '📝 You are editing a draft version. Changes will be saved to your draft until published.'
                        : '✨ You are creating a new draft. A new version will be created when you save changes.'}
                    </Text>
                  </div>
                </Box>

                {/* Progress Indicator */}
                <Box
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--green-2)',
                    borderRadius: 'var(--radius-3)',
                    border: '1px solid var(--green-6)',
                  }}
                >
                  <Text size="2" weight="medium" color="green" mb="2" style={{ display: 'block' }}>
                    📊 Completion Progress
                  </Text>
                  <Text size="2" color="green">
                    {completedSections.size} of 5 sections completed
                  </Text>
                  <Box
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'var(--green-4)',
                      borderRadius: '3px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      style={{
                        width: `${(completedSections.size / 5) * 100}%`,
                        height: '100%',
                        backgroundColor: 'var(--green-9)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>

                {/* Delete Project Section */}
                {permissions.isOwner && (
                  <>
                    <Separator my="2" />
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
                  </>
                )}
              </Flex>
            </Card>
          </Flex>
        </Box>

        {/* Right Column - Edit Content */}
        <Box style={{ gridColumn: 'span 3' }}>
          {/* Current Section Content */}
          {renderCurrentSection()}
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
                        success('Project deleted successfully');
                        router.push('/projects');
                      } else {
                        error(result.error || 'Failed to delete project');
                        setShowDeleteDialog(false);
                      }
                    } catch (deleteError) {
                      console.error('Delete project error:', deleteError);
                      error('An unexpected error occurred while deleting project.');
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
