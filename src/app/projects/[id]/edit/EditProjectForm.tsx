'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Box, Text } from '@radix-ui/themes';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { ProjectBasicInfoStep } from '@/components/forms/ProjectBasicInfoStep';
import { ProjectFundingDetailsStep } from '@/components/forms/ProjectFundingDetailsStep';
import {
  TeamCollaborationStep,
  TeamCollaborationFormData,
} from '@/components/forms/TeamCollaborationStep';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { Project, Snapshot, ProjectPermission } from '@/types/supabase';

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

// Define project form data type (simplified to match actual DB schema)
interface ProjectFormData {
  // Basic info
  name: string;
  slug: string;
  description: string;

  // Funding details (optional fields)
  fundingGoal?: number;
  currency?: string;
  timeline?: {
    startDate?: string;
    endDate?: string;
  };
  milestones?: Array<{
    title: string;
    description: string;
    targetDate?: string;
    status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  }>;

  // Team members from TeamCollaborationFormData
  teamMembers: TeamCollaborationFormData['teamMembers'];
  inviteCollaborators: TeamCollaborationFormData['inviteCollaborators'];

  // Add index signature to satisfy FormData constraint
  [key: string]: unknown;
}

export default function EditProjectForm({
  project,
  userFullName = '',
  userEmail = '',
}: EditProjectFormProps) {
  const router = useRouter();
  const { error, success } = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current snapshot data for editing
  // If new_snapshot_id exists and differs from public_snapshot_id, we're editing a draft
  // Otherwise, we're starting from the published version
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

  // Prepare initial form data from current project/snapshot
  const initialFormData: ProjectFormData = {
    // Basic info from project/snapshot
    name: currentSnapshot?.name || project.slug || '',
    slug: project.slug,
    description: currentSnapshot?.description || '',

    // Funding details - initialize with empty values since they're not stored in DB yet
    fundingGoal: undefined,
    currency: 'USD',
    timeline: {
      startDate: undefined,
      endDate: undefined,
    },
    milestones: [],

    // Team members - for now, just include current user
    // TODO: Load actual team members from project permissions
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

  // Handle form completion - update project via snapshot
  const handleUpdateProject = async (formData: ProjectFormData) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const { name, slug, description } = formData;
      // Note: Funding details (fundingGoal, currency, timeline, milestones) are not saved yet
      // as they don't exist in the current database schema

      // Prepare snapshot data with only fields that exist in DB
      const snapshotData = {
        name,
        description,
        // Keep existing snapshot fields that we don't edit
        status: currentSnapshot?.status || 'idea',
        slogan: currentSnapshot?.slogan,
        country: currentSnapshot?.country,
        city: currentSnapshot?.city,
        repository_urls: currentSnapshot?.repository_urls,
        website_urls: currentSnapshot?.website_urls,
        logo_url: currentSnapshot?.logo_url,
        banner_url: currentSnapshot?.banner_url,
        video_urls: currentSnapshot?.video_urls,
      };

      // Create/update snapshot
      const response = await fetch(`/api/projects/${project.id}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snapshotData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // If slug changed, also update the project
      if (slug && slug !== project.slug) {
        console.log('Updating project slug from', project.slug, 'to', slug);
        const projectResponse = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug }),
        });

        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();
          console.error('Failed to update project slug:', errorData);
          throw new Error(errorData.error || 'Failed to update project slug');
        }

        console.log('Project slug updated successfully');
      }

      // Success! Show message and redirect
      const successMessage = isEditingDraft
        ? 'Draft updated successfully!'
        : 'Draft created successfully!';
      success(successMessage);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error('Error updating project:', err);
      error(err instanceof Error ? err.message : 'An error occurred while updating your project');
      setIsSubmitting(false);
    }
  };

  // Define form steps
  const steps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      component: <ProjectBasicInfoStep onSubmit={() => {}} currentSlug={project.slug} />,
    },
    {
      id: 'funding-details',
      title: 'Funding & Timeline',
      component: <ProjectFundingDetailsStep onSubmit={() => {}} />,
      isOptional: true,
    },
    {
      id: 'team-collaboration',
      title: 'Team & Collaboration',
      component: <TeamCollaborationStep onSubmit={() => {}} />,
    },
  ];

  return (
    <Card variant="surface">
      {/* Show editing mode indicator */}
      <Box
        mb="4"
        p="3"
        style={{
          backgroundColor: isEditingDraft ? 'var(--amber-3)' : 'var(--blue-3)',
          borderRadius: 'var(--radius-2)',
        }}
      >
        <Text size="2" color={isEditingDraft ? 'amber' : 'blue'}>
          {isEditingDraft
            ? '📝 You are editing a draft version. Changes will be saved to your draft until published.'
            : '✨ You are creating a new draft. A new version will be created when you save changes.'}
        </Text>
      </Box>

      <MultiStepForm<ProjectFormData>
        steps={steps}
        onComplete={handleUpdateProject}
        isSubmitting={isSubmitting}
        initialData={initialFormData}
        submitButtonText={isEditingDraft ? 'Update Draft' : 'Create Draft'}
        submittingText={isEditingDraft ? 'Updating Draft...' : 'Creating Draft...'}
        successMessage="Project successfully updated!"
      />
    </Card>
  );
}
