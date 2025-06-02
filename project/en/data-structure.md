# Data structure

## Project

_It has a table in the database._

Any project has a public snapshot, which is the public content of the project.
When owner updates the project, it creates a new snapshot and when owner publishes the updated project, it sets the new snapshot as the public snapshot, but the previous public snapshot should be locked and unpublishable. All the snapshots are available for all users and guests.

Owner can select the public snapshot from the old snapshots.

```js
type Project = {
  id?: string, // UUID
  slug: string, // Slug of the project, unique for projects, can't be changed
  created_at: string, // ISO date
  updated_at: string, // ISO date
  public_snapshot_id: Snapshot["id"], // UUID
  new_snapshot_id?: Snapshot["id"], // UUID
  is_public: boolean,
  permissions_ids: ProjectPermission["id"][],
  is_demo: boolean, // Whether the project is a demo, not a real project
  is_archived: boolean, // Whether the project is archived
};
```

## Snapshots

_It has a table in the database._

```js
type Snapshot = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  version: number, // Sequential version number
  name: string,
  slogan?: string,
  description: string,
  status:
    | "idea"
    | "concept"
    | "prototype"
    | "mvp"
    | "beta"
    | "launched"
    | "growing"
    | "scaling"
    | "established"
    | "acquired"
    | "closed",
  country?: string,
  city?: string,
  repository_urls?: string[], // Validation with Github, Gitlab, etc.
  website_urls?: string[], // Validation with Website, etc.
  logo_url?: string, // Link to the inner storage
  banner_url?: string, // Link to the inner storage
  video_urls?: string[], // Validation with Youtube, Vimeo, etc.
  contents: ProjectContent["id"][], // Array of UUIDs
  team_members: TeamMember["id"][], // Array of UUIDs
  categories: Category["id"][], // Array of category UUIDs, first one is the main category
  tags_ids: Tag["id"][], // Array of tag UUIDs
  author_id: string, // User UUID who published this snapshot
  is_locked: boolean, // True for old snapshots and false for new snapshot. Only one can be new.
  scoring_id: ProjectScoring["id"], // UUID, calculated scoring for this version of the project.
};
```

## TeamMember

_It has a table in the database._

Member cannot be deleted if it is in the locked snapshot.

```js
type TeamMember = {
  id?: string, // UUID
  user_id?: string, // User UUID
  joined_at?: string, // ISO date
  departed_at?: string, // ISO date
  departed_reason?: string, // Reason for departure
  name: string,
  email?: string,
  phone?: string,
  image_url?: string,
  country?: string,
  city?: string,
  is_founder: boolean,
  equity_percent?: number, // Percentage of the equity
  roles: string[],
  status: "ghost" | "invited" | "active" | "inactive", // ghost is a user who not registered yet
  x_url?: string,
  is_x_verified?: boolean,
  github_url?: string,
  is_github_verified?: boolean,
  linkedin_url?: string,
  is_linkedin_verified?: boolean,
  pii_hash?: string, // Hash of the PII data for KYC
};
```

## ProjectContent

_It has a table in the database._

Content cannot be deleted if it is in the locked snapshot.

```js
type ProjectContent = {
  id?: string, // UUID
  slug: string, // Slug of the content, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  title: string,
  content_type:
    | "presentation"
    | "research"
    | "pitch_deck"
    | "whitepaper"
    | "video"
    | "audio"
    | "image"
    | "report"
    | "document"
    | "spreadsheet"
    | "table"
    | "chart"
    | "infographic"
    | "case_study"
    | "other",
  content: string, // Markdown
  file_urls: string[],
  author_id: string, // User UUID
  is_public: boolean,
  deleted_at: string, // ISO date
};
```

## ProjectScoring

_It has a table in the database._

```js
type ProjectScoring = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  snapshot_id: string, // UUID
  status: "new" | "in_progress" | "completed" | "failed",
  investment_rating?: number,
  market_potential?: number,
  team_competency?: number,
  tech_innovation?: number,
  business_model?: number,
  execution_risk?: number,
  summary?: string,
  research?: string,
  score?: number,
  ai_model_version: string, // Version of the AI model used to generate the scoring
};
```

## Category

_It has a table in the database._

