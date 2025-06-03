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

### `public.project_permissions`

Controls access to projects.

| Column     | Type      | Description                                  | Constraints             |
| ---------- | --------- | -------------------------------------------- | ----------------------- |
| id         | UUID      | Primary key                                  | PRIMARY KEY             |
| created_at | TIMESTAMP | When the permission was created              | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | When the permission was last updated         | NOT NULL, DEFAULT NOW() |
| project_id | UUID      | References projects.id                       | NOT NULL                |
| user_id    | UUID      | References auth.users.id                     | NOT NULL                |
| role       | TEXT      | One of: 'viewer', 'editor', 'admin', 'owner' | NOT NULL                |

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

**Trigger**: `update_user_profiles_updated_at` (BEFORE UPDATE ON user_profiles)

### `public.is_nickname_available(nickname TEXT)`

Checks if a nickname is already taken.

**Returns**: BOOLEAN

## Row Level Security Policies

DeepVest uses Row Level Security (RLS) to control access to data at the database level.

### user_profiles policies:

- `Profiles are viewable by everyone`: Anyone can view any profile
- `Users can update their own profile`: Users can only update their own profile
- `Users can delete their own profile`: Users can only delete their own profile

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
