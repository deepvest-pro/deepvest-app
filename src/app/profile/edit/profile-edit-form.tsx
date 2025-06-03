'use client';

import { useForm, UseFormRegister, FieldError } from 'react-hook-form';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Tooltip,
  Badge,
} from '@radix-ui/themes';
import { useUpdateProfile } from '@/lib/auth/auth-hooks';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { profileUpdateSchema, type ProfileUpdateData } from '@/lib/validations/auth';
import type { Profile } from '@/types/auth';
import { FileUploadArea } from '@/components/forms/file-upload-area';
import { MAX_AVATAR_SIZE_BYTES, MAX_COVER_SIZE_BYTES } from '@/lib/file-constants';
import { useState } from 'react';
import {
  PersonIcon,
  HomeIcon,
  GlobeIcon,
  Share1Icon,
  ReaderIcon,
  SewingPinIcon,
  CheckIcon,
  Cross2Icon,
  ArrowLeftIcon,
} from '@radix-ui/react-icons';

interface ProfileEditFormProps {
  initialData: Profile | null;
}

// Styled input component
const StyledInput = ({
  id,
  placeholder,
  register,
  error,
  disabled,
  icon: Icon = null,
  label,
  type = 'text',
}: {
  id: keyof ProfileUpdateData;
  placeholder: string;
  register: UseFormRegister<ProfileUpdateData>;
  error?: FieldError | undefined;
  disabled?: boolean;
  icon?: React.ComponentType<{ width: string; height: string; color: string }> | null;
  label: string;
  type?: string;
}) => (
  <Box mb="3">
    <Flex gap="2" mb="1" align="center">
      {Icon && <Icon width="16" height="16" color="var(--gray-8)" />}
      <Text as="label" htmlFor={id} size="2" weight="medium">
        {label}
      </Text>
    </Flex>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--gray-6)',
        fontSize: '14px',
      }}
      {...register(id)}
    />
    {error && (
      <Text size="1" color="red" mt="1">
        {error.message}
      </Text>
    )}
  </Box>
);

