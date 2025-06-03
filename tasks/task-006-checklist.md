# Project Snapshot Versioning Checklist

## Database Schema and Storage Strategy

- [x] Design snapshot database schema
  - [x] Create snapshots table with proper relationships
  - [x] Define project_status_enum for snapshot status tracking
  - [x] Implement foreign key constraints between projects and snapshots
  - [x] Add version tracking with unique constraints (project_id, version)
  - [x] Include metadata fields (author_id, is_locked, timestamps)
- [x] Implement Row Level Security (RLS) for snapshots
  - [x] Create policies for public snapshot visibility
  - [x] Set up policies for authenticated user access
  - [x] Implement permission-based snapshot creation/editing
  - [x] Add policies for locked snapshot protection
- [x] Create validation schema
  - [x] Define snapshot data structure in TypeScript types
  - [x] Implement validation for snapshot fields
  - [x] Add constraints for version numbering
  - [x] Create validation for snapshot locking mechanism

## Snapshot Creation and Metadata Tracking

- [x] Implement snapshot creation functionality
  - [x] Create `createNewSnapshot` helper function
  - [x] Implement automatic version incrementing
  - [x] Add author tracking for snapshot creation
  - [x] Include timestamp tracking (created_at, updated_at)
  - [x] Link snapshots to projects via foreign keys
- [x] Build snapshot metadata system
  - [x] Track snapshot author information
  - [x] Implement version numbering system
  - [x] Add snapshot locking mechanism (is_locked field)
  - [x] Include creation and modification timestamps
  - [x] Store snapshot status and project relationship
- [x] Implement snapshot-based project editing
  - [x] Draft/publish workflow using snapshots
  - [x] Automatic snapshot creation on project updates
  - [x] Link projects to current working snapshot (new_snapshot_id)
  - [x] Link projects to published snapshot (public_snapshot_id)

## Snapshot History and Management

- [x] Build snapshot retrieval system
  - [x] Implement `fetchAndProcessSnapshot` helper
  - [x] Create snapshot fetching with author expansion
  - [x] Add snapshot data processing and validation
  - [x] Handle snapshot access permissions
- [x] Implement snapshot publishing workflow
  - [x] Create `publishSnapshot` function
  - [x] Implement snapshot locking on publish
  - [x] Update project public_snapshot_id on publish
  - [x] Set project visibility on snapshot publish
- [x] Create snapshot permission system
  - [x] Implement viewer access for project snapshots
  - [x] Add editor permissions for snapshot creation/editing
  - [x] Restrict editing of locked snapshots
  - [x] Owner-only permissions for snapshot publishing
- [ ] Build snapshot history UI (deferred to future task)
  - [ ] Create timeline view of project snapshots
  - [ ] Add filtering and search capabilities
  - [ ] Implement snapshot details panel
  - [ ] Design responsive snapshot browser

## API Endpoints and Integration

- [x] Implement snapshot CRUD endpoints
  - [x] Create snapshot retrieval endpoint (GET /api/projects/[id]/snapshots/[snapshotId])
  - [x] Implement snapshot update endpoint (PUT /api/projects/[id]/snapshots/[snapshotId])
  - [x] Add proper authentication and authorization
  - [x] Include permission checking for snapshot operations
  - [x] Handle locked snapshot protection
- [x] Build project-snapshot integration
  - [x] Link projects to snapshots in database schema
  - [x] Implement snapshot-based project editing workflow
  - [x] Create publish draft functionality using snapshots
  - [x] Add snapshot data to project details API
- [x] Implement snapshot security
  - [x] Add RLS policies for snapshot access control
  - [x] Implement permission-based snapshot operations
  - [x] Create secure snapshot fetching with author expansion
  - [x] Add protection against unauthorized snapshot access

## Snapshot Comparison and Restoration

- [ ] Implement snapshot comparison functionality (deferred to future task)
  - [ ] Create diff algorithm for snapshot comparison
  - [ ] Design visual diff interface
  - [ ] Add side-by-side comparison view
  - [ ] Implement change highlighting and color coding
- [ ] Build snapshot restoration system (deferred to future task)
  - [ ] Create restoration workflow with conflict resolution
  - [ ] Implement restoration preview functionality
  - [ ] Add partial restoration capabilities
  - [ ] Design confirmation dialogs for restoration
  - [ ] Implement rollback for failed restorations
