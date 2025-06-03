import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  TranscribeRequest,
  TranscribeResponse,
  GeminiRequest,
  GeminiResponse,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  API_TIMEOUT,
} from '@/types/transcribe';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request validation schema
const transcribeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Main transcription endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = transcribeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.errors
            .map(e => e.message)
            .join(', ')}`,
        } as TranscribeResponse,
        { status: 400, headers: corsHeaders },
      );
    }

    const { url, prompt }: TranscribeRequest = validationResult.data;

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Transcription service not configured',
        } as TranscribeResponse,
        { status: 500, headers: corsHeaders },
      );
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

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        result: transcriptionResult,
        metadata: {
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          processingTime,
        },
      } as TranscribeResponse,
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('Transcription error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        metadata: {
          processingTime,
        },
      } as TranscribeResponse,
      { status: 500, headers: corsHeaders },
    );
  }
}

/**
 * Download file from URL and validate it
 */
async function downloadAndValidateFile(url: string) {
  try {
    // Validate URL format and prevent SSRF attacks
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
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
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    const mimeType = contentType.split(';')[0].trim();

    if (!Object.keys(SUPPORTED_MIME_TYPES).includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Check file size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${contentLength} bytes (max: ${MAX_FILE_SIZE} bytes)`);
    }

    // Download file data
    const arrayBuffer = await response.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${fileSize} bytes (max: ${MAX_FILE_SIZE} bytes)`);
    }

    // Convert to base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      base64Data,
      mimeType,
      fileSize,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('File download timeout');
      }
      throw error;
    }
    throw new Error('Failed to download file');
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    // Handle API errors
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
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

    throw new Error('No transcription result received from Gemini API');
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timeout');
      }
      throw error;
    }
    throw new Error('Failed to transcribe with Gemini API');
  }
}
