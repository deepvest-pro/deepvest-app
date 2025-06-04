'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { Card, Flex, Text, Button } from '@radix-ui/themes';
import { ProjectStatus } from '@/types/supabase';
import { ValidationSchemas } from '@/lib/validations';
import { APIClient } from '@/lib/utils/api';
import { useFormHandler } from '@/hooks/useFormHandler';
import { useToastHelpers } from '@/providers/ToastProvider';
import { StyledInput, StyledTextArea } from '@/components/forms';

interface NewProjectFormProps {
  userFullName?: string;
  userEmail?: string;
}

interface SlugCheckResponse {
  available: boolean;
  error?: string;
}

interface ProjectCreateResponse {
  id: string;
  name: string;
  slug: string;
}

// Project creation form data type from validation schema
type ProjectCreateFormData = {
  name: string;
  slug: string;
  description: string;
};

export default function NewProjectForm({}: NewProjectFormProps) {
  const router = useRouter();
  const { success } = useToastHelpers();
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const form = useFormHandler({
    schema: ValidationSchemas.project.create,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
    onSubmit: async (formData: ProjectCreateFormData) => {
      try {
        if (slugAvailable === false) {
          throw new Error('URL is not available');
        }

        // Create the project with basic info
        const projectData = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          status: 'idea' as ProjectStatus,
        };

        const response = await APIClient.post('/projects', projectData);

        if (!response.success) {
          throw new Error(response.error || 'Failed to create project');
        }

        const createdProject = response.data as ProjectCreateResponse;
        success('Project created successfully!');
        router.push(`/projects/${createdProject?.id}`);

        return { success: true };
      } catch (error) {
        console.error('Error creating project:', error);
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    onSuccess: () => {
      // Additional success actions can be added here if needed
    },
  });

  const watchedName = form.watch('name');
  const watchedSlug = form.watch('slug');

  // Auto-generate slug from name when name changes and slug is empty
  useEffect(() => {
    // Only auto-generate if name exists and slug is empty
    if (watchedName && !watchedSlug) {
      const generatedSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      form.setValue('slug', generatedSlug);
    }
  }, [watchedName, watchedSlug, form]);

  // Check slug availability with debounce
  useEffect(() => {
    // Reset states when slug changes
    setSlugError(null);

    if (!watchedSlug || watchedSlug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const response = await APIClient.get(
          `/projects/check-slug?slug=${encodeURIComponent(watchedSlug)}`,
        );

        if (!response.success) {
          setSlugError(response.error || 'Failed to check URL availability');
          setSlugAvailable(false);
        } else {
          const data = response.data as SlugCheckResponse;
          if (data.error) {
            setSlugError(data.error);
            setSlugAvailable(false);
          } else {
            setSlugAvailable(data.available);
          }
        }
      } catch (error) {
        console.error('Error checking slug:', error);
        setSlugError('Failed to check URL availability. Please try again.');
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedSlug]);

  return (
    <Card variant="surface">
      <form onSubmit={form.handleSubmit} className="basic-info-form">
        <Flex direction="column" gap="4" p="4">
          <StyledInput
            id="name"
            label="Project Name"
            placeholder="Enter your project name"
            register={form.register('name')}
            error={form.formState.errors.name}
            disabled={form.isLoading}
            required
          />

          <div>
            <StyledInput
              id="slug"
              label="Project URL"
              placeholder="your-project-url"
              register={form.register('slug')}
              error={form.formState.errors.slug}
              disabled={form.isLoading}
              required
            />

            <Flex gap="1" mt="1" align="center">
              {isCheckingSlug && <Text size="1">Checking availability...</Text>}
              {slugAvailable === true && (
                <Text size="1" color="green">
                  <CheckCircledIcon /> URL is available
                </Text>
              )}
              {slugAvailable === false && !slugError && (
                <Text size="1" color="red">
                  <CrossCircledIcon /> URL is already taken
                </Text>
              )}
              {slugError && (
                <Text size="1" color="red">
                  <CrossCircledIcon /> {slugError}
                </Text>
              )}
            </Flex>

            <Text size="1" color="gray" mt="1">
              <InfoCircledIcon /> This will be your project&apos;s URL: deepvest.io/projects/
              {watchedSlug || 'your-project-url'}
            </Text>
          </div>

          <StyledTextArea
            id="description"
            label="Description"
            placeholder="Describe your project in a few sentences..."
            register={form.register('description')}
            error={form.formState.errors.description}
            disabled={form.isLoading}
            rows={6}
            maxLength={1000}
            showCharCount
            required
          />

          <Flex justify="end">
            <Button type="submit" disabled={form.isLoading || slugAvailable === false}>
              {form.isLoading ? 'Creating Project...' : 'Create Project'}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