// Styled textarea component
const StyledTextArea = ({
  id,
  placeholder,
  register,
  error,
  disabled,
  label,
  rows = 4,
}: {
  id: keyof ProfileUpdateData;
  placeholder: string;
  register: UseFormRegister<ProfileUpdateData>;
  error?: FieldError | undefined;
  disabled?: boolean;
  label: string;
  rows?: number;
}) => (
  <Box mb="3">
    <Text as="label" htmlFor={id} size="2" weight="medium" mb="1" style={{ display: 'block' }}>
      {label}
    </Text>
    <textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--gray-6)',
        fontSize: '14px',
        resize: 'vertical',
      }}
      {...register(id)}
    />
    {error && (
      <Text size="1" color="red" mt="1">
        {error.message}
      </Text>
    )}
  </Box>
);

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const { updateProfile, isLoading: isUpdatingProfileText } = useUpdateProfile();
  const { success, error: toastError } = useToastHelpers();
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Local state to immediately reflect image changes after upload
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(initialData?.avatar_url);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(initialData?.cover_url);

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues,
  });

  const handleFileSelected = (file: File | null, type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setSelectedAvatarFile(file);
    } else {
      setSelectedCoverFile(file);
    }
  };

  const onSubmit = handleSubmit(async textData => {
    let imagesUpdated = false;
    let textDataUpdateSkipped = false;

    if (selectedAvatarFile || selectedCoverFile) {
      setIsUploadingImages(true);
      try {
        if (selectedAvatarFile) {
          const formData = new FormData();
          formData.append('file', selectedAvatarFile);
          formData.append('uploadType', 'avatar');
          const response = await fetch('/api/profile/image-upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to upload avatar.');
          success('Avatar updated!');
          setCurrentAvatarUrl(result.imageUrl);
          setSelectedAvatarFile(null);
          imagesUpdated = true;
        }
        if (selectedCoverFile) {
          const formData = new FormData();
          formData.append('file', selectedCoverFile);
          formData.append('uploadType', 'cover');
          const response = await fetch('/api/profile/image-upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to upload cover image.');
          success('Cover image updated!');
          setCurrentCoverUrl(result.imageUrl);
          setSelectedCoverFile(null);
          imagesUpdated = true;
        }
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : 'An error occurred during image upload.';
        toastError(errorMessage, 'Image Upload Failed');
        setIsUploadingImages(false);
        return;
      } finally {
        setIsUploadingImages(false);
      }
    }

    // Only proceed to update text data if there are changes
    if (isDirty) {
      const result = await updateProfile(textData);
      if (result.success) {
        success('Profile details updated successfully!', 'Profile Updated');
      } else if (result.error) {
        toastError(result.error, 'Profile Update Failed');
      }
    } else if (imagesUpdated && !isDirty) {
      textDataUpdateSkipped = true;
    }

    if (!imagesUpdated && !isDirty && !textDataUpdateSkipped) {
      toastError('No changes to save.', 'No Changes');
    }
  });

  const isLoading = isUploadingImages || isUpdatingProfileText || isSubmitting;

  return (
    <Box style={{ backgroundColor: 'var(--gray-1)' }}>
      <Container size="3" py="6">
        <Flex align="center" gap="3" mb="5">
          <Link href="/profile" passHref>
            <Button variant="ghost" color="gray">
              <ArrowLeftIcon />
              Back to Profile
            </Button>
          </Link>
          <Badge size="2">Editing Profile</Badge>
        </Flex>

        <Heading size="8" mb="6">
          Edit Your Profile
        </Heading>

        <form onSubmit={onSubmit}>
          <Tabs.Root defaultValue="images">
            <Tabs.List>
              <Tabs.Trigger value="images">
                <Share1Icon width="16" height="16" />
                <Text ml="1">Images</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="personal">
                <PersonIcon width="16" height="16" />
                <Text ml="1">Personal Info</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="location">
                <SewingPinIcon width="16" height="16" />
                <Text ml="1">Location</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="bio">
                <ReaderIcon width="16" height="16" />
                <Text ml="1">Bio & Background</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="social">
                <GlobeIcon width="16" height="16" />
                <Text ml="1">Social Links</Text>
              </Tabs.Trigger>
            </Tabs.List>

            <Box pt="5">
              {/* IMAGES TAB */}
              <Tabs.Content value="images">
                <Card size="2">
                  <Flex direction="column" gap="4">
                    <Heading size="4">Profile Images</Heading>
                    <Text size="2" color="gray">
                      Upload images that represent you. Your avatar will be shown across the
                      platform.
                    </Text>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                      <Box>
                        <Text size="2" weight="medium" mb="2">
                          Avatar Image
                        </Text>
                        <Tooltip content="This will be displayed on your profile and in comments">
                          <FileUploadArea
                            label="Avatar"
                            currentImageUrl={currentAvatarUrl}
                            onFileSelect={handleFileSelected}
                            uploadType="avatar"
                            maxFileSizeMB={MAX_AVATAR_SIZE_BYTES / 1024 / 1024}
                            aspectRatio="1 / 1"
                            fallbackText={initialData?.full_name?.[0] || '?'}
                          />
                        </Tooltip>
                      </Box>

                      <Box>
                        <Text size="2" weight="medium" mb="2">
                          Cover Image
                        </Text>
                        <Tooltip content="This will be displayed at the top of your profile page">
                          <FileUploadArea
                            label="Cover Image"
                            currentImageUrl={currentCoverUrl}
                            onFileSelect={handleFileSelected}
                            uploadType="cover"
                            maxFileSizeMB={MAX_COVER_SIZE_BYTES / 1024 / 1024}
                            aspectRatio="16 / 9"
                          />
                        </Tooltip>
                      </Box>
                    </Grid>

                    {(selectedAvatarFile || selectedCoverFile) && (
                      <Button type="submit" disabled={isLoading} color="green">
                        {isUploadingImages && <Spinner mr="2" />}
                        Save Image Changes
                      </Button>
                    )}
                  </Flex>
                </Card>
              </Tabs.Content>

              {/* PERSONAL INFO TAB */}
              <Tabs.Content value="personal">
                <Card size="2">
                  <Flex direction="column" gap="4">
                    <Heading size="4">Personal Information</Heading>
                    <Text size="2" color="gray">
                      This information will be displayed publicly so be careful what you share.
                    </Text>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                      <StyledInput
                        id="full_name"
                        placeholder="Your full name"
                        register={register}
                        error={errors.full_name}
                        disabled={isLoading}
                        icon={PersonIcon}
                        label="Full Name"
                      />

                      <StyledInput
                        id="nickname"
                        placeholder="Your nickname/username"
                        register={register}
                        error={errors.nickname}
                        disabled={isLoading}
                        icon={PersonIcon}
                        label="Nickname (username)"
                      />
                    </Grid>
                  </Flex>
                </Card>
              </Tabs.Content>

              {/* LOCATION TAB */}
              <Tabs.Content value="location">
                <Card size="2">
                  <Flex direction="column" gap="4">
                    <Heading size="4">Location Information</Heading>
                    <Text size="2" color="gray">
                      Share your location to connect with local communities and events.
                    </Text>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                      <StyledInput
                        id="country"
                        placeholder="Your country"
                        register={register}
                        error={errors.country}
                        disabled={isLoading}
                        icon={HomeIcon}
                        label="Country"
                      />

                      <StyledInput
                        id="city"
                        placeholder="Your city"
                        register={register}
                        error={errors.city}
                        disabled={isLoading}
                        icon={SewingPinIcon}
                        label="City"
                      />
                    </Grid>
                  </Flex>
                </Card>
              </Tabs.Content>

              {/* BIO TAB */}
              <Tabs.Content value="bio">
                <Card size="2">
                  <Flex direction="column" gap="4">
                    <Heading size="4">Bio & Professional Background</Heading>
                    <Text size="2" color="gray">
                      Tell others about yourself and your professional experience.
                    </Text>

                    <StyledTextArea
                      id="bio"
                      placeholder="Tell us about yourself"
                      register={register}
                      error={errors.bio}
                      disabled={isLoading}
                      label="Bio (short introduction about yourself)"
                      rows={4}
                    />

                    <StyledTextArea
                      id="professional_background"
                      placeholder="Your professional experience and skills"
                      register={register}
                      error={errors.professional_background}
                      disabled={isLoading}
                      label="Professional Background"
                      rows={5}
                    />

                    <StyledInput
                      id="startup_ecosystem_role"
                      placeholder="e.g., Founder, Investor, Mentor"
                      register={register}
                      error={errors.startup_ecosystem_role}
                      disabled={isLoading}
                      label="Startup Ecosystem Role"
                    />
                  </Flex>
                </Card>
              </Tabs.Content>

              {/* SOCIAL LINKS TAB */}
              <Tabs.Content value="social">
                <Card size="2">
                  <Flex direction="column" gap="4">
                    <Heading size="4">Social Media Links</Heading>
                    <Text size="2" color="gray">
                      Connect your social profiles to share your presence across platforms.
                    </Text>

                    <StyledInput
                      id="website_url"
                      placeholder="https://example.com"
                      register={register}
                      error={errors.website_url}
                      disabled={isLoading}
                      icon={GlobeIcon}
                      label="Website URL"
                    />

                    <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                      <StyledInput
                        id="x_username"
                        placeholder="Without @ symbol"
                        register={register}
                        error={errors.x_username}
                        disabled={isLoading}
                        label="X / Twitter"
                      />

                      <StyledInput
                        id="linkedin_username"
                        placeholder="LinkedIn username"
                        register={register}
                        error={errors.linkedin_username}
                        disabled={isLoading}
                        label="LinkedIn Username"
                      />

                      <StyledInput
                        id="github_username"
                        placeholder="GitHub username"
                        register={register}
                        error={errors.github_username}
                        disabled={isLoading}
                        label="GitHub Username"
                      />
                    </Grid>
                  </Flex>
                </Card>
              </Tabs.Content>
            </Box>
          </Tabs.Root>

          <Separator my="5" size="4" />

          <Flex justify="between" gap="4" mt="6">
            <Link href="/profile" passHref>
              <Button size="3" variant="soft" color="gray" disabled={isLoading}>
                <Cross2Icon />
                Cancel
              </Button>
            </Link>
            <Button size="3" type="submit" disabled={isLoading} color="blue">
              {isLoading && <Spinner mr="2" />}
              <CheckIcon />
              {isUploadingImages
                ? 'Uploading Images...'
                : isUpdatingProfileText
                  ? 'Saving Profile...'
                  : 'Save All Changes'}
            </Button>
          </Flex>
        </form>
      </Container>
    </Box>
  );
}
