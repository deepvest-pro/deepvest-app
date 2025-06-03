// src/lib/file-constants.ts

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ARCHIVE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ACCEPTED_DOCUMENT_TYPES = [
  // PDF documents
  'application/pdf',
  // Microsoft Office documents
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Text files
  'text/plain', // .txt
  'text/markdown', // .md
  // Archive files
  'application/zip', // .zip
  'application/x-rar-compressed', // .rar
  // Images (for documents section)
  ...ACCEPTED_IMAGE_TYPES,
];

export const ACCEPTED_ALL_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOCUMENT_TYPES];

export const AVATAR_BUCKET_NAME = 'avatars';
export const COVER_BUCKET_NAME = 'profile-covers';
export const PROJECT_FILES_BUCKET_NAME = 'project-files';

// File type categories for validation
export const getFileCategory = (mimeType: string): 'image' | 'document' | 'archive' | 'unknown' => {
  if (ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }
  if (['application/zip', 'application/x-rar-compressed'].includes(mimeType)) {
    return 'archive';
  }
  if (ACCEPTED_DOCUMENT_TYPES.includes(mimeType)) {
    return 'document';
  }
  return 'unknown';
};

// Get max file size based on upload type
export const getMaxFileSize = (uploadType: 'logo' | 'banner' | 'document'): number => {
  switch (uploadType) {
    case 'logo':
      return MAX_AVATAR_SIZE_BYTES;
    case 'banner':
      return MAX_COVER_SIZE_BYTES;
    case 'document':
      return MAX_DOCUMENT_SIZE_BYTES;
    default:
      return MAX_DOCUMENT_SIZE_BYTES;
  }
};

// Get accepted file types based on upload type
export const getAcceptedFileTypes = (uploadType: 'logo' | 'banner' | 'document'): string[] => {
  switch (uploadType) {
    case 'logo':
    case 'banner':
      return ACCEPTED_IMAGE_TYPES;
    case 'document':
      return ACCEPTED_DOCUMENT_TYPES;
    default:
      return ACCEPTED_ALL_FILE_TYPES;
  }
};
