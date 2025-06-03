'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { TextField, TextArea, Flex, Text, Button } from '@radix-ui/themes';

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

export type ProjectBasicInfoFormData = z.infer<typeof projectBasicInfoSchema>;

interface ProjectBasicInfoStepProps {
  onSubmit: (data: ProjectBasicInfoFormData) => void;
  initialData?: Partial<ProjectBasicInfoFormData>;
  isSubmitting?: boolean;
  currentSlug?: string; // Current slug for edit mode - to exclude from uniqueness check
}

interface SlugCheckResponse {
  available: boolean;
  error?: string;
}

export function ProjectBasicInfoStep({
  onSubmit,
  initialData = {},
  isSubmitting = false,
  currentSlug,
}: ProjectBasicInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectBasicInfoFormData>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: initialData,
  });

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const watchedName = watch('name');
  const watchedSlug = watch('slug');

  // Auto-generate slug from name when name changes and slug is empty
  // In edit mode, don't auto-generate if we have a currentSlug (preserve existing slug)
  useEffect(() => {
    // Skip auto-generation in edit mode if we have a currentSlug
    if (currentSlug) {
      return;
    }

    // Only auto-generate if name exists and slug is empty or matches initial data
    if (watchedName && (!watchedSlug || watchedSlug === initialData.slug)) {
      const generatedSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      setValue('slug', generatedSlug);
    }
  }, [watchedName, watchedSlug, setValue, initialData.slug, currentSlug]);

  // Check slug availability with debounce
  useEffect(() => {
    // Reset states when slug changes
    setSlugError(null);

    if (!watchedSlug || watchedSlug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    // If we're in edit mode and the slug hasn't changed, mark it as available
    if (currentSlug && watchedSlug === currentSlug) {
      setSlugAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        // Build URL with currentSlug parameter if available
        const url = new URL('/api/projects/check-slug', window.location.origin);
        url.searchParams.set('slug', watchedSlug);
        if (currentSlug) {
          url.searchParams.set('currentSlug', currentSlug);
        }

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
  }, [watchedSlug, currentSlug]);

  const handleFormSubmit: SubmitHandler<ProjectBasicInfoFormData> = data => {
    if (slugAvailable === false) return;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="basic-info-form">
      <Flex direction="column" gap="3">
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
            {slugAvailable === true && currentSlug && watchedSlug === currentSlug && (
              <Text size="1" color="blue">
                <CheckCircledIcon /> Current URL
              </Text>
            )}
            {slugAvailable === true && !(currentSlug && watchedSlug === currentSlug) && (
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
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
