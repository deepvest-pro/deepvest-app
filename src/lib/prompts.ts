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
   * Project data generation prompt for creating projects from presentations
   * Used to extract structured project information from presentation content
   */
  PROJECT_DATA_GENERATION: `Analyze the following presentation content and extract key project information. Return ONLY a valid JSON object with the following structure, no explanations or additional text:

{
  "name": "Project name (required, max 100 characters)",
  "description": "Detailed project description (required, max 1000 characters)",
  "slogan": "Short catchy slogan (optional, max 200 characters)",
  "status": "idea|concept|prototype|mvp|beta|launched|growing|scaling|established|acquired|closed",
  "country": "Country name if mentioned (optional)",
  "city": "City name if mentioned (optional)"
}

Rules:
1. Extract the most relevant project name from the content
2. Create a comprehensive description that captures the essence of the project
3. Determine the most appropriate status based on the content
4. Only include country/city if explicitly mentioned
5. If no clear slogan exists, omit the field
6. Ensure all text is clean and professional
7. Return ONLY the JSON object, no markdown formatting or explanations

Content to analyze:`,

  /**
   * Future prompts can be added here:
   *
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
