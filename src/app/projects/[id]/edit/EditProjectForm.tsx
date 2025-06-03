'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Box, Text, Flex, Heading, Badge } from '@radix-ui/themes';
import { Project, Snapshot, ProjectPermission } from '@/types/supabase';
import { useToastHelpers } from '@/components/layout/ToastProvider';

// Import section components
import {
  SectionNavigation,
  ProjectSection,
} from '@/components/forms/EditProjectSections/SectionNavigation';
import { CommonInfoSection } from '@/components/forms/EditProjectSections/CommonInfoSection';
import { DocumentsSection } from '@/components/forms/EditProjectSections/DocumentsSection';
import { FundingSection } from '@/components/forms/EditProjectSections/FundingSection';
import { MilestonesSection } from '@/components/forms/EditProjectSections/MilestonesSection';
import { TeamSection } from '@/components/forms/EditProjectSections/TeamSection';

// Type for project with details (matching getProjectWithDetails return)
type ProjectWithDetails = Project & {
  permissions: ProjectPermission[];
  public_snapshot: Snapshot | null;
  new_snapshot: Snapshot | null;
};

interface EditProjectFormProps {
  project: ProjectWithDetails;
  userFullName?: string;
  userEmail?: string;
}

export default function EditProjectForm({
  project,
  userFullName = '',
  userEmail = '',
}: EditProjectFormProps) {
  const searchParams = useSearchParams();
  const { success } = useToastHelpers();

  // Get current section from URL params, default to 'common'
  const currentSection = (searchParams.get('section') as ProjectSection) || 'common';

  // State for tracking completed sections and loading states
  const [completedSections, setCompletedSections] = useState<Set<ProjectSection>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Get current snapshot data for editing
  const isEditingDraft =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;
  const currentSnapshot = isEditingDraft ? project.new_snapshot : project.public_snapshot;

  console.log('EditProjectForm - Snapshot logic:', {
    public_snapshot_id: project.public_snapshot_id,
    new_snapshot_id: project.new_snapshot_id,
    isEditingDraft,
    currentSnapshotId: currentSnapshot?.id,
    currentSnapshotName: currentSnapshot?.name,
    willCreateNewSnapshot: !isEditingDraft,
  });

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

  const teamData = {
    teamMembers: [
      {
        name: userFullName,
        email: userEmail,
        role: 'Owner',
        isFounder: true,
      },
    ],
    inviteCollaborators: [],
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
          console.log('Funding data (not saved to DB yet):', data);
          success('Funding information saved locally (DB schema update needed)');
          setCompletedSections(prev => new Set([...prev, sectionId]));
          return;

        case 'milestones':
          // For now, milestones data is not saved to DB as the schema doesn't support it yet
          console.log('Milestones data (not saved to DB yet):', data);
          success('Milestones saved locally (DB schema update needed)');
          setCompletedSections(prev => new Set([...prev, sectionId]));
          return;

        case 'team':
          // For now, team data is not saved to DB as the schema doesn't support it yet
          console.log('Team data (not saved to DB yet):', data);
          success('Team information saved locally (DB schema update needed)');
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
        console.log('Updating project slug from', project.slug, 'to', data.slug);
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

        console.log('Project slug updated successfully');
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
          <TeamSection
            initialData={teamData}
            projectId={project.id}
            onSave={data => handleSectionSave('team', data)}
            isLoading={isLoading}
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
    <Box>
      {/* Header with editing mode indicator */}
      <Card variant="surface" mb="4">
        <Box p="4">
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="6">Edit Project</Heading>
              <Badge size="2" color={isEditingDraft ? 'amber' : 'blue'}>
                {isEditingDraft ? 'Editing Draft' : 'Creating New Draft'}
              </Badge>
            </Flex>

            <Text size="2" color={isEditingDraft ? 'amber' : 'blue'}>
              {isEditingDraft
                ? '📝 You are editing a draft version. Changes will be saved to your draft until published.'
                : '✨ You are creating a new draft. A new version will be created when you save changes.'}
            </Text>
          </Flex>
        </Box>
      </Card>

      {/* Section Navigation */}
      <SectionNavigation
        currentSection={currentSection}
        projectId={project.id}
        completedSections={completedSections}
        hasUnsavedChanges={false} // TODO: Implement unsaved changes detection
      />

      {/* Current Section Content */}
      {renderCurrentSection()}
    </Box>
  );
}
