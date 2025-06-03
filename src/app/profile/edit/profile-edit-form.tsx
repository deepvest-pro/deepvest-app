'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Container, Flex, Text, Heading, Button, Card, Grid } from '@radix-ui/themes';
import { useUpdateProfile } from '@/lib/auth/auth-hooks';
import { profileUpdateSchema, type ProfileUpdateData } from '@/lib/validations/auth';
import type { UserProfile } from '@/types/auth';

interface ProfileEditFormProps {
  initialData: UserProfile | null;
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const { updateProfile, isLoading, error } = useUpdateProfile();
  const [success, setSuccess] = useState(false);

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
    formState: { errors },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async data => {
    const result = await updateProfile(data);
    if (result.success) {
      setSuccess(true);
    }
  });

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        <Heading size="8" mb="2">
          Edit Your Profile
        </Heading>

        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="6">
            {error && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--red-3)',
                  color: 'var(--red-11)',
                  borderRadius: '6px',
                }}
              >
                <Text size="2">{error}</Text>
              </Box>
            )}

            {success && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--green-3)',
                  color: 'var(--green-11)',
                  borderRadius: '6px',
                }}
              >
                <Text size="2">Profile updated successfully!</Text>
              </Box>
            )}

            <Card>
              <Heading size="4" mb="4">
                Personal Information
              </Heading>
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="full_name"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Full Name
                  </Text>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="Your full name"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                    {...register('full_name')}
                  />
                  {errors.full_name && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.full_name.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="nickname"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Nickname
                  </Text>
                  <input
                    id="nickname"
                    type="text"
                    placeholder="Your nickname"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                    {...register('nickname')}
                  />
                  {errors.nickname && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.nickname.message}
                    </Text>
                  )}
                </Box>
              </Grid>
            </Card>

            <Card>
              <Heading size="4" mb="4">
                About You
              </Heading>
              <Flex direction="column" gap="4">
                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="bio"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Bio
                  </Text>
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    rows={4}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.bio.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="professional_background"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Professional Background
                  </Text>
                  <textarea
                    id="professional_background"
                    placeholder="Your professional experience and skills"
                    rows={3}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                    {...register('professional_background')}
                  />
                  {errors.professional_background && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.professional_background.message}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Card>

            <Card>
              <Heading size="4" mb="4">
                Location
              </Heading>
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="country"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Country
                  </Text>
                  <input
                    id="country"
                    type="text"
                    placeholder="Your country"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                    {...register('country')}
                  />
                  {errors.country && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.country.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="city"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    City
                  </Text>
                  <input
                    id="city"
                    type="text"
                    placeholder="Your city"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                    {...register('city')}
                  />
                  {errors.city && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.city.message}
                    </Text>
                  )}
                </Box>
              </Grid>
            </Card>

            <Card>
              <Heading size="4" mb="4">
                Social Links
              </Heading>
              <Flex direction="column" gap="4">
                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="website_url"
                    style={{ display: 'block', marginBottom: '4px' }}
                  >
                    Website
                  </Text>
                  <input
                    id="website_url"
                    type="text"
                    placeholder="https://example.com"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px',
                    }}
                    {...register('website_url')}
                  />
                  {errors.website_url && (
                    <Text size="1" color="red" style={{ marginTop: '4px' }}>
                      {errors.website_url.message}
                    </Text>
                  )}
                </Box>

                <Grid columns={{ initial: '1', md: '3' }} gap="4">
                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      htmlFor="x_username"
                      style={{ display: 'block', marginBottom: '4px' }}
                    >
                      X / Twitter
                    </Text>
                    <input
                      id="x_username"
                      type="text"
                      placeholder="username"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                      {...register('x_username')}
                    />
                    {errors.x_username && (
                      <Text size="1" color="red" style={{ marginTop: '4px' }}>
                        {errors.x_username.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      htmlFor="linkedin_username"
                      style={{ display: 'block', marginBottom: '4px' }}
                    >
                      LinkedIn
                    </Text>
                    <input
                      id="linkedin_username"
                      type="text"
                      placeholder="username"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                      {...register('linkedin_username')}
                    />
                    {errors.linkedin_username && (
                      <Text size="1" color="red" style={{ marginTop: '4px' }}>
                        {errors.linkedin_username.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      htmlFor="github_username"
                      style={{ display: 'block', marginBottom: '4px' }}
                    >
                      GitHub
                    </Text>
                    <input
                      id="github_username"
                      type="text"
                      placeholder="username"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-6)',
                        fontSize: '14px',
                      }}
                      {...register('github_username')}
                    />
                    {errors.github_username && (
                      <Text size="1" color="red" style={{ marginTop: '4px' }}>
                        {errors.github_username.message}
                      </Text>
                    )}
                  </Box>
                </Grid>
              </Flex>
            </Card>

            <Flex gap="4" justify="end">
              <Link href="/profile">
                <Button size="3" variant="soft" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button size="3" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Container>
  );
}
