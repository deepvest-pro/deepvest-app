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
  PROJECT_DATA_GENERATION: `Analyze the following presentation content and extract key project information. Even if the content seems incomplete or unclear, try to infer reasonable project details from any available information. Return ONLY a valid JSON object with the following structure, no explanations or additional text:

{
  "name": "Project name (required, max 100 characters)",
  "description": "Detailed project description (required, max 1000 characters)",
  "slogan": "Short catchy slogan (optional, max 200 characters)",
  "status": "idea|concept|prototype|mvp|beta|launched|growing|scaling|established|acquired|closed",
  "country": "Country name if mentioned (optional)",
  "city": "City name if mentioned (optional)",
  "team": [
    {
      "name": "Full name of team member",
      "email": "Email address if mentioned (optional)",
      "positions": ["CEO", "CTO", "Developer"] // Array of business roles/positions (NOT technical skills)
    }
  ]
}

Rules for project data:
1. Extract the most relevant project name from the content. If no clear name exists, create one based on the main topic/theme
2. Create a comprehensive description that captures the essence of the project. If content is limited, infer from available context
3. Determine the most appropriate status based on the content. Default to "idea" if unclear
4. Only include country/city if explicitly mentioned
5. If no clear slogan exists, omit the field (set to null)
6. Ensure all text is clean and professional
7. **IMPORTANT**: Never return "N/A" or "No project information found" - always try to extract or infer meaningful information
8. If the content appears to be a presentation, document, or any structured content, treat it as project-related material

Rules for team extraction:
1. Look for team/about us/founders/people sections in the presentation
2. Extract all mentioned team members with their names and roles
3. If email addresses are mentioned, include them
4. **IMPORTANT - Position Detection Rules:**
   - **Business Positions**: CEO, CTO, CPO, CMO, CFO, COO, Founder, Co-founder, Product Manager, Project Manager, Business Development, Marketing Manager, Sales Manager, Designer, UX/UI Designer, Data Scientist, DevOps Engineer, QA Engineer, etc.
   - **Technical Skills vs Positions**: 
     * Programming languages (React, Vue, Python, JavaScript, C#, Java, etc.) are NOT positions
     * Frameworks and technologies (Node.js, Django, Angular, etc.) are NOT positions
     * If someone is listed with only technical skills, infer their likely position:
      - Frontend technologies (React, Vue, Angular, HTML, CSS) → "Frontend Developer"
      - Backend technologies (Python, Node.js, Django, Express) → "Backend Developer"  
      - Mobile technologies (React Native, Flutter, Swift, Kotlin) → "Mobile Developer"
      - Data technologies (Python, R, SQL, Machine Learning) → "Data Scientist" or "Data Engineer"
      - DevOps technologies (Docker, Kubernetes, AWS, CI/CD) → "DevOps Engineer"
      - Multiple technologies across stack → "Full Stack Developer"
   - **Context Clues**: Use surrounding text, descriptions, or context to infer actual business roles
   - **Default Inference**: If no clear position is mentioned but technical skills are listed, use "Developer" as fallback
   - **Unknown Position Fallback**: If no position or skills can be determined, use "Team Member" as default
5. If the current user ({{USER_NAME}} <{{USER_EMAIL}}>) is found in the presentation:
  - Include their existing roles from the presentation (applying position detection rules above)
  - Always add "CEO" to their positions array (even if not mentioned)
  - Use their actual email ({{USER_EMAIL}}) even if different email is in presentation
6. If the current user is NOT found in the presentation, do not include them in the team array
7. If no team information is found, return an empty team array

**Examples of position inference:**
- "John Smith - React, TypeScript, Node.js" → positions: ["Full Stack Developer"]
- "Jane Doe - Python, Machine Learning, Data Analysis" → positions: ["Data Scientist"]
- "Mike Johnson - Founder, React Developer" → positions: ["Founder", "Frontend Developer"]
- "Sarah Wilson - Product Design, Figma, UX Research" → positions: ["Product Designer"]
- "Alex Brown - DevOps, AWS, Docker, Kubernetes" → positions: ["DevOps Engineer"]

Current user context:
- Name: {{USER_NAME}}
- Email: {{USER_EMAIL}}

Return ONLY the JSON object, no markdown formatting or explanations.

Content to analyze:`,

  /**
   * Project investment scoring prompt for AI-powered investment analysis
   * Used to evaluate projects from a venture capital perspective
   */
  PROJECT_INVESTMENT_SCORING: `You are an expert venture capital analyst with 15+ years of experience evaluating startup projects and investment opportunities. Based on the following comprehensive project information, provide a detailed investment analysis.

PROJECT INFORMATION:
{{PROJECT_DATA}}

ANALYSIS INSTRUCTIONS:
Analyze this startup project and provide a thorough investment evaluation. Consider market dynamics, competitive landscape, team capabilities, technology differentiation, business model viability, and execution risks.

SCORING CRITERIA:
- **Investment Rating (0-100)**: Overall investment attractiveness from poor (0-20) to exceptional (80-100)
- **Market Potential (0-100)**: Target market size, growth trajectory, and market fit assessment
- **Team Competency (0-100)**: Founding team skills, experience, track record, and team dynamics
- **Tech Innovation (0-100)**: Technical novelty, competitive advantages, and differentiation
- **Business Model (0-100)**: Revenue model clarity, scalability, and path to profitability
- **Execution Risk (0-100)**: Implementation challenges, where higher scores indicate LOWER risk

RESPONSE FORMAT:
Respond ONLY with a valid JSON object. No additional text, explanations, or formatting:

{
  "score": [0-100 number representing overall investment score],
  "investment_rating": [0-100 number for investment attractiveness],
  "market_potential": [0-100 number for market assessment],
  "team_competency": [0-100 number for team evaluation],
  "tech_innovation": [0-100 number for technology assessment],
  "business_model": [0-100 number for business model viability],
  "execution_risk": [0-100 number where higher = lower risk],
  "summary": "[2-3 sentence executive summary of investment potential in MARKDOWN format with emphasis (**bold**, *italic*) for key points]",
  "research": "[Detailed 3-4 paragraph analysis in MARKDOWN format with proper headers (##), bullet points (-), emphasis (**bold**, *italic*), and clear structure. Cover: market opportunity, team assessment, technology evaluation, business model analysis, key risks and opportunities]"
}

EVALUATION GUIDELINES:
- Be objective and data-driven in your analysis
- Consider both opportunities and risks equally
- Base scores on industry standards and comparable investments
- Ensure summary and research provide actionable insights
- Account for project stage and maturity in scoring
- Consider market timing and competitive dynamics
- **Format research field using Markdown** with headers, bullet points, and emphasis for better readability

Remember: Provide balanced, professional analysis suitable for investment committee review.`,

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

/**
 * Helper function to get a prompt with variable substitution
 */
export function getPromptWithVariables(key: PromptKey, variables: Record<string, string>): string {
  let prompt: string = PROMPTS[key];

  // Replace variables in the format {{VARIABLE_NAME}}
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });

  return prompt;
}
