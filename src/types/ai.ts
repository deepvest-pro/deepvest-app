/**
 * Types for AI content generation
 */

// Request types
export interface GenerateContentRequest {
  prompt: string;
}

// Response types
export interface GenerateContentResponse {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: {
    processingTime?: number;
    promptLength?: number;
  };
}

// Project data generation types
export interface ProjectDataFromAI {
  name: string;
  description: string;
  slogan?: string;
  status?:
    | 'idea'
    | 'concept'
    | 'prototype'
    | 'mvp'
    | 'beta'
    | 'launched'
    | 'growing'
    | 'scaling'
    | 'established'
    | 'acquired'
    | 'closed';
  country?: string;
  city?: string;
  team?: TeamMemberFromAI[];
}

// Team member data extracted from AI
export interface TeamMemberFromAI {
  name: string;
  email?: string;
  positions: string[];
}

// Gemini API types (reused from transcribe)
export interface GeminiGenerateRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
}

export interface GeminiGenerateResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

// Constants
export const AI_TIMEOUT = 120000; // 2 minutes
export const MAX_PROMPT_LENGTH = 50000; // 50k characters
