# DeepVest Database Schema

This document describes the database structure used in the DeepVest application.

## Overview

DeepVest uses Supabase as its database backend, with PostgreSQL as the underlying database engine. The database consists of several tables organized in different schemas:

- `auth`: Managed by Supabase, handles authentication
- `public`: Contains application-specific tables
- `storage`: Managed by Supabase, handles file storage

## Authentication Schema (`auth`)

This schema is managed by Supabase and contains tables related to authentication and authorization.

### `auth.users`

The primary table for user accounts, managed by Supabase Auth.

| Column             | Type | Description                                                      |
| ------------------ | ---- | ---------------------------------------------------------------- |
| id                 | UUID | Primary key, unique identifier for each user                     |
| email              | TEXT | User's email address (can be null if using phone or social auth) |
| phone              | TEXT | User's phone number (can be null if using email)                 |
| raw_user_meta_data | JSON | Metadata about the user (name, avatar, etc.)                     |
| raw_app_meta_data  | JSON | Application metadata (providers used for auth)                   |
| ...                | ...  | Plus other columns managed by Supabase                           |

### `auth.identities`

Stores connections to OAuth providers (Google, GitHub, LinkedIn, etc.)

| Column        | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| id            | UUID      | Primary key                                 |
| user_id       | UUID      | Foreign key to auth.users                   |
| identity_data | JSON      | Provider-specific data                      |
| provider      | TEXT      | Name of the provider (google, github, etc.) |
| created_at    | TIMESTAMP | When the identity was created               |
| ...           | ...       | Plus other columns managed by Supabase      |

## Public Schema (`public`)

Contains application-specific tables.

### `public.user_profiles`

Extends the built-in auth.users with application-specific profile information.

| Column                  | Type      | Description                            | Constraints                                              |
| ----------------------- | --------- | -------------------------------------- | -------------------------------------------------------- |
| id                      | UUID      | Primary key, references auth.users(id) | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| created_at              | TIMESTAMP | When the profile was created           | NOT NULL, DEFAULT NOW()                                  |
| updated_at              | TIMESTAMP | When the profile was last updated      | NOT NULL, DEFAULT NOW()                                  |
| full_name               | TEXT      | User's full name                       | NOT NULL                                                 |
| nickname                | TEXT      | Unique username for URLs               | NOT NULL, UNIQUE                                         |
| avatar_url              | TEXT      | URL to user's avatar                   | NULL allowed                                             |
| cover_url               | TEXT      | URL to user's cover image              | NULL allowed                                             |
| bio                     | TEXT      | Short biography                        | NULL allowed                                             |
| professional_background | TEXT      | Professional experience description    | NULL allowed                                             |
| startup_ecosystem_role  | TEXT      | Role in startup ecosystem              | NULL allowed                                             |
| country                 | TEXT      | User's country                         | NULL allowed                                             |
| city                    | TEXT      | User's city                            | NULL allowed                                             |
| website_url             | TEXT      | User's personal website                | NULL allowed                                             |
| x_username              | TEXT      | X/Twitter username                     | NULL allowed                                             |
| linkedin_username       | TEXT      | LinkedIn username                      | NULL allowed                                             |
| github_username         | TEXT      | GitHub username                        | NULL allowed                                             |

**Policies**:

- SELECT: All users can view all profiles
- UPDATE: Users can only update their own profile
- DELETE: Users can only delete their own profile

### `public.projects`

Main table to store projects created by users.

| Column             | Type      | Description                             | Constraints                                 |
| ------------------ | --------- | --------------------------------------- | ------------------------------------------- |
| id                 | UUID      | Primary key                             | PRIMARY KEY, DEFAULT gen_random_uuid()      |
| created_at         | TIMESTAMP | When the project was created            | NOT NULL, DEFAULT NOW()                     |
| updated_at         | TIMESTAMP | When the project was last updated       | NOT NULL, DEFAULT NOW()                     |
| slug               | TEXT      | Unique slug for URL                     | NOT NULL, UNIQUE                            |
| public_snapshot_id | UUID      | Reference to the public snapshot        | REFERENCES snapshots(id) ON DELETE SET NULL |
| new_snapshot_id    | UUID      | Reference to the working draft snapshot | REFERENCES snapshots(id) ON DELETE SET NULL |
| is_public          | BOOLEAN   | Whether the project is publicly visible | NOT NULL, DEFAULT false                     |
| is_demo            | BOOLEAN   | Whether it's a demo project             | NOT NULL, DEFAULT false                     |
| is_archived        | BOOLEAN   | Whether the project is archived         | NOT NULL, DEFAULT false                     |

**Policies**:

- SELECT: Public projects are viewable by everyone
- SELECT: Project owners can view their non-archived projects (even if private)
- UPDATE: Users with editor, admin, or owner role can update projects (general updates)
- UPDATE: Project owners can update all project fields, including is_public and is_archived
- UPDATE: Editors and admins can update limited fields (excluding is_public and is_archived)
- UPDATE: Only project owners can change publicity status (is_public and is_archived fields)
- DELETE: Only users with owner role can delete projects

### `public.snapshots`

Stores different versions of project content.

