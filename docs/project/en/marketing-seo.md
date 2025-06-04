# DeepVest Marketing & SEO Requirements

## SEO Strategy

### Content Optimization Strategy

- Define keyword strategy for all main pages and content sections
- Create SEO-optimized content guidelines for copywriters
- Establish content update schedule to maintain freshness
- Define metadata standards for optimal search appearance
- Create canonical link strategy for content syndication

### LLM & AI Search Engine Strategy

- Create content specifically optimized for LLM indexing and retrieval
- Define LLM-friendly robots.txt directives:
  ```
  User-agent: ChatGPT-User
  Allow: /
  User-agent: OAI-SearchBot
  Allow: /
  User-agent: GPTBot
  Allow: /
  ```
- Implement AI visibility monitoring (e.g., aivisibilityhq.com)
- Track and analyze LLM-driven traffic (estimated 24% of traffic)
- Optimize conversion paths for AI-referred visitors

### Search Engine Optimization Strategy

- Implement IndexNow for faster indexing in Bing and partners
- Create metadata guidelines:
  - Title tags (≤60 characters) with primary keywords
  - Meta descriptions (≤160 characters) with calls to action
- Develop heading strategy:
  - Unique H1 tags with primary keywords
  - H2/H3 structure containing secondary keywords
- Design internal linking strategy for site authority distribution

### Structured Data Strategy

- Implement schema markup for key content types:
  - FAQPage for frequently asked questions
  - HowTo for instructional content
  - Article for blog and news content
  - Product for product pages
- Example structured data template:
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
- Regularly validate structured data implementation

## Content Marketing Strategy

### Content Freshness Strategy

- Implement content update schedule
- Add "Last updated" timestamps on all content:
  ```html
  <time datetime="2025-05-13">Last updated: May 13, 2025</time>
  ```
- Update content with current year references when appropriate
- Establish content audit process for outdated material

### Link Building Campaign

- Develop outreach strategy for obtaining quality backlinks:
  - Guest posting on industry publications
  - Industry collaborations and partnerships
  - Expert quotes through HARO (Help A Reporter Out)
  - Participation in industry reviews and roundups
- Track and measure link acquisition performance

### Data-Driven Content Plan

- Create original research content calendar
- Identify public datasets for unique content creation
- Develop data visualization and infographic templates
- Establish process for trend analysis and reporting

### Sales Funnel Content Strategy

- Map content to buyer journey stages:
  - Awareness: Educational content about industry problems
  - Consideration: Content highlighting product benefits
  - Decision: Detailed product comparisons and case studies
- Create dedicated product information architecture:
  - Features and benefits sections
  - Audience-specific landing pages
  - Problem-solution frameworks
  - Pricing and plans presentation
- Develop comprehensive support content (FAQs, documentation)

### Long-Tail Content Strategy

- Identify long-tail keyword opportunities
- Create content templates for scalable content creation
- Establish content generation workflow for contextual queries
- Define content expansion plan for location or variant-based pages

### Off-Site Content Distribution

- Identify high-authority platforms for content syndication (Medium, Reddit)
- Create content repurposing workflow for multiple platforms
- Establish backlink and brand mention guidelines
- Set up monitoring for off-site content performance

## Marketing Analytics & Measurement

### Conversion Optimization

- Implement conversion tracking for all marketing channels
- Develop A/B testing strategy for landing pages
- Optimize click-through rates for search result listings
- Create counter-strategies for zero-click searches (AI Overviews)

### Performance Measurement

- Establish KPIs for all marketing initiatives
- Create dashboards for real-time performance monitoring
- Set up regular reporting schedule
- Develop optimization workflow based on performance data

## Marketing Testing & Validation

- Establish SEO audit schedule and processes
- Define user testing protocols for content effectiveness
- Create engagement monitoring framework
- Develop conversion funnel analysis methodology
