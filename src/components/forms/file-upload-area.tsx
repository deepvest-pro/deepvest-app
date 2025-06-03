'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  AspectRatio,
  Card,
  Strong,
  IconButton,
} from '@radix-ui/themes';
import { Cross2Icon, UploadIcon, PersonIcon } from '@radix-ui/react-icons';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/file-constants'; // Using the constant for consistency
import { useDropzone } from 'react-dropzone';

interface FileUploadAreaProps {
  label: string;
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null, uploadType: 'avatar' | 'cover') => void;
  uploadType: 'avatar' | 'cover';
  maxFileSizeMB: number;
  aspectRatio?: string; // e.g., "1 / 1", "16 / 9"
  fallbackText?: string;
  className?: string;
}

export function FileUploadArea({
  label,
  currentImageUrl,
  onFileSelect,
  uploadType,
  maxFileSizeMB,
  aspectRatio = '1 / 1',
  fallbackText = '?',
  className,
}: FileUploadAreaProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(`Invalid file type. Please select a JPG, PNG, GIF or WEBP image.`);
      setSelectedFile(null);
      onFileSelect(null, uploadType);
      return false;
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File is too large. Max size is ${maxFileSizeMB}MB.`);
      setSelectedFile(null);
      onFileSelect(null, uploadType);
      return false;
    }
    setSelectedFile(file);
    onFileSelect(file, uploadType);
    return true;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        validateAndSetFile(acceptedFiles[0]);
      }
    },
    [maxFileSizeMB], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ACCEPTED_IMAGE_TYPES.map(type => `.${type.split('/')[1]}`),
    },
    maxSize: maxFileSizeMB * 1024 * 1024,
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
  });

  const handleButtonClick = () => {
    open();
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null, uploadType);
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <Card variant="surface" className={className}>
      <Flex direction="column" gap="3">
        <Text size="3" weight="medium">
          {label}
        </Text>
        <Box
          {...getRootProps()}
          style={{
            width: uploadType === 'avatar' ? '120px' : '100%',
            height: uploadType === 'avatar' ? '120px' : undefined,
            position: 'relative',
            cursor: 'pointer',
            border: isDragActive ? '2px dashed var(--accent-9)' : '2px dashed transparent',
            borderRadius: uploadType === 'avatar' ? '100%' : 'var(--radius-3)',
            transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          {uploadType === 'avatar' ? (
            <Avatar
              src={displayUrl || undefined} // Avatar src handles null/undefined gracefully
              fallback={displayUrl ? fallbackText[0] : <PersonIcon width="40" height="40" />}
              size="7"
              radius="full"
              style={{ width: '120px', height: '120px' }}
            />
          ) : (
            <AspectRatio
              ratio={
                aspectRatio
                  ? parseFloat(aspectRatio.split(' / ')[0]) /
                    parseFloat(aspectRatio.split(' / ')[1])
                  : 16 / 9
              }
            >
              {displayUrl ? (
                <Image
                  src={displayUrl}
                  alt={`${label} preview`}
                  fill
                  style={{ objectFit: 'cover', borderRadius: 'var(--radius-3)' }}
                />
              ) : (
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--gray-a3)',
                    borderRadius: 'var(--radius-3)',
                  }}
                >
                  <UploadIcon width="48" height="48" color="var(--gray-a9)" />
                  {isDragActive && (
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        borderRadius: 'var(--radius-3)',
                      }}
                    >
                      <Text size="3" weight="bold">
                        Drop image here...
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
            </AspectRatio>
          )}
          {isDragActive && uploadType === 'avatar' && (
            <Flex
              align="center"
              justify="center"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                borderRadius: '50%',
              }}
            >
              <Text size="2" weight="bold" align="center">
                Drop image
              </Text>
            </Flex>
          )}
          {selectedFile && (
            <IconButton
              variant="solid"
              color="gray"
              radius="full"
              onClick={e => {
                e.stopPropagation();
                handleClearSelection();
              }}
              style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 1 }}
              size="1"
              aria-label={`Clear selected ${label}`}
            >
              <Cross2Icon />
            </IconButton>
          )}
        </Box>

        <Button onClick={handleButtonClick} variant="outline" type="button">
          <UploadIcon />
          {selectedFile ? 'Change' : 'Select'} {label}
        </Button>
        {error && (
          <Text size="2" color="red">
            <Strong>Error:</Strong> {error}
          </Text>
        )}
        {!error && selectedFile && (
          <Text size="2" color="green">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </Text>
        )}
        <Text size="1" color="gray" align="center">
          Drag files here or click to select
        </Text>
      </Flex>
    </Card>
  );
}
