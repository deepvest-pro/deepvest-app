'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@radix-ui/themes';
import { ProjectStatus } from '@/types/supabase';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { ProjectBasicInfoStep } from '@/components/forms/ProjectBasicInfoStep';
import { ProjectFundingDetailsStep } from '@/components/forms/ProjectFundingDetailsStep';
import {
  TeamCollaborationStep,
  TeamCollaborationFormData,
} from '@/components/forms/TeamCollaborationStep';
import { useToastHelpers } from '@/components/layout/ToastProvider';

interface NewProjectFormProps {
  userFullName?: string;
  userEmail?: string;
}

// Define project form data type
interface ProjectFormData {
  // Basic info
  name: string;
  slug: string;
  description: string;

  // Funding details
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

// Component for project creation form
export default function NewProjectForm({ userFullName = '', userEmail = '' }: NewProjectFormProps) {
  const router = useRouter();
  const { error, success } = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare initial data with current user as first team member
  const initialTeamData: Partial<TeamCollaborationFormData> = {
    teamMembers: [
      {
        name: userFullName,
        email: userEmail,
        role: 'Owner',
        isFounder: true,
      },
    ],
  };

  // Initial form data with required defaults
  const initialFormData: ProjectFormData = {
    name: '',
    slug: '',
    description: '',
    teamMembers: initialTeamData.teamMembers || [],
    inviteCollaborators: [],
  };

  // Handle form completion
  const handleCreateProject = async (formData: ProjectFormData) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const { name, slug, description } = formData;

      // Get team collaboration data (optional)
      const inviteCollaborators = formData.inviteCollaborators || [];

      // Prepare project data
      const projectData = {
        name,
        slug,
        description,
        status: 'idea' as ProjectStatus, // Default status for new projects
      };

      // Create project with proper error handling
      let projectId: string;
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create project');
        }

        const data = await response.json();

        // Now API returns the full project object with a guaranteed ID field
        // If this structure changes, this code needs to be updated
        if (!data.project || !data.project.id) {
          console.error('Invalid project data structure received:', data);
          throw new Error('Invalid response: missing project ID');
        }

        projectId = data.project.id;

        // If collaborators are provided, invite them
        if (inviteCollaborators.length > 0) {
          try {
            await Promise.all(
              inviteCollaborators.map(async collaborator => {
                try {
                  const collabResponse = await fetch(`/api/projects/${projectId}/permissions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: collaborator.email,
                      role: collaborator.role,
                    }),
                  });

                  if (!collabResponse.ok) {
                    console.error('Failed to add collaborator:', collaborator.email);
                  }
                } catch (e) {
                  // Silently catch individual collaborator invite errors
                  console.error(`Error inviting collaborator ${collaborator.email}:`, e);
                }
              }),
            );
          } catch (collabError) {
            // Log but don't throw - collaborator errors shouldn't prevent redirect
            console.error('Error adding collaborators:', collabError);
          }
        }

        // Success! Show message and trigger redirect
        success('Project created successfully!');

        // Manual redirect instead of relying on state change + useEffect
        // This prevents excessive rerenders and prevents infinite loops
        router.push(`/projects/${projectId}`);
      } catch (apiError) {
        console.error('API error creating project:', apiError);
        error(apiError instanceof Error ? apiError.message : 'Failed to create project');
        setIsSubmitting(false);
        return; // Stop execution if project creation failed
      }
    } catch (err) {
      console.error('Error creating project:', err);
      error(err instanceof Error ? err.message : 'An error occurred while creating your project');
      setIsSubmitting(false);
    }
  };

  // Define form steps
  const steps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      component: <ProjectBasicInfoStep onSubmit={() => {}} />,
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
      component: <TeamCollaborationStep onSubmit={() => {}} initialData={initialTeamData} />,
    },
  ];

  return (
    <Card variant="surface">
      <MultiStepForm<ProjectFormData>
        steps={steps}
        onComplete={handleCreateProject}
        isSubmitting={isSubmitting}
        initialData={initialFormData}
      />
    </Card>
  );
}
