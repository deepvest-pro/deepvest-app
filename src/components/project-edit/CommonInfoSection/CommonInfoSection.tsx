'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Card, Flex, Text, Heading, Button, Grid, Spinner, Select } from '@radix-ui/themes';
import { CheckIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { ProjectFileUploadArea } from '@/components/project-edit';
import { useToastHelpers } from '@/providers/ToastProvider';
import { ProjectStatus } from '@/types/supabase';

// Project status enum values from database schema
const PROJECT_STATUSES = [
  { value: 'idea', label: 'Idea' },
  { value: 'concept', label: 'Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launched', label: 'Launched' },
  { value: 'growing', label: 'Growing' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'established', label: 'Established' },
  { value: 'acquired', label: 'Acquired' },
  { value: 'closed', label: 'Closed' },
] as const;

// Validation schema for common info section
const commonInfoSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  slogan: z.string().max(200, 'Slogan too long').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  status: z.enum([
    'idea',
    'concept',
    'prototype',
    'mvp',
    'beta',
    'launched',
    'growing',
    'scaling',
    'established',
    'acquired',
    'closed',
  ] as const),
  country: z.string().max(100, 'Country name too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  website_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

type CommonInfoFormData = z.infer<typeof commonInfoSchema>;

interface CommonInfoSectionProps {
  initialData: {
    name: string;
    slug: string;
    slogan?: string;
    description: string;
    status: ProjectStatus;
    country?: string;
    city?: string;
    website_urls?: string[];
    logo_url?: string;
    banner_url?: string;
  };
  projectId: string;
  onSave: (data: CommonInfoFormData & { logo_url?: string; banner_url?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function CommonInfoSection({
  initialData,
  projectId,
  onSave,
  isLoading = false,
}: CommonInfoSectionProps) {
  const { success, error } = useToastHelpers();
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(initialData.logo_url);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(initialData.banner_url);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<CommonInfoFormData>({
    resolver: zodResolver(commonInfoSchema),
    defaultValues: {
      name: initialData.name || '',
      slug: initialData.slug || '',
      slogan: initialData.slogan || '',
      description: initialData.description || '',
      status: initialData.status || 'idea',
      country: initialData.country || '',
      city: initialData.city || '',
      website_url: initialData.website_urls?.[0] || '',
    },
  });

  const handleFileSelected = (file: File | null, type: 'logo' | 'banner') => {
    if (type === 'logo') {
      setSelectedLogoFile(file);
    } else {
      setSelectedBannerFile(file);
    }
  };

  const uploadImages = async () => {
    let logoUrl = currentLogoUrl;
    let bannerUrl = currentBannerUrl;

    if (selectedLogoFile) {
      const formData = new FormData();
      formData.append('file', selectedLogoFile);
      formData.append('uploadType', 'logo');

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const result = await response.json();
      logoUrl = result.imageUrl;
      setCurrentLogoUrl(logoUrl);
      setSelectedLogoFile(null);
    }

    if (selectedBannerFile) {
      const formData = new FormData();
      formData.append('file', selectedBannerFile);
      formData.append('uploadType', 'banner');

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload banner');
      }

      const result = await response.json();
      bannerUrl = result.imageUrl;
      setCurrentBannerUrl(bannerUrl);
      setSelectedBannerFile(null);
    }

    return { logoUrl, bannerUrl };
  };

  const onSubmit = handleSubmit(async data => {
    try {
      let logoUrl = currentLogoUrl;
      let bannerUrl = currentBannerUrl;

      // Upload images if selected
      if (selectedLogoFile || selectedBannerFile) {
        setIsUploadingImages(true);
        const uploadResult = await uploadImages();
        logoUrl = uploadResult.logoUrl;
        bannerUrl = uploadResult.bannerUrl;
        setIsUploadingImages(false);
      }

      // Save form data with image URLs
      await onSave({
        ...data,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      });

      success('Common information saved successfully!');
    } catch (err) {
      setIsUploadingImages(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      error(errorMessage);
    }
  });

  const hasChanges = isDirty || selectedLogoFile || selectedBannerFile;
  const isSaving = isLoading || isUploadingImages;

  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="2" mb="3">
            <InfoCircledIcon width="20" height="20" color="var(--blue-9)" />
            <Heading size="5">Common Information</Heading>
          </Flex>

          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="5">
              {/* Project Name and Slug */}
              <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    Project Name *
                  </Text>
                  <input
                    {...register('name')}
                    placeholder="Enter project name"
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                  />
                  {errors.name && (
                    <Text size="1" color="red" mt="1">
                      {errors.name.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    Project Slug *
                  </Text>
                  <input
                    {...register('slug')}
                    placeholder="project-slug"
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                  />
                  {errors.slug && (
                    <Text size="1" color="red" mt="1">
                      {errors.slug.message}
                    </Text>
                  )}
                </Box>
              </Grid>

              {/* Slogan */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Slogan
                </Text>
                <input
                  {...register('slogan')}
                  placeholder="A catchy slogan for your project"
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--gray-6)',
                    fontSize: '14px',
                  }}
                />
                {errors.slogan && (
                  <Text size="1" color="red" mt="1">
                    {errors.slogan.message}
                  </Text>
                )}
              </Box>

              {/* Description */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Description *
                </Text>
                <textarea
                  {...register('description')}
                  placeholder="Describe your project in detail"
                  rows={5}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--gray-6)',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
                {errors.description && (
                  <Text size="1" color="red" mt="1">
                    {errors.description.message}
                  </Text>
                )}
              </Box>

              {/* Status */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Project Status *
                </Text>
                <Select.Root
                  value={watch('status')}
                  onValueChange={value => setValue('status', value as ProjectStatus)}
                  disabled={isSaving}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {PROJECT_STATUSES.map(status => (
                      <Select.Item key={status.value} value={status.value}>
                        {status.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.status && (
                  <Text size="1" color="red" mt="1">
                    {errors.status.message}
                  </Text>
                )}
              </Box>

              {/* Location */}
              <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    Country
                  </Text>
                  <input
                    {...register('country')}
                    placeholder="Country"
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                  />
                  {errors.country && (
                    <Text size="1" color="red" mt="1">
                      {errors.country.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    City
                  </Text>
                  <input
                    {...register('city')}
                    placeholder="City"
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                  />
                  {errors.city && (
                    <Text size="1" color="red" mt="1">
                      {errors.city.message}
                    </Text>
                  )}
                </Box>
              </Grid>

              {/* Website */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  Website URL
                </Text>
                <input
                  {...register('website_url')}
                  placeholder="https://example.com"
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--gray-6)',
                    fontSize: '14px',
                  }}
                />
                {errors.website_url && (
                  <Text size="1" color="red" mt="1">
                    {errors.website_url.message}
                  </Text>
                )}
              </Box>

              {/* Image Uploads */}
              <Box>
                <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                  Project Images
                </Text>
                <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Logo
                    </Text>
                    <ProjectFileUploadArea
                      label="Project Logo"
                      currentImageUrl={currentLogoUrl}
                      onFileSelect={handleFileSelected}
                      uploadType="logo"
                      maxFileSizeMB={2}
                      aspectRatio="1 / 1"
                      fallbackText={watch('name')?.[0] || '?'}
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Banner
                    </Text>
                    <ProjectFileUploadArea
                      label="Project Banner"
                      currentImageUrl={currentBannerUrl}
                      onFileSelect={handleFileSelected}
                      uploadType="banner"
                      maxFileSizeMB={5}
                      aspectRatio="16 / 9"
                    />
                  </Box>
                </Grid>
              </Box>

              {/* Save Button */}
              <Flex justify="end" mt="4">
                <Button type="submit" disabled={!hasChanges || isSaving} size="3" color="blue">
                  {isSaving && <Spinner mr="2" />}
                  <CheckIcon />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Flex>
      </Box>
    </Card>
  );
}
