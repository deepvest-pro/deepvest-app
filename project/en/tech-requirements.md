# DeepVest Technical Requirements

## Core Technical Stack

- NextJS (latest version) with Server-Side Rendering (SSR) mode
- TypeScript for type safety and developer experience
- ZOD for schema validation and type generation
- TanStack Query for data fetching, caching, and state management
- Supabase for backend-as-a-service (authentication, database, storage)

## Authentication & Authorization

- Utilize Supabase Auth for user management:
  - Email/password authentication with email verification
  - OAuth 2.0 social login providers:
    - Google
    - LinkedIn
    - X (Twitter)
    - GitHub
  - Auto-registration flow for social authentication
  - Password reset and account recovery
  - Row Level Security (RLS) for data access control
- Create custom UserProfiles table extending Supabase Auth:
  - Link with auth.users via foreign key
  - Store additional user information (nickname, bio, professional details)
- Implement project-level permissions:
  - Role-based access control (owner, admin, editor, viewer)
  - Resource-level access restrictions using Supabase RLS policies
- Implement security best practices:
  - Proper session management with Supabase JWT
  - Input validation and sanitization
  - Security headers configuration
  - Secure handling of environment variables

## UI & Design Implementation

- Implement responsive design with mobile-first approach
- Follow content-first design methodology in component development
- Ensure all interfaces comply with WCAG 2.1 AA standards
- Build responsive layouts for all device sizes (mobile, tablet, desktop)
- Implement intuitive navigation patterns and user interface components

### UI Technical Requirements

- Use Radix UI as the core component library
- No Tailwind-based UI libraries permitted in the codebase
- Create a centralized CSS variables file for all design tokens:
  - Typography (font families, sizes, weights)
  - Color palette (primary, secondary, accent, neutrals)
  - Spacing values and layout measurements
  - Breakpoints for responsive design
  - Animation durations and easing functions
- Implement SCSS modules for component-level styling
- Ensure component styles are scoped and don't leak

## Performance Engineering

- Implement code splitting for optimized loading
- Configure asset optimization pipeline for images and static files
- Implement proper caching strategies for assets and API responses
- Configure CSS/JS minification and bundling for production
- Implement lazy loading for non-critical UI components and images
- Optimize for Core Web Vitals metrics (LCP, FID, CLS)

## Accessibility Implementation

- Implement semantic HTML structure throughout the application
- Ensure keyboard navigation support for all interactive elements
- Add proper ARIA attributes where necessary
- Implement screen reader compatibility for all components
- Ensure sufficient color contrast (minimum 4.5:1 for normal text)
- Add focus indicators for interactive elements
- Implement skip navigation links
- Add proper date indicators with the time tag:
  ```html
  <time datetime="2025-05-13">Last updated: May 13, 2025</time>
  ```

## Technical SEO Implementation

- Configure NextJS for proper Server-Side Rendering (SSR)
- Implement programmatic generation of:
  - Page metadata (title, description)
  - Canonical URLs
  - XML sitemap
  - Robots.txt with proper directives
- Configure robots.txt for ChatGPT and other LLM bots:
  ```
  User-agent: ChatGPT-User
  Allow: /
  User-agent: OAI-SearchBot
  Allow: /
  User-agent: GPTBot
  Allow: /
  ```
- Configure sitemap in robots.txt:
  ```
  Sitemap: https://yourwebsite.com/sitemap.xml
  ```
- Schema.org structured data implementation with JSON-LD:
  ```html
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is your product?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our product is a SaaS solution for SEO optimization."
          }
        }
      ]
    }
  </script>
  ```
- Ensure proper HTML semantics for content structure (h1, h2, etc.)
- Validate structured data using Google Rich Results Test

## AI Integration

- Implement AI services for project scoring and recommendations:
  - Automatic project scoring pipeline triggered after snapshot publication
  - AI recommendation system for project improvements
  - Status tracking for AI processing (queued, in-progress, completed)
  - Structured recommendation management with implementation tracking
- Configure API integrations with AI providers
- Implement caching strategy for AI outputs
- Create fallback mechanisms for AI service disruptions

## Supabase Integration

- Configure Supabase project environment with:
  - PostgreSQL database with appropriate extensions
  - Storage buckets for file uploads (logos, documents, images)
  - Edge Functions for serverless processing
  - Realtime subscriptions for collaborative features
- Implement database schema with proper relationships:
  - Foreign key constraints for data integrity
  - Indexes for query performance
  - Row Level Security policies for data access control
- Configure storage rules for secure file access
- Set up database triggers for automated actions
- Implement proper error handling and logging
- Configure proper backup strategies

## Development Standards

- Implement component-based architecture with clear separation of concerns
- Configure ESLint and Prettier for consistent code style
- Set up TypeScript with strict mode enabled
- Implement unit and integration testing (minimum 70% coverage)
- Enforce Git workflow with conventional commits
- Create comprehensive documentation for:
  - Component API and usage examples
  - Utility functions and hooks
  - State management patterns
  - API integration
