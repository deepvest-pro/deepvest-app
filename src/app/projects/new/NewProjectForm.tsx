'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { Card, Flex, TextField, TextArea, Text, Button } from '@radix-ui/themes';
import { ProjectStatus } from '@/types/supabase';
import { useToastHelpers } from '@/components/layout/ToastProvider';

interface NewProjectFormProps {
  userFullName?: string;
  userEmail?: string;
}

const projectBasicInfoSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),
  slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .max(63, 'URL must be less than 63 characters')
    .regex(/^[a-z0-9-]+$/, 'URL can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'URL must start with a letter or number')
    .regex(/[a-z0-9]$/, 'URL must end with a letter or number'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type ProjectBasicInfoFormData = z.infer<typeof projectBasicInfoSchema>;

interface SlugCheckResponse {
  available: boolean;
  error?: string;
}

// Component for project creation form
export default function NewProjectForm({}: NewProjectFormProps) {
  const router = useRouter();
  const { error, success } = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectBasicInfoFormData>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const watchedName = watch('name');
  const watchedSlug = watch('slug');

  // Auto-generate slug from name when name changes and slug is empty
  useEffect(() => {
    // Only auto-generate if name exists and slug is empty
    if (watchedName && !watchedSlug) {
      const generatedSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      setValue('slug', generatedSlug);
    }
  }, [watchedName, watchedSlug, setValue]);

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
        const url = new URL('/api/projects/check-slug', window.location.origin);
        url.searchParams.set('slug', watchedSlug);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data: SlugCheckResponse = await response.json();

        if (data.error) {
          setSlugError(data.error);
          setSlugAvailable(false);
        } else {
          setSlugAvailable(data.available);
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

  // Handle form completion
  const handleCreateProject: SubmitHandler<ProjectBasicInfoFormData> = async formData => {
    if (slugAvailable === false) return;

    setIsSubmitting(true);

    try {
      // Create the project with basic info only
      const projectData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        status: 'idea' as ProjectStatus,
      };

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

      const { project } = await response.json();

      success('Project created successfully!');
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      error(err instanceof Error ? err.message : 'An error occurred while creating your project');
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="surface">
      <form onSubmit={handleSubmit(handleCreateProject)} className="basic-info-form">
        <Flex direction="column" gap="4" p="4">
          <div>
            <Text as="label" size="2" mb="1" weight="bold" htmlFor="name">
              Project Name
            </Text>
            <TextField.Root
              {...register('name')}
              id="name"
              placeholder="Enter your project name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <Text color="red" size="1">
                {errors.name.message}
              </Text>
            )}
          </div>

          <div>
            <Text as="label" size="2" mb="1" weight="bold" htmlFor="slug">
              Project URL
            </Text>
            <TextField.Root
              {...register('slug')}
              id="slug"
              placeholder="your-project-url"
              disabled={isSubmitting}
              color={slugAvailable === true ? 'green' : slugAvailable === false ? 'red' : undefined}
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
              {errors.slug && (
                <Text color="red" size="1">
                  {errors.slug.message}
                </Text>
              )}
            </Flex>
            <Text size="1" color="gray" mt="1">
              <InfoCircledIcon /> This will be your project&apos;s URL: deepvest.io/projects/
              {watchedSlug || 'your-project-url'}
            </Text>
          </div>

          <div>
            <Text as="label" size="2" mb="1" weight="bold" htmlFor="description">
              Description
            </Text>
            <TextArea
              {...register('description')}
              id="description"
              placeholder="Describe your project in a few sentences..."
              disabled={isSubmitting}
              rows={6}
            />
            {errors.description && (
              <Text color="red" size="1">
                {errors.description.message}
              </Text>
            )}
          </div>

          <Flex justify="end">
            <Button type="submit" disabled={isSubmitting || slugAvailable === false}>
              {isSubmitting ? 'Creating Project...' : 'Create Project'}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
