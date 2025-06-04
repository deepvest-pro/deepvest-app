# UX Flow - Startup Founder Journey

This document describes in detail the user experience for startup founders and their teams on the DeepVest platform.

## 1. User Registration and Authentication

### 1.1 Initial Registration

1. User visits the DeepVest landing page
2. Clicks the "Sign Up" button in the navigation header
3. Gets access to registration options:
   - Email/password registration
   - Social authentication (Google, LinkedIn, X, GitHub)
4. Fills out the registration form:
   - Full name
   - Email address
   - Password (with complexity indicator)
   - Checkbox to accept Terms of Use and Privacy Policy
5. Submits the form
6. Receives a confirmation email with a verification link
7. Clicks the link to activate the account
8. Redirected to the onboarding flow
9. If the user authenticated through social media, they are immediately redirected to the onboarding flow without requiring email confirmation.

### 1.2 Authentication

1. User visits DeepVest and clicks "Sign In"
2. Enters credentials (email/password or social login)
3. Redirected to the dashboard
4. If the user authenticated through social media but doesn't exist in the system, they are automatically registered and redirected to the onboarding flow.

### 1.3 Account Recovery

1. On the login screen, clicks "Forgot Password"
2. Enters email address
3. Receives a password reset email
4. Creates a new password
5. Redirected to the login screen

### 1.4 User Onboarding

1. After registration, completes profile filling:
   - Professional experience
   - Role in startup ecosystem
   - Areas of interest (categories/tags)
   - Optional: Profile photo upload
2. Offered to create first project or explore existing projects

### 1.5 User Profile

1. User can access profile through menu in site header
2. In the profile, one can:
   - Change basic information (first name, last name, description)
   - Set a unique nickname for use in profile URL
   - Upload or update profile photo
   - Connect/disconnect social networks (Google, LinkedIn, X, GitHub)
   - Change email (requires confirmation)
   - Change password (if registered via email)
3. The profile has a "Favorite Projects" tab:
   - Shows all projects the user is subscribed to
   - Sorted by date added (newest first)
   - Interface similar to leaderboard
   - Ability to unsubscribe from projects

## 2. Project Creation and Team Management

### 2.1 Creating a New Project

1. From dashboard, clicks "Add New Project" button
2. Enters basic project information:
   - Project name
   - Unique slug (auto-generated but editable)
   - Project tagline (optional)
   - Brief description
   - Project status (idea, concept, prototype, etc.)
   - Country/City (optional)
3. Uploads project logo (optional)
4. Selects main category and additional categories
5. Adds relevant tags
6. Creates initial project in "draft" mode (not public)
7. Receives confirmation of successful creation and guidance for next steps

### 2.2 Inviting Team Members

1. From the project management page, navigates to "Team" section
2. Clicks "Add Team Member" button
3. Enters team member data:
   - Name
   - Email
   - Role(s)
   - Founder status (yes/no)
   - Percentage share (optional)
4. Sets access permission level:
   - View
   - Edit
   - Admin
5. Clicks "Send Invitation"
6. Team member receives invitation via email with link to register/login
7. Invitation status is tracked in team management panel
8. Ability to resend invitation or revoke access

### 2.3 Team Collaboration Dashboard

1. All team members see the project in their dashboard
2. Permission levels determine available actions

## 3. Project Management and Editing

### 3.1 Content Management

1. From project dashboard, access various content sections:
   - Project overview
   - Team information
   - Project content (presentations, research, documents)
   - Metrics and traction
   - Funding information
   - Milestones and roadmap
   - Social proof
2. Each section has an "Edit" button for authorized team members with appropriate permissions.

### 3.2 Project Snapshot Version Management

1. Any editing creates a new project snapshot (working draft)
2. Changes can be made to various project sections:
   - Current snapshot version
   - Basic information (name, tagline, description)
   - Project status
   - Team composition
   - Content files (pitch decks, whitepapers)
   - Metrics and achievements
   - Funding rounds
   - Milestones
3. Changes are tracked with version history
4. Team members with appropriate permissions can:
   - Make changes to working draft
   - Preview changes
   - Compare with published version
   - Publish new snapshot

### 3.3 Publishing Project Updates

1. From project dashboard, clicks "Preview" button, which opens a new browser tab with project preview showing the new snapshot version.
2. On the preview page, clicks "Publish" button, receives notification that the snapshot will be fixed and cannot be changed.
3. Confirms publication or returns to editing
4. Previous public snapshot becomes locked and unavailable for republication
5. New snapshot becomes the public version

### 3.4 AI Scoring

1. After snapshot publication, AI automatically generates basic project scoring
2. Scoring process takes time and has statuses: "queued", "in progress", "completed"
3. Scoring results are available on a special project tab:
   - Investment rating
   - Market potential
   - Team competence
   - Technological innovation
   - Business model
   - Execution risk
   - Overall score

### 3.5 AI Recommendations

1. User can request AI recommendations for project improvement at any time through a special button
2. Recommendations are displayed in a separate section as checkboxes
3. For each recommendation, the user can:
   - Accept and implement (by checking the checkbox)
   - Reject with option to leave a comment about the reason for rejection
4. Recommendations are not categorized, displayed as a flat list
5. Request for detailed analysis can be made through:
   - Social promotion (posting on X with DeepVest tag)
   - One-time payment for in-depth analysis
6. Status of requested analysis is tracked (started, in progress, completed)

## 4. Project Discovery and Leaderboard

### 4.1 Viewing Project Leaderboard

1. Navigates to "Leaderboard" section from main navigation
2. Views ranked projects by various criteria:
   - Overall score
   - Industry categories
   - Growth potential
   - Recent updates
   - Trending projects
3. Applies filters:
   - Project stage
   - Category/industry
   - Location
   - Founded date range
   - Funding status
4. Adjusts view (grid, list, compact)
5. Sorts by various metrics

### 4.2 Viewing Project Profiles

1. Clicks on project card to view full profile
2. Navigation through sections via tabs:
   - Overview
   - Team
   - Content
   - Metrics and traction
   - Funding
   - Milestones
   - Social proof
3. Can subscribe to projects of interest

### 4.3 Discovery Features

1. Receives personalized project recommendations based on:
   - Previously viewed projects
   - Tracked categories
   - Similar industry focus
2. Explores curated collections:
   - "Rising Stars"
   - "Most Improved"
   - "Category Leaders"
   - "New Arrivals"
3. Views trending tags and categories
4. Access to advanced search with complex queries

## 5. Project Settings and Privacy

### 5.1 Project Settings Management

1. Navigates to "Settings" from project navigation
2. Configures:
   - Project visibility (public/private)
   - Team access permissions
   - Integration settings (repository links, website monitoring)
   - Custom URL
   - Content visibility controls
3. Saves changes with confirmation

### 5.2 Project Privacy Management

1. Controls what information is visible publicly
2. Sets visibility for individual content elements
3. Controls metrics visibility
4. Manages team information display
5. Sets funding information disclosure levels

### 5.3 Project Archiving

1. From settings page, navigates to "Danger Zone" section
2. Selects option to archive project (hidden but accessible to owner)
3. Confirms archiving with password input
4. Archived project is visible only to owner and unavailable for public viewing
5. Owner can restore project from archive at any time