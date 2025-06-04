'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  TextField,
  TextArea,
  Select,
  Switch,
  Heading,
} from '@radix-ui/themes';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { DocumentUploadArea } from './DocumentUploadArea';
import { generateSlug } from '@/lib/utils/slug.util';

// Form validation schema
const documentFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(
      /^[a-z0-9-_]+$/,
      'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
    ),
  content_type: z.string().min(1, 'Content type is required'),
  description: z.string().optional(),
  is_public: z.boolean(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentFormProps {
  document?: ProjectDocumentWithAuthor | null;
  onSubmit: (data: DocumentFormData, files: File[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DocumentForm({
  document,
  onSubmit,
  onCancel,
  isLoading = false,
}: DocumentFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [slugError, setSlugError] = useState<string | null>(null);

  const isEditing = !!document;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: document?.title || '',
      slug: document?.slug || '',
      content_type: document?.content_type || 'document',
      description: document?.description || '',
      is_public: document?.is_public ?? true, // Default to public for new documents
    },
    mode: 'onChange',
  });

  const watchedTitle = watch('title');
  const watchedSlug = watch('slug');

  // Handle file selection and auto-fill title/slug
  const handleFilesSelect = async (files: File[]) => {
    setSelectedFiles(files);

    if (!isEditing && files.length > 0) {
      const currentTitle = watchedTitle;
      const currentSlug = watchedSlug;

      if (!currentTitle) {
        const filename = files[0].name;
        const titleFromFile = filename.replace(/\.[^/.]+$/, '');
        setValue('title', titleFromFile);
      }

      if (!currentSlug) {
        const slugResponse = await generateSlug(files[0].name, {
          removeFileExtension: true,
          allowUnderscores: true,
        });
        if (slugResponse.data && !slugResponse.error) {
          setValue('slug', slugResponse.data);
        }
      }
    }
  };

  // Auto-generate slug from title
  useEffect(() => {
    let isMounted = true;
    const autoGenerate = async () => {
      if (!isEditing && watchedTitle && !watchedSlug && isMounted) {
        const slugResponse = await generateSlug(watchedTitle, { allowUnderscores: true });
        if (slugResponse.data && !slugResponse.error && isMounted) {
          setValue('slug', slugResponse.data);
        }
      }
    };

    autoGenerate();
    return () => {
      isMounted = false;
    };
  }, [watchedTitle, watchedSlug, setValue, isEditing]);

  const handleFormSubmit = async (data: DocumentFormData) => {
    if (!isEditing && selectedFiles.length === 0) {
      return;
    }

    setSlugError(null);

    try {
      await onSubmit(data, selectedFiles);
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('slug')) {
        setSlugError('This slug is already in use. Please choose a different one.');
      }
    }
  };

  const contentTypeOptions = [
    { value: 'document', label: 'Document' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'pitch_deck', label: 'Pitch Deck' },
    { value: 'research', label: 'Research' },
    { value: 'whitepaper', label: 'Whitepaper' },
    { value: 'report', label: 'Report' },
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'table', label: 'Table' },
    { value: 'chart', label: 'Chart' },
    { value: 'infographic', label: 'Infographic' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          <Heading size="4">{isEditing ? 'Edit Document' : 'Add New Document'}</Heading>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Flex direction="column" gap="4">
              {/* File Upload - only show for new documents */}
              {!isEditing && selectedFiles.length === 0 && (
                <Box>
                  <Text size="3" weight="medium" mb="2">
                    File *
                  </Text>
                  <DocumentUploadArea
                    onFilesSelect={handleFilesSelect}
                    maxFiles={1}
                    disabled={isLoading}
                    selectedFiles={selectedFiles}
                  />
                  <Text size="2" color="red" mt="1">
                    Please select a file
                  </Text>
                </Box>
              )}

              {/* Show selected file info */}
              {!isEditing && selectedFiles.length > 0 && (
                <Box>
                  <Text size="3" weight="medium" mb="2">
                    Selected File
                  </Text>
                  <Card variant="surface" size="1">
                    <Box p="3">
                      <Flex align="center" justify="between">
                        <Text size="2">{selectedFiles[0].name}</Text>
                        <Button
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => setSelectedFiles([])}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      </Flex>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* Title */}
              <Box>
                <Text size="3" weight="medium" mb="2">
                  Title *
                </Text>
                <TextField.Root
                  {...register('title')}
                  placeholder="Enter document title"
                  disabled={isLoading}
                />
                {errors.title && (
                  <Text size="2" color="red" mt="1">
                    {errors.title.message}
                  </Text>
                )}
              </Box>

              {/* Slug */}
              <Box>
                <Text size="3" weight="medium" mb="2">
                  Slug *
                </Text>
                <TextField.Root
                  {...register('slug')}
                  placeholder="document-slug"
                  disabled={isLoading || isEditing}
                />
                <Text size="1" color="gray" mt="1">
                  Used in URLs. Only lowercase letters, numbers, hyphens, and underscores.
                  {isEditing && ' Cannot be changed after creation.'}
                </Text>
                {(errors.slug || slugError) && (
                  <Text size="2" color="red" mt="1">
                    {errors.slug?.message || slugError}
                  </Text>
                )}
              </Box>

              {/* Content Type */}
              <Box>
                <Text size="3" weight="medium" mb="2">
                  Content Type *
                </Text>
                <Select.Root
                  value={watch('content_type')}
                  onValueChange={(value: string) => setValue('content_type', value)}
                  disabled={isLoading}
                >
                  <Select.Trigger placeholder="Select content type" />
                  <Select.Content>
                    {contentTypeOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.content_type && (
                  <Text size="2" color="red" mt="1">
                    {errors.content_type.message}
                  </Text>
                )}
              </Box>

              {/* Description */}
              <Box>
                <Text size="3" weight="medium" mb="2">
                  Description
                </Text>
                <TextArea
                  {...register('description')}
                  placeholder="Optional description or notes about this document"
                  rows={4}
                  disabled={isLoading}
                />
                {errors.description && (
                  <Text size="2" color="red" mt="1">
                    {errors.description.message}
                  </Text>
                )}
              </Box>

              {/* Visibility */}
              <Box>
                <Flex align="center" gap="2">
                  <Switch
                    checked={watch('is_public')}
                    onCheckedChange={checked => setValue('is_public', checked)}
                    disabled={isLoading}
                  />
                  <Text size="3" weight="medium">
                    Make this document public
                  </Text>
                </Flex>
                <Text size="2" color="gray" mt="1">
                  Public documents can be viewed by anyone with access to the project
                </Text>
              </Box>

              {/* Form Actions */}
              <Flex gap="3" justify="end" mt="4">
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || (!isEditing && selectedFiles.length === 0)}
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Document' : 'Create Document'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Flex>
      </Box>
    </Card>
  );
}
