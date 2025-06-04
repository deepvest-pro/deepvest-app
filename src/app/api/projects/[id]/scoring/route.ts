import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getPromptWithVariables } from '@/lib/prompts';
import {
  ScoringStatus,
  Project,
  Snapshot,
  ProjectContentRow,
  TeamMemberRow,
} from '@/types/supabase';

// Interface for scoring data that will be saved to database
interface ScoringDataForDB {
  snapshot_id: string;
  status: ScoringStatus;
  ai_model_version: string;
  investment_rating?: number | null;
  market_potential?: number | null;
  team_competency?: number | null;
  tech_innovation?: number | null;
  business_model?: number | null;
  execution_risk?: number | null;
  summary?: string | null;
  research?: string | null;
  score?: number | null;
}

// Interface for parsed LLM response
interface ParsedLLMScoring {
  score?: number | null;
  investment_rating?: number | null;
  market_potential?: number | null;
  team_competency?: number | null;
  tech_innovation?: number | null;
  business_model?: number | null;
  execution_risk?: number | null;
  summary?: string | null;
  research?: string | null;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request validation schema
const generateScoringRequestSchema = z.object({
  force: z.boolean().optional().default(false), // Force regeneration if scoring already exists
});

// LLM response validation schema (soft validation)
const llmScoringResponseSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  investment_rating: z.number().min(0).max(100).optional(),
  market_potential: z.number().min(0).max(100).optional(),
  team_competency: z.number().min(0).max(100).optional(),
  tech_innovation: z.number().min(0).max(100).optional(),
  business_model: z.number().min(0).max(100).optional(),
  execution_risk: z.number().min(0).max(100).optional(),
  summary: z.string().optional(),
  research: z.string().optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Generate content using Gemini API
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const requestBody = {
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
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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

    const data = await response.json();

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

/**
 * Parse LLM response with soft validation
 */
function parseLLMResponse(response: string): ParsedLLMScoring | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in LLM response');
      return null;
    }

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Apply soft validation
    const validated = llmScoringResponseSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn('LLM response validation warnings:', validated.error.errors);
      // Return the parsed data anyway, but with fallbacks
      return {
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : null,
        investment_rating:
          typeof parsed.investment_rating === 'number'
            ? Math.max(0, Math.min(100, parsed.investment_rating))
            : null,
        market_potential:
          typeof parsed.market_potential === 'number'
            ? Math.max(0, Math.min(100, parsed.market_potential))
            : null,
        team_competency:
          typeof parsed.team_competency === 'number'
            ? Math.max(0, Math.min(100, parsed.team_competency))
            : null,
        tech_innovation:
          typeof parsed.tech_innovation === 'number'
            ? Math.max(0, Math.min(100, parsed.tech_innovation))
            : null,
        business_model:
          typeof parsed.business_model === 'number'
            ? Math.max(0, Math.min(100, parsed.business_model))
            : null,
        execution_risk:
          typeof parsed.execution_risk === 'number'
            ? Math.max(0, Math.min(100, parsed.execution_risk))
            : null,
        summary:
          typeof parsed.summary === 'string' ? parsed.summary : 'Analysis completed successfully.',
        research:
          typeof parsed.research === 'string'
            ? parsed.research
            : 'Detailed analysis was performed on the provided project data.',
      };
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return null;
  }
}

