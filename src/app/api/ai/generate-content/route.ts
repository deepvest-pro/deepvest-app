import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GenerateContentRequest,
  GenerateContentResponse,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  AI_TIMEOUT,
  MAX_PROMPT_LENGTH,
} from '@/types/ai';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request validation schema
const generateContentRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(MAX_PROMPT_LENGTH, 'Prompt too long'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Main content generation endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateContentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.errors
            .map(e => e.message)
            .join(', ')}`,
        } as GenerateContentResponse,
        { status: 400, headers: corsHeaders },
      );
    }

    const { prompt }: GenerateContentRequest = validationResult.data;

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service not configured',
        } as GenerateContentResponse,
        { status: 500, headers: corsHeaders },
      );
    }

    // Generate content using Gemini API
    const generatedContent = await generateWithGemini(prompt, apiKey);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        result: generatedContent,
        metadata: {
          promptLength: prompt.length,
          processingTime,
        },
      } as GenerateContentResponse,
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('Content generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        metadata: {
          processingTime,
        },
      } as GenerateContentResponse,
      { status: 500, headers: corsHeaders },
    );
  }
}

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
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiGenerateResponse = await response.json();

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

    throw new Error('No content generated from Gemini API');
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timeout');
      }
      throw error;
    }
    throw new Error('Failed to generate content with Gemini API');
  }
}