| Column          | Type                | Description                        | Constraints                                         |
| --------------- | ------------------- | ---------------------------------- | --------------------------------------------------- |
| id              | UUID                | Primary key                        | PRIMARY KEY, DEFAULT gen_random_uuid()              |
| created_at      | TIMESTAMP           | When the snapshot was created      | NOT NULL, DEFAULT NOW()                             |
| updated_at      | TIMESTAMP           | When the snapshot was last updated | NOT NULL, DEFAULT NOW()                             |
| project_id      | UUID                | Foreign key to projects            | NOT NULL, REFERENCES projects(id) ON DELETE CASCADE |
| version         | INTEGER             | Sequential version number          | NOT NULL                                            |
| name            | TEXT                | Project name in this snapshot      | NOT NULL                                            |
| slogan          | TEXT                | Short tagline for the project      | NULL allowed                                        |
| description     | TEXT                | Detailed project description       | NOT NULL                                            |
| status          | project_status_enum | Current project stage              | NOT NULL (enum of project stages)                   |
| country         | TEXT                | Project's country                  | NULL allowed                                        |
| city            | TEXT                | Project's city                     | NULL allowed                                        |
| repository_urls | TEXT[]              | Array of repository URLs           | NULL allowed                                        |
| website_urls    | TEXT[]              | Array of website URLs              | NULL allowed                                        |
| logo_url        | TEXT                | URL to project logo                | NULL allowed                                        |
| banner_url      | TEXT                | URL to project banner              | NULL allowed                                        |
| video_urls      | TEXT[]              | Array of video URLs                | NULL allowed                                        |
| author_id       | UUID                | User who created this snapshot     | NOT NULL, REFERENCES auth.users(id)                 |
| is_locked       | BOOLEAN             | Whether the snapshot is locked     | NOT NULL, DEFAULT false                             |

**Policies**:

- SELECT: Public snapshots (published versions) are viewable by everyone
- SELECT: Users with permissions on a project can view its snapshots
- INSERT: Users with editor, admin, or owner role can create snapshots
- UPDATE: Only unlocked snapshots can be updated by users with editor+ role
- UPDATE to is_locked: Only owners can lock/unlock snapshots

### `public.project_permissions`

Controls access to projects.

| Column     | Type              | Description                                  | Constraints                                           |
| ---------- | ----------------- | -------------------------------------------- | ----------------------------------------------------- |
| id         | UUID              | Primary key                                  | PRIMARY KEY, DEFAULT gen_random_uuid()                |
| created_at | TIMESTAMP         | When the permission was created              | NOT NULL, DEFAULT NOW()                               |
| updated_at | TIMESTAMP         | When the permission was last updated         | NOT NULL, DEFAULT NOW()                               |
| project_id | UUID              | References projects.id                       | NOT NULL, REFERENCES projects(id) ON DELETE CASCADE   |
| user_id    | UUID              | References auth.users.id                     | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| role       | project_role_enum | One of: 'viewer', 'editor', 'admin', 'owner' | NOT NULL                                              |

**Policies**:

- SELECT: Users can view their own permissions
- SELECT: Admins and owners can view all permissions for their projects
- ALL: Owners can manage all permissions for their projects

## Enums

### `project_status_enum`

Defines possible project stages:

```
'idea', 'concept', 'prototype', 'mvp', 'beta', 'launched', 'growing', 'scaling', 'established', 'acquired', 'closed'
```

### `project_role_enum`

Defines permission roles:

```
'viewer', 'editor', 'admin', 'owner'
```

## Functions and Triggers

### `public.handle_new_user()`

Automatically creates a user profile when a new user registers in auth.users.

**Trigger**: `on_auth_user_created` (AFTER INSERT ON auth.users)

**Actions**:

- Generates a default nickname based on email
- Extracts profile information from OAuth providers if available
- Creates a new record in user_profiles

### `public.update_updated_at_column()`

Updates the updated_at timestamp whenever a record is updated.

**Trigger**: Applied to all tables with updated_at columns.

### `public.is_nickname_available(nickname TEXT)`

Checks if a nickname is already taken.

**Returns**: BOOLEAN

### `public.create_project(p_name TEXT, p_slug TEXT, p_description TEXT, p_status project_status_enum)`

Creates a new project with an initial snapshot and assigns the current user as owner.

**Returns**: UUID (the new project ID)

**Actions**:

- Creates a new project with the given slug
- Creates the first snapshot (version 1) with provided details
- Sets the snapshot as the new_snapshot_id for the project
- Assigns the current user the 'owner' role for the project

## Row Level Security Policies

DeepVest uses Row Level Security (RLS) to control access to data at the database level. Key policies include:

### user_profiles policies:

- Anyone can view any profile
- Users can only update their own profile
- Users can only delete their own profile

### projects policies:

- Public projects are viewable by everyone
- Project owners can view their non-archived projects (even if private)
- Users with editor, admin, or owner role can update projects (general updates)
- Project owners can update all project fields, including is_public and is_archived
- Editors and admins can update limited fields (excluding is_public and is_archived)
- Only project owners can change publicity status (is_public and is_archived fields)
- Only owners can delete projects

### snapshots policies:

- Public snapshots are viewable by everyone
- Users with project permissions can view snapshots
- Only editors, admins, and owners can create or edit snapshots
- Only owners can lock/unlock snapshots

### project_permissions policies:

- Users can view their own permissions
- Admins and owners can view all permissions for their projects
- Only owners can manage permissions

## How to Extend the Schema

When adding new tables or modifying existing ones:

1. Create a new SQL file in the project
2. Run the SQL against your Supabase database
3. Update the TypeScript types in `src/types/supabase.ts`
4. Update this documentation with the changes

## Database Sync Process

To keep this documentation in sync with the actual database schema:

1. Any changes to the database schema should be documented here
2. When the schema is updated, this documentation must be updated accordingly
3. SQL scripts for creating new tables or modifying existing ones should be saved in `docs/supabase_db_setup.sql`