```js
type Category = {
  id?: string, // UUID
  slug: string, // Slug of the category, unique for categories
  created_at: string, // ISO date
  updated_at: string, // ISO date
  name: string,
  description?: string,
  parent_id?: string, // UUID, for hierarchical categories
  is_active: boolean,
  order: number,
};
```

## Tag

_It has a table in the database._

```js
type Tag = {
  id?: string, // UUID
  slug: string, // Slug of the tag, unique for tags
  created_at: string, // ISO date
  updated_at: string, // ISO date
  name: string,
  description?: string,
  is_active: boolean,
  order: number,
  color?: string,
};
```

## InvestmentResearchReport

_It has a table in the database. Renamed from ProjectFoundResearch for clarity._

```js
type InvestmentResearchReport = {
  id?: string, // UUID
  slug: string, // Slug of the investment research report, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  snapshot_id: string, // UUID
  title: string,
  content: string, // Markdown
  file_urls: string[],
  author_id: string, // User UUID
  is_public: boolean,
};
```

## ProjectPermission

_It has a table in the database._

`owner` and `admin` can invite users to the project.
Only `owner` can change the permissions of the project.
Only `owner` can change `is_public` of the project.

```js
type ProjectPermission = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  user_id: string, // User UUID
  role: "viewer" | "editor" | "admin" | "owner", // Only one "owner" is allowed per project
};
```

## ProjectMetric

_It has a table in the database._

```js
type ProjectMetric = {
  id?: string, // UUID
  slug: string, // Slug of the metric, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  name: string, // Name of the metric (e.g., "Monthly Active Users")
  unit: string, // Unit of measurement (e.g., "users", "$", "%")
  is_public: boolean,
};
```

## ProjectMetricValue

_It has a table in the database._

```js
type ProjectMetricValue = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_metric_id: string, // UUID
  week_start: string, // ISO date of the end of the week (always Sunday)
  value: number, // Numerical value of the metric
  note?: string, // Optional note about this value
};
```

## FundingRound

_It has a table in the database._

```js
type FundingRound = {
  id?: string, // UUID
  slug: string, // Slug of the funding round, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  snapshot_id: string, // UUID, which snapshot this funding round belongs to
  type:
    | "grant"
    | "hackathon"
    | "pre-seed"
    | "seed"
    | "series_a"
    | "series_b"
    | "series_c"
    | "series_d"
    | "acquisition"
    | "ipo"
    | "safe"
    | "convertible_note"
    | "bridge"
    | "crowdfunding"
    | "strategic"
    | "secondary"
    | "other",
  status: "announced" | "closed" | "pending" | "rumoured",
  date: string, // ISO date of the funding
  amount: number, // Amount in USD
  investor_name?: string, // Name of the investor/fund/organization
  proof_urls?: string[], // Array of URLs proving the funding
  description?: string, // Additional details
  valuation_pre?: number, // Valuation pre-money in USD
  valuation_post?: number, // Valuation post-money in USD
};
```

## Milestone

_It has a table in the database._

```js
type Milestone = {
  id?: string, // UUID
  slug: string, // Slug of the milestone, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID
  snapshot_id: string, // UUID, which snapshot this milestone belongs to
  title: string,
  description: string,
  target_date?: string, // ISO date of the planned completion
  completion_date?: string, // ISO date of the actual completion
  status: "planned" | "in_progress" | "completed" | "delayed" | "cancelled",
  comment?: string, // Additional comments from the startup founder, e.g. reasons for delays
  proof_urls?: string[], // Array of URLs proving the milestone completion
};
```

## SocialProof

_It has a table in the database._

```js
type SocialProof = {
  id?: string, // UUID
  slug: string, // Slug of the social proof, unique inside the project
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID, directly tied to project, not to snapshot
  type:
    | "patent"
    | "press"
    | "award"
    | "mention"
    | "testimonial"
    | "partnership"
    | "certification"
    | "accelerator"
    | "event"
    | "other",
  title: string,
  description: string,
  date: string, // ISO date
  source: string, // Name of the source
  url?: string, // URL to the proof
  image_url?: string, // URL to related image
  reach?: number, // Number of reach
};
```

## ProjectFollower

_It has a table in the database._

