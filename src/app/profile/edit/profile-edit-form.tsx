'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Button,
  Card,
  Grid,
  Spinner,
  Tabs,
  Separator,
} from '@radix-ui/themes';
import {
  PersonIcon,
  HomeIcon,
  GlobeIcon,
  Share1Icon,
  SewingPinIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@radix-ui/react-icons';
import { useUpdateProfile } from '@/lib/auth/auth-hooks';
import { ValidationSchemas } from '@/lib/validations';
import { APIClient } from '@/lib/utils/api';
import { MAX_AVATAR_SIZE_BYTES, MAX_COVER_SIZE_BYTES } from '@/lib/file-constants';
import { useFormHandler } from '@/hooks/useFormHandler';
import type { Profile } from '@/types/auth';
import { FileUploadArea, StyledInput, StyledTextArea } from '@/components/forms';
import { useToastHelpers } from '@/providers/ToastProvider';

interface ProfileEditFormProps {
  initialData: Profile | null;
}

// Type for image upload API response
interface ImageUploadResponse {
  avatar_url?: string;
  cover_url?: string;
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const { updateProfile, isLoading: isUpdatingProfileText } = useUpdateProfile();
  const { success } = useToastHelpers();
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    initialData?.avatar_url || null,
  );
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(
    initialData?.cover_url || null,
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const getStringValue = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };

  const getNullableStringValue = (value: unknown): string | null => {
    return typeof value === 'string' ? value : null;
  };

  const defaultValues = {
    full_name: getStringValue(initialData?.full_name),
    nickname: getStringValue(initialData?.nickname),
    bio: getNullableStringValue(initialData?.bio),
    professional_background: getNullableStringValue(initialData?.professional_background),
    startup_ecosystem_role: getNullableStringValue(initialData?.startup_ecosystem_role),
    country: getNullableStringValue(initialData?.country),
    city: getNullableStringValue(initialData?.city),
    website_url: getNullableStringValue(initialData?.website_url),
    x_username: getNullableStringValue(initialData?.x_username),
    linkedin_username: getNullableStringValue(initialData?.linkedin_username),
    github_username: getNullableStringValue(initialData?.github_username),
  };

  const form = useFormHandler({
    schema: ValidationSchemas.auth.profile,
    defaultValues,
    onSubmit: async textData => {
      let imagesUpdated = false;
      let textDataUpdateSkipped = false;

      try {
        if (selectedAvatarFile || selectedCoverFile) {
          setIsUploadingImages(true);
          try {
            if (selectedAvatarFile) {
              const formData = new FormData();
              formData.append('file', selectedAvatarFile);
              formData.append('uploadType', 'avatar');
              const response = await APIClient.upload('/profile/image-upload', formData);

              if (!response.success) {
                throw new Error(response.error || 'Failed to upload avatar');
              }

              const uploadData = response.data as ImageUploadResponse;
              if (uploadData?.avatar_url) {
                setCurrentAvatarUrl(uploadData.avatar_url);
                imagesUpdated = true;
              }
            }

            if (selectedCoverFile) {
              const formData = new FormData();
              formData.append('file', selectedCoverFile);
              formData.append('uploadType', 'cover');
              const response = await APIClient.upload('/profile/image-upload', formData);

              if (!response.success) {
                throw new Error(response.error || 'Failed to upload cover image');
              }

              const uploadData = response.data as ImageUploadResponse;
              if (uploadData?.cover_url) {
                setCurrentCoverUrl(uploadData.cover_url);
                imagesUpdated = true;
              }
            }
          } finally {
            setIsUploadingImages(false);
          }
        }

        // Update text data only if it's different from initial data
        if (form.formState.isDirty) {
          await updateProfile(textData);
        } else {
          textDataUpdateSkipped = true;
        }

        // Clear selected files after successful upload
        setSelectedAvatarFile(null);
        setSelectedCoverFile(null);

        // Show appropriate success message
        if (imagesUpdated && !textDataUpdateSkipped) {
          success('Profile and images updated successfully!');
        } else if (imagesUpdated) {
          success('Images updated successfully!');
        } else if (!textDataUpdateSkipped) {
          success('Profile updated successfully!');
        }

        return { success: true };
      } catch (error) {
        console.error('Error updating profile:', error);
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    onSuccess: () => {
      // Additional success actions can be added here if needed
    },
  });

  const handleFileSelected = (file: File | null, uploadType: 'avatar' | 'cover') => {
    if (uploadType === 'avatar') {
      setSelectedAvatarFile(file);
    } else {
      setSelectedCoverFile(file);
    }
  };

  const isLoading = form.isLoading || isUpdatingProfileText || isUploadingImages;

  return (
    <Container size="2" p="4">
      <Card variant="surface" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Box p="6">
          <Flex justify="between" align="center" mb="6">
            <Heading size="6">Edit Profile</Heading>
            <Link href="/profile">
              <Button variant="ghost" size="2">
                <ArrowLeftIcon width="16" height="16" />
                Back to Profile
              </Button>
            </Link>
          </Flex>

          <Tabs.Root defaultValue="basic" className="w-full">
            <Tabs.List>
              <Tabs.Trigger value="basic">Basic Information</Tabs.Trigger>
              <Tabs.Trigger value="professional">Professional</Tabs.Trigger>
              <Tabs.Trigger value="social">Social Links</Tabs.Trigger>
              <Tabs.Trigger value="images">Images</Tabs.Trigger>
            </Tabs.List>

            <form onSubmit={form.handleSubmit}>
              <Tabs.Content value="basic" className="mt-6">
                <Grid columns="1" gap="4">
                  <StyledInput
                    id="full_name"
                    label="Full Name"
                    placeholder="Your full name"
                    register={form.register('full_name')}
                    error={form.formState.errors.full_name}
                    disabled={isLoading}
                    icon={PersonIcon}
                    required
                  />

                  <StyledInput
                    id="nickname"
                    label="Nickname"
                    placeholder="Your preferred nickname"
                    register={form.register('nickname')}
                    error={form.formState.errors.nickname}
                    disabled={isLoading}
                    icon={PersonIcon}
                    required
                  />

                  <StyledTextArea
                    id="bio"
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    register={form.register('bio')}
                    error={form.formState.errors.bio}
                    disabled={isLoading}
                    rows={4}
                    maxLength={500}
                    showCharCount
                  />

                  <Grid columns="2" gap="4">
                    <StyledInput
                      id="country"
                      label="Country"
                      placeholder="Your country"
                      register={form.register('country')}
                      error={form.formState.errors.country}
                      disabled={isLoading}
                      icon={SewingPinIcon}
                    />

                    <StyledInput
                      id="city"
                      label="City"
                      placeholder="Your city"
                      register={form.register('city')}
                      error={form.formState.errors.city}
                      disabled={isLoading}
                      icon={HomeIcon}
                    />
                  </Grid>
                </Grid>
              </Tabs.Content>

              <Tabs.Content value="professional" className="mt-6">
                <Grid columns="1" gap="4">
                  <StyledTextArea
                    id="professional_background"
                    label="Professional Background"
                    placeholder="Describe your professional experience..."
                    register={form.register('professional_background')}
                    error={form.formState.errors.professional_background}
                    disabled={isLoading}
                    rows={4}
                    maxLength={1000}
                    showCharCount
                  />

                  <StyledTextArea
                    id="startup_ecosystem_role"
                    label="Role in Startup Ecosystem"
                    placeholder="Your role in the startup ecosystem..."
                    register={form.register('startup_ecosystem_role')}
                    error={form.formState.errors.startup_ecosystem_role}
                    disabled={isLoading}
                    rows={3}
                    maxLength={500}
                    showCharCount
                  />
                </Grid>
              </Tabs.Content>

              <Tabs.Content value="social" className="mt-6">
                <Grid columns="1" gap="4">
                  <StyledInput
                    id="website_url"
                    label="Website"
                    type="url"
                    placeholder="https://your-website.com"
                    register={form.register('website_url')}
                    error={form.formState.errors.website_url}
                    disabled={isLoading}
                    icon={GlobeIcon}
                  />

                  <Grid columns="1" gap="4">
                    <StyledInput
                      id="x_username"
                      label="X (Twitter) Username"
                      placeholder="username"
                      register={form.register('x_username')}
                      error={form.formState.errors.x_username}
                      disabled={isLoading}
                      icon={Share1Icon}
                    />

                    <StyledInput
                      id="linkedin_username"
                      label="LinkedIn Username"
                      placeholder="username"
                      register={form.register('linkedin_username')}
                      error={form.formState.errors.linkedin_username}
                      disabled={isLoading}
                      icon={Share1Icon}
                    />

                    <StyledInput
                      id="github_username"
                      label="GitHub Username"
                      placeholder="username"
                      register={form.register('github_username')}
                      error={form.formState.errors.github_username}
                      disabled={isLoading}
                      icon={Share1Icon}
                    />
                  </Grid>
                </Grid>
              </Tabs.Content>

              <Tabs.Content value="images" className="mt-6">
                <Grid columns="1" gap="6">
                  <FileUploadArea
                    label="Profile Avatar"
                    currentImageUrl={currentAvatarUrl}
                    onFileSelect={handleFileSelected}
                    uploadType="avatar"
                    maxFileSizeMB={Math.round(MAX_AVATAR_SIZE_BYTES / 1024 / 1024)}
                    aspectRatio="1 / 1"
                    fallbackText={initialData?.full_name || 'U'}
                  />
                  {selectedAvatarFile && (
                    <Flex align="center" gap="2">
                      <CheckIcon color="green" />
                      <Text size="2" color="green">
                        {selectedAvatarFile.name} selected
                      </Text>
                    </Flex>
                  )}

                  <Separator size="4" />

                  <FileUploadArea
                    label="Cover Image"
                    currentImageUrl={currentCoverUrl}
                    onFileSelect={handleFileSelected}
                    uploadType="cover"
                    maxFileSizeMB={Math.round(MAX_COVER_SIZE_BYTES / 1024 / 1024)}
                    aspectRatio="16 / 9"
                    fallbackText="Cover"
                  />
                  {selectedCoverFile && (
                    <Flex align="center" gap="2">
                      <CheckIcon color="green" />
                      <Text size="2" color="green">
                        {selectedCoverFile.name} selected
                      </Text>
                    </Flex>
                  )}
                </Grid>
              </Tabs.Content>

              <Separator size="4" style={{ margin: '24px 0' }} />

              <Flex justify="between" align="center">
                <Flex gap="3">
                  <Link href="/profile">
                    <Button variant="soft" disabled={isLoading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Flex align="center" gap="2">
                        <Spinner size="1" />
                        Saving...
                      </Flex>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Tabs.Root>
        </Box>
      </Card>
    </Container>
  );
}
