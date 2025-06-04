'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Flex, Text, Card, IconButton } from '@radix-ui/themes';
import {
  Cross2Icon,
  UploadIcon,
  FileTextIcon,
  ImageIcon,
  ArchiveIcon,
  VideoIcon,
  SpeakerLoudIcon,
} from '@radix-ui/react-icons';
import { getAcceptedFileTypes, getMaxFileSize, getFileCategory } from '@/lib/file-constants';
import { formatFileSize } from '@/lib/utils/format';

interface DocumentUploadAreaProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  selectedFiles?: File[];
}

export function DocumentUploadArea({
  onFilesSelect,
  maxFiles = 5,
  className,
  disabled = false,
  selectedFiles: externalSelectedFiles = [],
}: DocumentUploadAreaProps) {
  const [internalSelectedFiles, setInternalSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Use external selectedFiles if provided, otherwise use internal state
  const selectedFiles =
    externalSelectedFiles.length > 0 ? externalSelectedFiles : internalSelectedFiles;

  const validateFiles = useCallback(
    (files: File[]): { validFiles: File[]; errors: string[] } => {
      const validFiles: File[] = [];
      const newErrors: string[] = [];
      const acceptedTypes = getAcceptedFileTypes('document');
      const maxSize = getMaxFileSize('document');

      files.forEach(file => {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
          newErrors.push(
            `File "${file.name}": Invalid file type. Please select a supported document type.`,
          );
          return;
        }

        // Check file size
        if (file.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          newErrors.push(`File "${file.name}": File is too large. Max size is ${maxSizeMB}MB.`);
          return;
        }

        validFiles.push(file);
      });

      // Check total file count
      if (selectedFiles.length + validFiles.length > maxFiles) {
        newErrors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
        return { validFiles: [], errors: newErrors };
      }

      return { validFiles, errors: newErrors };
    },
    [selectedFiles, maxFiles],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const { validFiles, errors: validationErrors } = validateFiles(acceptedFiles);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const newFiles = [...selectedFiles, ...validFiles];
      if (externalSelectedFiles.length === 0) {
        setInternalSelectedFiles(newFiles);
      }
      setErrors([]);
      onFilesSelect(newFiles);
    },
    [selectedFiles, onFilesSelect, validateFiles, externalSelectedFiles.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxSize: getMaxFileSize('document'),
    disabled,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    if (externalSelectedFiles.length === 0) {
      setInternalSelectedFiles(newFiles);
    }
    onFilesSelect(newFiles);
    setErrors([]);
  };

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type);
    switch (category) {
      case 'image':
        return <ImageIcon width="16" height="16" />;
      case 'archive':
        return <ArchiveIcon width="16" height="16" />;
      default:
        if (file.type.includes('video')) {
          return <VideoIcon width="16" height="16" />;
        }
        if (file.type.includes('audio')) {
          return <SpeakerLoudIcon width="16" height="16" />;
        }
        return <FileTextIcon width="16" height="16" />;
    }
  };

  return (
    <Card variant="surface" className={className}>
      <Flex direction="column" gap="3">
        {/* Upload Area */}
        <Box
          {...getRootProps()}
          style={{
            padding: '24px',
            border: isDragActive ? '2px dashed var(--accent-9)' : '2px dashed var(--gray-6)',
            borderRadius: 'var(--radius-3)',
            backgroundColor: isDragActive ? 'var(--accent-2)' : 'var(--gray-2)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <input {...getInputProps()} />
          <Flex direction="column" align="center" gap="3">
            <UploadIcon
              width="32"
              height="32"
              color={isDragActive ? 'var(--accent-9)' : 'var(--gray-9)'}
            />
            <Flex direction="column" align="center" gap="1">
              <Text size="3" weight="medium" align="center">
                {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
              </Text>
              <Text size="2" color="gray" align="center">
                or click to browse
              </Text>
            </Flex>
            <Text size="1" color="gray" align="center">
              Supports: PDF, Office docs, images, text files, archives{' '}
              {maxFiles === 1 ? '(1 file)' : `(max ${maxFiles} files)`}
            </Text>
          </Flex>
        </Box>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Box>
            <Text size="2" weight="medium" mb="2">
              {maxFiles === 1
                ? 'Selected File'
                : `Selected Files (${selectedFiles.length}/${maxFiles})`}
            </Text>
            <Flex direction="column" gap="2">
              {selectedFiles.map((file, index) => (
                <Card key={index} variant="surface" size="1">
                  <Flex align="center" justify="between" p="2">
                    <Flex align="center" gap="2">
                      {getFileIcon(file)}
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          {file.name}
                        </Text>
                        <Text size="1" color="gray">
                          {formatFileSize(file.size)}
                        </Text>
                      </Flex>
                    </Flex>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <Cross2Icon width="12" height="12" />
                    </IconButton>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Box>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Box>
            {errors.map((error, index) => (
              <Text key={index} size="2" color="red" mb="1">
                {error}
              </Text>
            ))}
          </Box>
        )}
      </Flex>
    </Card>
  );
}
