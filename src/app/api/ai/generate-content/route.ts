import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandler } from '@/lib/api/base-handler';
import { APIError } from '@/lib/api/middleware/auth';
import {
  GenerateContentResponse,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  AI_TIMEOUT,
  MAX_PROMPT_LENGTH,
} from '@/types/ai';

// Request validation schema
const generateContentRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(MAX_PROMPT_LENGTH, 'Prompt too long'),
});

/**
 * Generate content using Gemini API
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const requestBody: GeminiGenerateRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
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
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

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

    const data: GeminiGenerateResponse = await response.json();

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

    throw new APIError('No content generated from Gemini API', 500);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('Gemini API request timeout', 408);
      }
      throw new APIError(`Gemini API error: ${error.message}`, 500);
    }
    throw new APIError('Failed to generate content with Gemini API', 500);
  }
}

/**
 * Main content generation endpoint
 */
export const POST = createAPIHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  const validatedData = generateContentRequestSchema.parse(body);
  const { prompt } = validatedData;

  // Check if Gemini API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new APIError('AI service not configured', 500);
  }

  // Generate content using Gemini API
  const generatedContent = await generateWithGemini(prompt, apiKey);

  // Return response with metadata
  return {
    result: generatedContent,
    metadata: {
      promptLength: prompt.length,
      model: 'gemini-2.0-flash',
    },
  } as Omit<GenerateContentResponse, 'success'>;
});