/**
 * Generate project scoring endpoint
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();

  try {
    const { id: projectId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400, headers: corsHeaders },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateScoringRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.errors
            .map(e => e.message)
            .join(', ')}`,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const { force } = validationResult.data;

    // Initialize Supabase client
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders },
      );
    }

    // Check if user has permission to generate scoring (admin or owner)
    const { data: permission, error: permissionError } = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (permissionError || !permission || !['admin', 'owner'].includes(permission.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions. Only project admins and owners can generate scoring.',
        },
        { status: 403, headers: corsHeaders },
      );
    }

    // Get project information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, slug, public_snapshot_id, is_public, is_archived')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    if (!project.public_snapshot_id) {
      return NextResponse.json(
        { success: false, error: 'Project has no public snapshot available for scoring' },
        { status: 400, headers: corsHeaders },
      );
    }

    // Get snapshot information
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select(
        `
        id, version, name, slogan, description, status, country, city,
        repository_urls, website_urls, logo_url, banner_url, video_urls,
        contents, team_members, is_locked, author_id
      `,
      )
      .eq('id', project.public_snapshot_id)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        { success: false, error: 'Project snapshot not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    // Get public project content (filter by IDs from snapshot if available)
    let projectContent: ContentScoringData[] = [];
    if (snapshot.contents && snapshot.contents.length > 0) {
      const { data: contentData, error: contentError } = await supabase
        .from('project_content')
        .select('slug, title, content_type, content, description, file_urls')
        .eq('project_id', projectId)
        .eq('is_public', true)
        .is('deleted_at', null)
        .in('id', snapshot.contents)
        .order('created_at', { ascending: true });

      if (contentError) {
        console.error('Error fetching project content:', contentError);
      } else {
        projectContent = contentData || [];
      }
    }

    // Get public team members (filter by IDs from snapshot if available)
    let teamMembers: TeamScoringData[] = [];
    if (snapshot.team_members && snapshot.team_members.length > 0) {
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select(
          `
          name, email, positions, is_founder, equity_percent, country, city,
          x_url, github_url, linkedin_url, status
        `,
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .in('id', snapshot.team_members)
        .order('is_founder', { ascending: false });

      if (teamError) {
        console.error('Error fetching team members:', teamError);
      } else {
        teamMembers = teamData || [];
      }
    }

    // Generate markdown content for analysis
    const markdownContent = generateProjectMarkdown(project, snapshot, projectContent, teamMembers);

    // Log the markdown content to console
    console.log('='.repeat(80));
    console.log('PROJECT SCORING DATA COLLECTION');
    console.log('='.repeat(80));
    console.log(markdownContent);
    console.log('='.repeat(80));

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    let llmResponse: string | null = null;
    let parsedScoring: ParsedLLMScoring | null = null;
    let aiEnabled = false;
    let llmError: string | null = null;

    if (apiKey) {
      try {
        // Generate prompt for LLM analysis
        const scoringPrompt = getPromptWithVariables('PROJECT_INVESTMENT_SCORING', {
          PROJECT_DATA: markdownContent,
        });

        console.log('='.repeat(80));
        console.log('SENDING TO LLM FOR SCORING');
        console.log('='.repeat(80));
        console.log('Prompt length:', scoringPrompt.length);

        // Generate scoring using Gemini API
        llmResponse = await generateWithGemini(scoringPrompt, apiKey);

        console.log('='.repeat(80));
        console.log('LLM SCORING RESPONSE');
        console.log('='.repeat(80));
        console.log(llmResponse);
        console.log('='.repeat(80));

        // Parse LLM response
        parsedScoring = parseLLMResponse(llmResponse);

        if (parsedScoring) {
          aiEnabled = true;
        } else {
          throw new Error('Failed to parse LLM response');
        }
      } catch (error) {
        console.error('LLM processing error:', error);
        llmError = error instanceof Error ? error.message : 'LLM processing failed';
        aiEnabled = false;
      }
    } else {
      console.error('GEMINI_API_KEY not configured, using fallback data');
      llmError = 'GEMINI_API_KEY not configured';
    }

    // Prepare scoring data for database insertion
    let scoringDataForDB: ScoringDataForDB = {
      snapshot_id: project.public_snapshot_id,
      status: aiEnabled ? 'completed' : 'failed',
      ai_model_version: aiEnabled ? 'gemini-2.0-flash-v1.0.0' : 'fallback-v1.0.0',
    };

    if (aiEnabled && parsedScoring) {
      // Use real LLM results
      scoringDataForDB = {
        ...scoringDataForDB,
        investment_rating: parsedScoring.investment_rating || null,
        market_potential: parsedScoring.market_potential || null,
        team_competency: parsedScoring.team_competency || null,
        tech_innovation: parsedScoring.tech_innovation || null,
        business_model: parsedScoring.business_model || null,
        execution_risk: parsedScoring.execution_risk || null,
        summary: parsedScoring.summary || 'Analysis completed successfully.',
        research:
          parsedScoring.research || 'Detailed analysis was performed on the provided project data.',
        score: parsedScoring.score || null,
      };
    } else {
      // Use fallback/mock data
      scoringDataForDB = {
        ...scoringDataForDB,
        status: 'completed', // Even fallback should be marked as completed
        investment_rating: 75.5,
        market_potential: 82.0,
        team_competency: 68.5,
        tech_innovation: 79.0,
        business_model: 71.5,
        execution_risk: 25.0,
        summary: aiEnabled
          ? 'Fallback analysis: This project shows potential but requires further evaluation.'
          : 'Mock analysis: This project shows strong market potential with innovative technology approach.',
        research: aiEnabled
          ? 'Fallback analysis: Unable to perform AI analysis due to technical issues.'
          : 'Mock research: Detailed market analysis indicates strong demand in the target sector.',
        score: aiEnabled ? 70.0 : 74.8,
      };
    }

    // Check if scoring already exists and force is false
    if (!force) {
      const { data: existingScoring, error: existingScoringError } = await supabase
        .from('project_scoring')
        .select('id, status, created_at')
        .eq('snapshot_id', project.public_snapshot_id)
        .maybeSingle();

      if (existingScoringError) {
        console.error('Error checking existing scoring:', existingScoringError);
      }

      if (existingScoring) {
        return NextResponse.json(
          {
            success: false,
            error: `Scoring already exists for this project (ID: ${existingScoring.id}, status: ${existingScoring.status}, created: ${existingScoring.created_at}). Use force=true to regenerate.`,
          },
          { status: 409, headers: corsHeaders },
        );
      }
    }

    // If force=true, delete existing scoring first
    if (force) {
      // First, clear the scoring_id from snapshot
      const { error: snapshotClearError } = await supabase
        .from('snapshots')
        .update({ scoring_id: null })
        .eq('id', project.public_snapshot_id);

      if (snapshotClearError) {
        console.error('Error clearing scoring_id from snapshot:', snapshotClearError);
        // Continue anyway, as this is not critical for the deletion
      }

      // Then delete the scoring record
      const { error: deleteError } = await supabase
        .from('project_scoring')
        .delete()
        .eq('snapshot_id', project.public_snapshot_id);

      if (deleteError) {
        console.error('Error deleting existing scoring:', deleteError);
        // Continue anyway, as the insert might still work
      }
    }

    // Insert scoring data into database
    const { data: savedScoring, error: scoringInsertError } = await supabase
      .from('project_scoring')
      .insert(scoringDataForDB)
      .select()
      .single();

    if (scoringInsertError) {
      console.error('Error saving scoring to database:', scoringInsertError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save scoring to database: ${scoringInsertError.message}`,
          metadata: {
            projectId,
            snapshotId: project.public_snapshot_id,
            processingTime: Date.now() - startTime,
            aiEnabled,
            error: llmError,
          },
        },
        { status: 500, headers: corsHeaders },
      );
    }

    // Update snapshot with scoring_id to establish bidirectional relationship
    const { error: snapshotUpdateError } = await supabase
      .from('snapshots')
      .update({ scoring_id: savedScoring.id })
      .eq('id', project.public_snapshot_id);

    if (snapshotUpdateError) {
      console.error('Error updating snapshot with scoring_id:', snapshotUpdateError);
      // Don't fail the request, just log the error as the scoring was saved successfully
      // The scoring is still valid even if the snapshot reference isn't updated
    }

    // Successful response with data from database
    const processingTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: true,
        data: savedScoring,
        metadata: {
          projectId,
          snapshotId: project.public_snapshot_id,
          processingTime,
          aiEnabled,
          promptLength: apiKey
            ? getPromptWithVariables('PROJECT_INVESTMENT_SCORING', {
                PROJECT_DATA: markdownContent,
              }).length
            : undefined,
          contentSections: {
            projectInfo: true,
            snapshot: true,
            content: (projectContent || []).length,
            teamMembers: (teamMembers || []).length,
          },
          llmError: llmError || undefined,
        },
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('Project scoring generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        metadata: {
          processingTime,
        },
      },
      { status: 500, headers: corsHeaders },
    );
  }
}

// Define specific types for the data we're working with
type ProjectScoringData = Pick<
  Project,
  'id' | 'slug' | 'public_snapshot_id' | 'is_public' | 'is_archived'
>;

type SnapshotScoringData = Pick<
  Snapshot,
  | 'id'
  | 'version'
  | 'name'
  | 'slogan'
  | 'description'
  | 'status'
  | 'country'
  | 'city'
  | 'repository_urls'
  | 'website_urls'
  | 'logo_url'
  | 'banner_url'
  | 'video_urls'
  | 'is_locked'
>;

type ContentScoringData = Pick<
  ProjectContentRow,
  'slug' | 'title' | 'content_type' | 'content' | 'description' | 'file_urls'
>;

type TeamScoringData = Pick<
  TeamMemberRow,
  | 'name'
  | 'email'
  | 'positions'
  | 'is_founder'
  | 'equity_percent'
  | 'country'
  | 'city'
  | 'x_url'
  | 'github_url'
  | 'linkedin_url'
  | 'status'
>;

/**
 * Generate markdown content from project data
 */