```js
type ProjectFollower = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID, linked to the project
  user_id: string, // UUID, linked to the user who follows
  notify_by_email: boolean, // Whether the follower wants to receive email notifications
  notification_frequency: "immediately" | "daily" | "weekly" | "monthly", // How often to send notifications
};
```

## DealFlow

_It has a table in the database._

```js
type DealFlow = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  investor_id: string, // UUID of the investor user
  project_id: string, // UUID of the project
  status:
    | "discovered"
    | "contacted"
    | "meeting_scheduled"
    | "meeting_held"
    | "interested"
    | "due_diligence"
    | "term_sheet"
    | "negotiation"
    | "committed"
    | "invested"
    | "rejected"
    | "passed", // Current stage in the investment funnel
  stage_changed_at: string, // ISO date when the status was last changed
  notes?: string, // Private notes for the investor
  deal_size?: number, // Potential investment amount in USD
  last_activity_date?: string, // ISO date of the last interaction
  next_steps?: string, // Plan for next actions
  priority: "high" | "medium" | "low", // Investment priority
};
```

## ProjectBadge

_It has a table in the database._

```js
type ProjectBadge = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID of the project
  badge_type:
    | "fastest_growing"
    | "top_ai"
    | "top_fintech"
    | "top_healthcare"
    | "top_enterprise"
    | "community_favorite"
    | "investor_choice"
    | "trending_now"
    | "viral_growth"
    | "proven_business_model"
    | "exceptional_team"
    | "innovative_tech"
    | "impact_champion"
    | "rapid_scaling"
    | "funding_milestone",
  expires_at?: string, // ISO date when badge expires (if temporary)
  data?: any, // Additional data about the badge (e.g., specific metrics that led to award)
  is_public: boolean, // Whether the badge is visible on the project profile
};
```

## AIRecommendation

_It has a table in the database._

```js
type AIRecommendation = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  project_id: string, // UUID of the project
  snapshot_id?: string, // Optional UUID of the specific snapshot this recommendation relates to
  type:
    | "team_description"
    | "milestone_addition"
    | "content_improvement"
    | "metrics_addition"
    | "funding_details"
    | "social_proof"
    | "project_description"
    | "technology_details"
    | "market_analysis"
    | "competitive_advantage"
    | "business_model"
    | "traction_evidence",
  status: "new" | "acknowledged" | "implemented" | "dismissed",
  title: string, // Short title of the recommendation
  description: string, // Detailed explanation of the recommendation
  priority: "high" | "medium" | "low", // Priority level
  ai_model_version: string, // Version of the AI model that generated this recommendation
  confidence_score: number, // 0-100 score indicating AI confidence in this recommendation
  implemented_at?: string, // ISO date when the recommendation was implemented
  dismissed_at?: string, // ISO date when the recommendation was dismissed
  dismissed_reason?: string, // Optional reason for dismissal
};
```

## Supabase Auth Integration

Supabase provides built-in authentication system with tables in the `auth` schema. We'll leverage Supabase Auth for user management and authentication, extending it with our custom profile information.

### Auth.Users

_This is a built-in Supabase Auth table that cannot be modified directly._

```js
// Reference only - managed by Supabase
type SupabaseAuthUser = {
  id: string, // UUID, primary key
  instance_id: string, // UUID, references to auth.instances
  aud: string, // JWT audience
  role: string, // User role
  email: string, // User email (can be null if using phone or social only)
  encrypted_password: string, // Encrypted password (can be null if using social login)
  email_confirmed_at: string, // Timestamp when email was confirmed
  invited_at: string, // Timestamp when user was invited
  confirmation_token: string, // Token for email confirmation
  confirmation_sent_at: string, // Timestamp when confirmation was sent
  recovery_token: string, // Token for password recovery
  recovery_sent_at: string, // Timestamp when recovery token was sent
  email_change_token_new: string, // Token for new email verification
  email_change: string, // New email address (for change process)
  email_change_sent_at: string, // Timestamp when email change was requested
  last_sign_in_at: string, // Timestamp of last sign in
  raw_app_meta_data: json, // Application metadata (includes provider info)
  raw_user_meta_data: json, // User metadata
  is_super_admin: boolean, // Whether user is a super admin
  created_at: string, // Timestamp when user was created
  updated_at: string, // Timestamp when user was updated
  phone: string, // Phone number
  phone_confirmed_at: string, // Timestamp when phone was confirmed
  phone_change: string, // New phone number (for change process)
  phone_change_token: string, // Token for phone change
  phone_change_sent_at: string, // Timestamp when phone change was requested
  confirmed_at: string, // Timestamp of confirmation
  email_change_token_current: string, // Token for current email in change process
  email_change_confirm_status: number, // Status of email change confirmation
  banned_until: string, // Timestamp until when user is banned
  reauthentication_token: string, // Token for reauthentication
  reauthentication_sent_at: string, // Timestamp when reauthentication was sent
  is_sso_user: boolean, // Whether user was authenticated via SSO
  deleted_at: string, // Timestamp when user was deleted (soft delete)
};
```