- [ ] Create diffing visualization (deferred to future task)
  - [ ] Design diff visualization components
  - [ ] Implement specialized diff views for different data types
  - [ ] Add export functionality for diff reports
  - [ ] Create API endpoints for programmatic diff access

## Advanced Snapshot Features

- [x] Implement snapshot locking mechanism
  - [x] Add is_locked field to snapshots table
  - [x] Prevent editing of locked snapshots via RLS policies
  - [x] Implement automatic locking on snapshot publish
  - [x] Add locked snapshot protection in API endpoints
- [x] Create snapshot-based draft system
  - [x] Use new_snapshot_id for draft versions
  - [x] Use public_snapshot_id for published versions
  - [x] Implement draft/publish workflow
  - [x] Add "Publish Draft" functionality in UI
- [ ] Implement snapshot optimization (deferred to future task)
  - [ ] Add compression for large snapshot data
  - [ ] Implement incremental snapshots
  - [ ] Create snapshot cleanup and archiving
  - [ ] Add snapshot storage optimization

## Database Functions and Helpers

- [x] Create database functions for snapshot operations
  - [x] Implement `publish_project_draft` RPC function
  - [x] Add snapshot-related helper functions in TypeScript
  - [x] Create secure snapshot fetching utilities
  - [x] Implement snapshot permission checking functions
- [x] Build snapshot integration helpers
  - [x] Create `fetchAndProcessSnapshot` utility
  - [x] Implement `publishSnapshot` helper function
  - [x] Add snapshot data processing and expansion
  - [x] Create snapshot-based project detail fetching

## ✅ TASK 6 COMPLETION STATUS

**CORE FUNCTIONALITY COMPLETED:**

- [x] **Snapshot Database Schema** ✅ **COMPLETE**

  - [x] Full snapshots table with proper relationships
  - [x] Version tracking and metadata storage
  - [x] RLS policies for security and access control
  - [x] Foreign key constraints and data integrity

- [x] **Snapshot Creation and Management** ✅ **COMPLETE**

  - [x] Automatic snapshot creation on project updates
  - [x] Version incrementing and author tracking
  - [x] Snapshot locking mechanism for published versions
  - [x] Draft/publish workflow using snapshots

- [x] **API Integration** ✅ **COMPLETE**

  - [x] Snapshot CRUD endpoints with proper authentication
  - [x] Permission-based access control
  - [x] Secure snapshot fetching with author expansion
  - [x] Integration with project management system

- [x] **Publishing Workflow** ✅ **COMPLETE**
  - [x] Publish draft functionality using snapshots
  - [x] Automatic snapshot locking on publish
  - [x] Project visibility management via snapshots
  - [x] UI integration with "Publish Draft" button

**DEFERRED TO FUTURE TASKS:**

- [ ] Snapshot history browser UI (complex UI feature)
- [ ] Visual diff and comparison tools (advanced feature)
- [ ] Snapshot restoration functionality (complex workflow)
- [ ] Snapshot optimization and compression (performance feature)

## Implementation Summary

The snapshot versioning system is **functionally complete** for the core use case of project editing and publishing. The system successfully implements:

### Database Architecture

- Complete snapshots table with proper relationships
- Version tracking with automatic incrementing
- Author tracking and metadata storage
- Snapshot locking mechanism for published versions
- Comprehensive RLS policies for security

### Core Workflow

- **Draft System**: Projects use `new_snapshot_id` for working drafts
- **Publishing**: Projects use `public_snapshot_id` for published versions
- **Version Control**: Each snapshot has a version number and author
- **Security**: Locked snapshots cannot be edited after publishing

### API Integration

- Secure snapshot CRUD operations
- Permission-based access control
- Author information expansion
- Integration with project management workflow

### Files Implementing Snapshot System

- `docs/supabase_db_setup.sql` - Database schema and RLS policies
- `src/lib/supabase/helpers.ts` - Snapshot helper functions
- `src/app/api/projects/[id]/snapshots/[snapshotId]/route.ts` - Snapshot API endpoints
- `src/app/projects/[id]/actions.ts` - Publish draft server action
- `src/components/projects/ProjectDetails.tsx` - UI integration
- `src/types/supabase.ts` - TypeScript type definitions

**READY FOR NEXT TASK:** The core snapshot versioning system is complete and working. Advanced features like visual diff, restoration, and history browser can be implemented as separate tasks when needed.