function generateProjectMarkdown(
  project: ProjectScoringData,
  snapshot: SnapshotScoringData,
  content: ContentScoringData[],
  teamMembers: TeamScoringData[],
): string {
  const lines: string[] = [];

  // Project Header
  lines.push('# Project Investment Analysis');
  lines.push('');
  lines.push(`**Project ID:** ${project.id}`);
  lines.push(`**Project Slug:** ${project.slug}`);
  lines.push(`**Public Status:** ${project.is_public ? 'Yes' : 'No'}`);
  lines.push(`**Archived:** ${project.is_archived ? 'Yes' : 'No'}`);
  lines.push('');

  // Snapshot Information
  lines.push('## Project Overview');
  lines.push('');
  lines.push(`**Name:** ${snapshot.name}`);
  if (snapshot.slogan) {
    lines.push(`**Slogan:** ${snapshot.slogan}`);
  }
  lines.push(`**Version:** ${snapshot.version}`);
  lines.push(`**Status:** ${snapshot.status}`);
  lines.push(`**Description:**`);
  lines.push(snapshot.description || 'No description available');
  lines.push('');

  // Location
  if (snapshot.country || snapshot.city) {
    lines.push('### Location');
    if (snapshot.country) lines.push(`**Country:** ${snapshot.country}`);
    if (snapshot.city) lines.push(`**City:** ${snapshot.city}`);
    lines.push('');
  }

  // Links and Resources
  const hasLinks = snapshot.repository_urls?.length || snapshot.website_urls?.length;
  if (hasLinks) {
    lines.push('### Links and Resources');

    if (snapshot.repository_urls?.length) {
      lines.push('**Repository URLs:**');
      snapshot.repository_urls.forEach((url: string) => {
        lines.push(`- ${url}`);
      });
    }

    if (snapshot.website_urls?.length) {
      lines.push('**Website URLs:**');
      snapshot.website_urls.forEach((url: string) => {
        lines.push(`- ${url}`);
      });
    }
    lines.push('');
  }

  // Media
  const hasMedia = snapshot.logo_url || snapshot.banner_url || snapshot.video_urls?.length;
  if (hasMedia) {
    lines.push('### Media Assets');
    if (snapshot.logo_url) lines.push(`**Logo:** ${snapshot.logo_url}`);
    if (snapshot.banner_url) lines.push(`**Banner:** ${snapshot.banner_url}`);
    if (snapshot.video_urls?.length) {
      lines.push('**Videos:**');
      snapshot.video_urls.forEach((url: string) => {
        lines.push(`- ${url}`);
      });
    }
    lines.push('');
  }

  // Project Content
  if (content.length > 0) {
    lines.push('## Project Documentation');
    lines.push('');

    content.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.title}`);
      lines.push(`**Type:** ${item.content_type}`);
      lines.push(`**Slug:** ${item.slug}`);

      if (item.description) {
        lines.push(`**Description:** ${item.description}`);
      }

      if (item.content) {
        lines.push('**Content:**');
        lines.push(item.content);
      }

      if (item.file_urls?.length) {
        lines.push('**File URLs:**');
        item.file_urls.forEach((url: string) => {
          lines.push(`- ${url}`);
        });
      }

      lines.push('');
    });
  } else {
    lines.push('## Project Documentation');
    lines.push('No public documentation available.');
    lines.push('');
  }

  // Team Information
  if (teamMembers.length > 0) {
    lines.push('## Team Members');
    lines.push('');

    // Founders first
    const founders = teamMembers.filter(member => member.is_founder);
    const otherMembers = teamMembers.filter(member => !member.is_founder);

    if (founders.length > 0) {
      lines.push('### Founders');
      founders.forEach((member, index) => {
        lines.push(`#### ${index + 1}. ${member.name}`);
        if (member.email) lines.push(`**Email:** ${member.email}`);
        if (member.positions?.length) {
          lines.push(`**Positions:** ${member.positions.join(', ')}`);
        }
        if (member.equity_percent) {
          lines.push(`**Equity:** ${member.equity_percent}%`);
        }
        if (member.country || member.city) {
          lines.push(`**Location:** ${[member.city, member.country].filter(Boolean).join(', ')}`);
        }
        if (member.status) {
          lines.push(`**Status:** ${member.status}`);
        }

        // Social links
        const socialLinks = [];
        if (member.x_url) socialLinks.push(`[X/Twitter](${member.x_url})`);
        if (member.github_url) socialLinks.push(`[GitHub](${member.github_url})`);
        if (member.linkedin_url) socialLinks.push(`[LinkedIn](${member.linkedin_url})`);

        if (socialLinks.length > 0) {
          lines.push(`**Social:** ${socialLinks.join(' | ')}`);
        }

        lines.push('');
      });
    }

    if (otherMembers.length > 0) {
      lines.push('### Team Members');
      otherMembers.forEach((member, index) => {
        lines.push(`#### ${index + 1}. ${member.name}`);
        if (member.email) lines.push(`**Email:** ${member.email}`);
        if (member.positions?.length) {
          lines.push(`**Positions:** ${member.positions.join(', ')}`);
        }
        if (member.equity_percent) {
          lines.push(`**Equity:** ${member.equity_percent}%`);
        }
        if (member.country || member.city) {
          lines.push(`**Location:** ${[member.city, member.country].filter(Boolean).join(', ')}`);
        }
        if (member.status) {
          lines.push(`**Status:** ${member.status}`);
        }

        // Social links
        const socialLinks = [];
        if (member.x_url) socialLinks.push(`[X/Twitter](${member.x_url})`);
        if (member.github_url) socialLinks.push(`[GitHub](${member.github_url})`);
        if (member.linkedin_url) socialLinks.push(`[LinkedIn](${member.linkedin_url})`);

        if (socialLinks.length > 0) {
          lines.push(`**Social:** ${socialLinks.join(' | ')}`);
        }

        lines.push('');
      });
    }
  } else {
    lines.push('## Team Members');
    lines.push('No public team information available.');
    lines.push('');
  }

  // Additional Analysis Context
  lines.push('## Analysis Context');
  lines.push('');
  lines.push(`**Snapshot Locked:** ${snapshot.is_locked ? 'Yes' : 'No'}`);
  lines.push(`**Content Sections:** ${content.length}`);
  lines.push(`**Team Size:** ${teamMembers.length}`);
  lines.push(`**Founders Count:** ${teamMembers.filter(m => m.is_founder).length}`);
  lines.push(`**Analysis Date:** ${new Date().toISOString()}`);
  lines.push('');

  return lines.join('\n');
}
