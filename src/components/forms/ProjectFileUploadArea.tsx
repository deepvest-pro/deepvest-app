'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
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
import { ACCEPTED_IMAGE_TYPES } from '@/lib/file-constants';

interface ProjectFileUploadAreaProps {
  label: string;
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null, uploadType: 'logo' | 'banner') => void;
  uploadType: 'logo' | 'banner';
  maxFileSizeMB: number;
  aspectRatio?: string; // e.g., "1 / 1", "16 / 9"
  fallbackText?: string;
  className?: string;
}

export function ProjectFileUploadArea({
  label,
  currentImageUrl,
  onFileSelect,
  uploadType,
  maxFileSizeMB,
  aspectRatio = '1 / 1',
  fallbackText = '?',
  className,
}: ProjectFileUploadAreaProps) {
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
            width: uploadType === 'logo' ? '120px' : '100%',
            height: uploadType === 'logo' ? '120px' : undefined,
            position: 'relative',
            cursor: 'pointer',
            border: isDragActive ? '2px dashed var(--accent-9)' : '2px dashed transparent',
            borderRadius: uploadType === 'logo' ? '100%' : 'var(--radius-3)',
            transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          {uploadType === 'logo' ? (
            <Avatar
              src={displayUrl || undefined}
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
          {isDragActive && uploadType === 'logo' && (
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
                Drop image here...
              </Text>
            </Flex>
          )}
        </Box>

        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}

        <Flex gap="2" wrap="wrap">
          <Button size="2" variant="soft" onClick={handleButtonClick}>
            <UploadIcon width="16" height="16" />
            Choose File
          </Button>
          {(selectedFile || currentImageUrl) && (
            <IconButton size="2" variant="soft" color="red" onClick={handleClearSelection}>
              <Cross2Icon width="16" height="16" />
            </IconButton>
          )}
        </Flex>

        <Text size="1" color="gray">
          <Strong>Max size:</Strong> {maxFileSizeMB}MB
          <br />
          <Strong>Formats:</Strong> JPG, PNG, GIF, WEBP
          {aspectRatio && (
            <>
              <br />
              <Strong>Aspect ratio:</Strong> {aspectRatio}
            </>
          )}
        </Text>
      </Flex>
    </Card>
  );
}
