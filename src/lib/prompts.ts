/**
 * Centralized storage for AI prompts used throughout the application
 * This makes it easier to manage, update, and maintain prompts in one place
 */

export const PROMPTS = {
  /**
   * Document content extraction prompt for transcription API
   * Used to convert various document formats to clean markdown
   */
  DOCUMENT_CONTENT_EXTRACTION: `Extract and convert the content of this document to clean markdown format. Rules: 1) Return ONLY the markdown content, no code blocks, no \`\`\`markdown wrapper, no explanations. 2) Preserve document structure with proper headers (#, ##, ###). 3) Convert tables, lists, and formatting accurately. 4) Remove any metadata, page numbers, or irrelevant elements. 5) Start directly with the content, no preamble. 6) Use proper markdown syntax for emphasis (*italic*, **bold**). 7) Maintain logical paragraph breaks and spacing.`,

  /**
   * Future prompts can be added here:
   *
   * PROJECT_DESCRIPTION_GENERATION: `...`,
   * CONTENT_SUMMARIZATION: `...`,
   * METRICS_ANALYSIS: `...`,
   * etc.
   */
} as const;

/**
 * Type for prompt keys to ensure type safety when accessing prompts
 */
export type PromptKey = keyof typeof PROMPTS;

/**
 * Helper function to get a prompt by key with type safety
 */
export function getPrompt(key: PromptKey): string {
  return PROMPTS[key];
}
