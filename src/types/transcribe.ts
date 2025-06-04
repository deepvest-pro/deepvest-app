/**
 * Request body for the transcription API endpoint
 */
export interface TranscribeRequest {
  /** URL of the file to transcribe */
  url: string;
  /** Prompt for the transcription */
  prompt: string;
}

/**
 * Response from the transcription API endpoint
 */
export interface TranscribeResponse {
  /** The transcription result */
  result: string;
  /** Additional metadata about the transcription */
  metadata?: {
    /** Size of the processed file in bytes */
    fileSize?: number;
    /** MIME type of the processed file */
    mimeType?: string;
    /** AI model used for transcription */
    model?: string;
  };
}

/**
 * Gemini API request structure
 */
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string; // base64 encoded file data
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

/**
 * Supported file types for transcription
 */
export const SUPPORTED_MIME_TYPES = {
  // PDF documents
  'application/pdf': 'PDF',

  // Images
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',

  // Microsoft Office
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/msword': 'DOC',
  'application/vnd.ms-powerpoint': 'PPT',

  // Text files
  'text/plain': 'TXT',
  'text/markdown': 'MD',
} as const;

/**
 * Maximum file size for transcription (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * API timeout in milliseconds (2 minutes)
 */
export const API_TIMEOUT = 2 * 60 * 1000;
