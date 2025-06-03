/**
 * Project helper utilities
 */

import type { ProjectDataFromAI } from '@/types/ai';

/**
 * Generates temporary project data for initial creation
 * @returns Temporary project data
 */
export const generateTemporaryProjectData = () => {
  const timestamp = Date.now();
  return {
    name: `Temporary project ${timestamp}`,
    slug: `temp-${timestamp}`,
    description: 'Temporary project created from presentation upload',
    status: 'idea' as const,
  };
};

/**
 * Splits AI-generated project data between project and snapshot fields
 * @param projectData AI-generated project data
 * @returns Object with projectFields and snapshotFields
 */
export const splitProjectData = (projectData: ProjectDataFromAI) => {
  const projectFields: Record<string, unknown> = {};

  const snapshotFields = {
    // All fields go to snapshot except slug (which goes to project)
    ...(projectData.name && { name: projectData.name }),
    ...(projectData.description && { description: projectData.description }),
    ...(projectData.slogan && { slogan: projectData.slogan }),
    ...(projectData.status && { status: projectData.status }),
    ...(projectData.country && { country: projectData.country }),
    ...(projectData.city && { city: projectData.city }),
  };

  return { projectFields, snapshotFields };
};

/**
 * Parses AI response to extract JSON from markdown code blocks
 * @param aiResponse The AI response string
 * @returns Parsed JSON object
 */
export const parseAIResponse = (aiResponse: string): ProjectDataFromAI => {
  // Parse the JSON from the result string
  const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }

  return JSON.parse(jsonMatch[1]);
};
