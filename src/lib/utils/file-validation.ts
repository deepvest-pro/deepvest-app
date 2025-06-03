/**
 * File validation utilities
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates a file for upload
 * @param file The file to validate
 * @returns Error message if invalid, null if valid
 */
export const validateFile = (file: File): string | null => {
  if (file.type !== 'application/pdf') {
    return 'Only PDF files are supported';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB';
  }

  return null;
};

/**
 * Formats file size in human readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets file extension from filename
 * @param filename The filename
 * @returns File extension without dot
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Removes file extension from filename
 * @param filename The filename
 * @returns Filename without extension
 */
export const removeFileExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '');
};
