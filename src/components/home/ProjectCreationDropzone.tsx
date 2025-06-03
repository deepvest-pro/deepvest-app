'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@/lib/react-query/auth-queries-client';
import { useRouter } from 'next/navigation';
import { Card, Text, Button, Flex, Box } from '@radix-ui/themes';
import {
  UploadIcon,
  FileTextIcon,
  ReloadIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import type { ProjectDataFromAI } from '@/types/ai';
import { generateUniqueSlug } from '@/lib/validations/project';
import { validateFile } from '@/lib/utils/file-validation';
import { generateTemporaryProjectData, splitProjectData } from '@/lib/utils/project-helpers';
import {
  createProject,
  createSnapshot,
  updateSnapshot,
  updateProject,
  uploadFile,
  createDocument,
  transcribeFile,
  generateProjectData,
  updateDocument,
  createTeamFromAI,
} from '@/lib/api/project-api';

type ProcessingStep =
  | 'idle'
  | 'validating'
  | 'creating-project'
  | 'creating-snapshot'
  | 'uploading-file'
  | 'creating-document'
  | 'transcribing'
  | 'generating-data'
  | 'updating-project'
  | 'adding-owner'
  | 'completed'
  | 'error';

interface ProcessingState {
  step: ProcessingStep;
  progress: number; // 0-100
  message: string;
}

export function ProjectCreationDropzone() {
  const { data: user } = useUser();
  const router = useRouter();
  const { success, error } = useToastHelpers();

  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    message: 'Ready to upload',
  });

  const updateProcessingStep = useCallback(
    (step: ProcessingStep, progress: number, message: string) => {
      setProcessing({
        step,
        progress,
        message,
      });
    },
    [],
  );

  const updateProjectWithAI = useCallback(
    async (projectId: string, projectData: ProjectDataFromAI) => {
      // Split data between project and snapshot fields
      const { projectFields, snapshotFields } = splitProjectData(projectData);

      // Generate unique slug if name is provided
      if (projectData.name) {
        const uniqueSlug = await generateUniqueSlug(projectData.name);
        projectFields.slug = uniqueSlug;
      }

      // Update project if there are project fields to update
      if (Object.keys(projectFields).length > 0) {
        await updateProject(projectId, projectFields);
      }

      // Update snapshot if there are snapshot fields to update
      if (Object.keys(snapshotFields).length > 0) {
        await updateSnapshot(projectId, snapshotFields);
      }
    },
    [],
  );

  const processFile = useCallback(
    async (file: File) => {
      try {
        // Check if user is available
        if (!user?.id) {
          throw new Error('User authentication required');
        }

        // Step 1: Validate file
        updateProcessingStep('validating', 10, 'Validating file...');
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Step 2: Create temporary project
        updateProcessingStep('creating-project', 20, 'Creating project...');
        const tempProjectData = generateTemporaryProjectData();
        const projectResponse = await createProject(tempProjectData, true); // Skip auto team creation
        const project = projectResponse.project;

        // Step 3: Create snapshot
        updateProcessingStep('creating-snapshot', 30, 'Setting up project structure...');
        await createSnapshot(project.id);

        // Step 4: Upload file
        updateProcessingStep('uploading-file', 40, 'Uploading presentation...');
        const uploadResult = await uploadFile(project.id, file);

        // Step 5: Create document
        updateProcessingStep('creating-document', 50, 'Creating document entry...');
        const documentResult = await createDocument(
          project.id,
          file.name,
          uploadResult.fileUrl || uploadResult.imageUrl,
        );

        // Step 6: Transcribe file
        updateProcessingStep('transcribing', 60, 'Extracting content from presentation...');
        const transcriptionResult = await transcribeFile(
          uploadResult.fileUrl || uploadResult.imageUrl,
        );

        // Step 7: Generate project data
        updateProcessingStep('generating-data', 70, 'Generating project data with AI...');
        const userData = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
        };
        const aiProjectData = await generateProjectData(transcriptionResult.result, userData);

        // Step 8: Update project with AI data
        updateProcessingStep('updating-project', 80, 'Finalizing project...');
        await updateProjectWithAI(project.id, aiProjectData);

        // Update document with transcription
        await updateDocument(project.id, documentResult.document.id, transcriptionResult.result);

        // Step 9: Create team members from AI data
        updateProcessingStep('adding-owner', 90, 'Setting up project team...');
        if (aiProjectData.team && aiProjectData.team.length > 0) {
          const createdMembers = await createTeamFromAI(project.id, aiProjectData.team, user.id);
          console.log(`Created ${createdMembers.length} team members from presentation`);
        } else {
          console.log('No team data found in presentation, skipping team creation');
        }

        // Step 10: Complete
        updateProcessingStep('completed', 100, 'Project created successfully!');

        success('Project created successfully from your presentation!');

        // Redirect to the created project after a short delay
        setTimeout(() => {
          router.push(`/projects/${project.id}`);
        }, 1500);
      } catch (err) {
        console.error('Error processing file:', err);
        updateProcessingStep(
          'error',
          0,
          err instanceof Error ? err.message : 'Unknown error occurred',
        );
        setProcessing({
          step: 'error',
          progress: 0,
          message: err instanceof Error ? err.message : 'Unknown error occurred',
        });
        error('Failed to create project from presentation');
      }
    },
    [updateProcessingStep, success, error, router, user, updateProjectWithAI],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (!user) {
        error('Please sign in to create projects');
        router.push('/auth/sign-in');
        return;
      }

      if (processing.step !== 'idle' && processing.step !== 'error') {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [user, processing.step, router, error, processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) {
        error('Please sign in to create projects');
        router.push('/auth/sign-in');
        return;
      }

      if (processing.step !== 'idle' && processing.step !== 'error') {
        return;
      }

      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [user, processing.step, router, error, processFile],
  );

  const handleTryAgain = () => {
    setProcessing({
      step: 'idle',
      progress: 0,
      message: 'Ready to upload',
    });
  };

  const handleSignInClick = () => {
    router.push('/auth/sign-in');
  };

  const isProcessing =
    processing.step !== 'idle' && processing.step !== 'error' && processing.step !== 'completed';
  const isError = processing.step === 'error';
  const isCompleted = processing.step === 'completed';

  return (
    <Card
      size="4"
      style={{
        border: isDragOver ? '2px dashed var(--accent-9)' : '2px dashed var(--gray-6)',
        backgroundColor: isDragOver ? 'var(--accent-2)' : 'var(--gray-1)',
        transition: 'all 0.2s ease',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Flex direction="column" align="center" gap="4" p="6">
        {/* Icon */}
        <Box>
          {isProcessing ? (
            <ReloadIcon
              width="48"
              height="48"
              style={{ color: 'var(--accent-9)', animation: 'spin 1s linear infinite' }}
            />
          ) : isCompleted ? (
            <CheckIcon width="48" height="48" style={{ color: 'var(--green-9)' }} />
          ) : isError ? (
            <ExclamationTriangleIcon width="48" height="48" style={{ color: 'var(--red-9)' }} />
          ) : (
            <UploadIcon width="48" height="48" style={{ color: 'var(--gray-9)' }} />
          )}
        </Box>

        {/* Main Content */}
        {!user ? (
          <Flex direction="column" align="center" gap="3">
            <Text size="5" weight="bold" align="center">
              Transform Your Presentation into a Project
            </Text>
            <Text size="3" color="gray" align="center">
              Sign in to upload your PDF presentation and automatically create a professional
              project profile
            </Text>
            <Button size="3" onClick={handleSignInClick}>
              Sign In to Get Started
            </Button>
          </Flex>
        ) : isProcessing || isCompleted ? (
          <Flex direction="column" align="center" gap="3" style={{ width: '100%' }}>
            <Text size="5" weight="bold" align="center">
              {processing.message}
            </Text>

            {/* Progress Bar */}
            <Box style={{ width: '100%', maxWidth: '300px' }}>
              <Box
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--gray-4)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: `${processing.progress}%`,
                    height: '100%',
                    backgroundColor: isCompleted ? 'var(--green-9)' : 'var(--accent-9)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Text size="2" color="gray" align="center" mt="2">
                {processing.progress}% complete
              </Text>
            </Box>

            {/* Warning text only during processing */}
            {processing.step !== 'idle' &&
              processing.step !== 'completed' &&
              processing.step !== 'error' && (
                <Text size="2" color="orange" align="center" style={{ fontStyle: 'italic' }}>
                  Please do not close this window - the process will be interrupted
                </Text>
              )}

            {/* Completion message */}
            {isCompleted && (
              <Text size="3" color="green" align="center">
                Redirecting to your new project...
              </Text>
            )}
          </Flex>
        ) : isError ? (
          <Flex direction="column" align="center" gap="3">
            <Text size="5" weight="bold" color="red" align="center">
              Upload Failed
            </Text>
            <Text size="3" color="gray" align="center">
              {processing.message}
            </Text>
            <Button size="3" onClick={handleTryAgain}>
              Try Again
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap="3">
            <Text size="5" weight="bold" align="center">
              Drop Your Presentation Here
            </Text>
            <Text size="3" color="gray" align="center">
              Upload a PDF presentation to automatically create a project with AI-powered content
              extraction
            </Text>

            <Flex align="center" gap="2">
              <FileTextIcon width="16" height="16" />
              <Text size="2" color="gray">
                PDF files only, max 10MB
              </Text>
            </Flex>

            <Text size="3" color="gray" align="center">
              or
            </Text>

            <Button size="3" asChild>
              <label style={{ cursor: 'pointer' }}>
                Browse Files
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={isProcessing}
                />
              </label>
            </Button>
          </Flex>
        )}
      </Flex>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Card>
  );
}