### Identity Providers

_This is a built-in Supabase Auth table that stores connections to OAuth providers._

```js
// Reference only - managed by Supabase
type SupabaseIdentity = {
  id: string, // UUID, primary key
  user_id: string, // UUID, references auth.users.id
  identity_data: json, // Provider-specific identity data
  provider: string, // Provider name (google, github, linkedin, twitter, etc.)
  last_sign_in_at: string, // Timestamp of last sign in with this provider
  created_at: string, // Timestamp when identity was created
  updated_at: string, // Timestamp when identity was updated
};
```

Supabase automatically manages connections to OAuth providers in this table. When a user connects or disconnects a social provider, entries are added or removed from this table. The application can check which providers are connected by querying this table or accessing the `raw_app_meta_data.providers` array in the auth.users table.

### UserProfiles

_This is our custom table that extends the auth.users with application-specific data._

```js
type UserProfile = {
  id: string, // UUID, primary key, references auth.users.id
  created_at: string, // ISO date, auto-generated by Supabase
  updated_at: string, // ISO date, auto-generated by Supabase
  full_name: string, // User's full name (can be pre-filled from OAuth provider)
  nickname: string, // Unique username for URL
  avatar_url?: string, // URL to user avatar (can be from storage or OAuth provider)
  bio?: string, // Short user biography
  professional_background?: string, // Description of professional experience
  startup_ecosystem_role?: string, // Role in startup ecosystem

  // Contact & location
  country?: string,
  city?: string,
  website_url?: string,

  // Social profiles (username or ID only, not full URLs)
  x_username?: string, // X/Twitter username
  linkedin_username?: string, // LinkedIn username
  github_username?: string, // GitHub username

  // Additional settings or preferences can be added here
};
```

### Social Authentication Workflow

1. **Social Account Connection**:

   - When a user signs up or logs in with a social provider, Supabase automatically:
     - Creates an entry in auth.users if the user is new
     - Adds an entry to auth.identities linking the user to the provider
     - Populates raw_app_meta_data.providers with an array of connected providers
   - For existing users, they can connect additional providers through the profile settings

2. **Accessing Connected Providers**:

   - The frontend can access the list of connected providers via the Supabase client:
     ```js
     const {
       data: { user },
     } = await supabase.auth.getUser();
     const connectedProviders = user.app_metadata.providers || [];
     // Returns e.g. ["google", "github"]
     ```

3. **Disconnecting Social Accounts**:

   - Supabase doesn't have a built-in API for disconnecting providers
   - We will implement a custom endpoint using Supabase Edge Functions that:
     1. Checks if the user has at least one alternative login method (email/password or another provider)
     2. Removes the identity entry from auth.identities
     3. Updates the raw_app_meta_data.providers array
   - The user must have at least one authentication method (can't disconnect all providers without setting up email/password)

4. **Social Profile Information**:
   - When a user connects a social account, we can access profile data from the provider (like name, avatar, etc.)
   - This data is stored in auth.identities.identity_data
   - On first signup, we populate UserProfile with data from the provider
   - The UserProfile fields (x_username, linkedin_username, etc.) are manually editable and not automatically synchronized with providers

## FavoriteProject

_It has a table in the database._

```js
type FavoriteProject = {
  id?: string, // UUID
  created_at: string, // ISO date
  updated_at: string, // ISO date
  user_id: string, // UUID of the user, references auth.users.id
  project_id: string, // UUID of the favorited project
};
```
