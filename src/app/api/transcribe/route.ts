import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandler } from '@/lib/api/base-handler';
import { APIError } from '@/lib/api/middleware/auth';
import { withRetry } from '@/lib/api/gemini-utils';
import {
  TranscribeResponse,
  GeminiRequest,
  GeminiResponse,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  API_TIMEOUT,
} from '@/types/transcribe';

// Request validation schema
const transcribeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
});

/**
 * Download file from URL and validate it
 */
async function downloadAndValidateFile(url: string) {
  try {
    // Validate URL format and prevent SSRF attacks
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new APIError('Only HTTP and HTTPS URLs are supported', 400);
    }

    // Download file with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DeepVest-Transcription-Service/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new APIError(`Failed to download file: ${response.status} ${response.statusText}`, 400);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    const mimeType = contentType.split(';')[0].trim();

    if (!Object.keys(SUPPORTED_MIME_TYPES).includes(mimeType)) {
      throw new APIError(`Unsupported file type: ${mimeType}`, 400);
    }

    // Check file size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new APIError(
        `File too large: ${contentLength} bytes (max: ${MAX_FILE_SIZE} bytes)`,
        400,
      );
    }

    // Download file data
    const arrayBuffer = await response.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;

    if (fileSize > MAX_FILE_SIZE) {
      throw new APIError(`File too large: ${fileSize} bytes (max: ${MAX_FILE_SIZE} bytes)`, 400);
    }

    // Convert to base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      base64Data,
      mimeType,
      fileSize,
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('File download timeout', 408);
      }
      throw new APIError(`File download failed: ${error.message}`, 400);
    }
    throw new APIError('Failed to download file', 400);
  }
}

/**
 * Send file to Gemini API for transcription
 */
async function transcribeWithGemini(
  base64Data: string,
  mimeType: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const requestBody: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(`Gemini API error: ${response.status} ${response.statusText}`, 500);
      }

      const data: GeminiResponse = await response.json();

      // Handle API errors
      if (data.error) {
        throw new APIError(`Gemini API error: ${data.error.message}`, 500);
      }

      // Extract response text
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const resultText = candidate.content.parts[0].text;
          if (resultText) {
            return resultText.trim();
          }
        }
      }

      throw new APIError('No transcription result received from Gemini API', 500);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new APIError('Gemini API request timeout', 408);
        }
        throw new APIError(`Gemini API error: ${error.message}`, 500);
      }
      throw new APIError('Failed to transcribe with Gemini API', 500);
    }
  });
}

/**
 * Main transcription endpoint
 */
export const POST = createAPIHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  const validatedData = transcribeRequestSchema.parse(body);
  const { url, prompt } = validatedData;

  // Check if Gemini API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new APIError('Transcription service not configured', 500);
  }

  // Download and validate file
  const fileData = await downloadAndValidateFile(url);

  // Send to Gemini API for transcription
  const transcriptionResult = await transcribeWithGemini(
    fileData.base64Data,
    fileData.mimeType,
    prompt,
    apiKey,
  );

  // Return response with metadata
  return {
    result: transcriptionResult,
    metadata: {
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      model: 'gemini-2.0-flash',
    },
  } as Omit<TranscribeResponse, 'success'>;
});
