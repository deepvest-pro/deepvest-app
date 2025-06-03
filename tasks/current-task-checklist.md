# Current Task: Project Deletion Implementation

## Project Deletion - Implementation Checklist

### Core Requirements

- [x] Add delete button to project page
  - [x] Import trash icon from Radix UI Icons
  - [x] Position button after "Edit Project" button
  - [x] Show only to project owners
  - [x] Style consistently with existing buttons
- [x] Implement confirmation dialog
  - [x] Use Radix UI Themes AlertDialog component
  - [x] Show clear warning about permanent deletion
  - [x] Include project name in confirmation message
  - [x] Provide Cancel and Delete options
- [x] Create deletion functionality
  - [x] Implement server action for project deletion
  - [x] Add API endpoint for project deletion (already exists)
  - [x] Ensure proper cascade deletion of related data
  - [x] Handle permissions (only owners can delete)
  - [x] Show toast notifications for success/error

### Technical Implementation Steps

#### 1. UI Components

- [x] Update ProjectDetails component
  - [x] Import TrashIcon from @radix-ui/react-icons
  - [x] Import AlertDialog from @radix-ui/themes
  - [x] Add delete button with trash icon
  - [x] Implement confirmation dialog
  - [x] Add proper styling and positioning

#### 2. Server Action

- [x] Create deleteProject server action
  - [x] Add to `/src/app/projects/[id]/actions.ts`
  - [x] Implement authentication checks
  - [x] Verify owner permissions
  - [x] Call existing DELETE API endpoint
  - [x] Handle success/error responses
  - [x] Redirect to projects list after successful deletion

#### 3. Database Cascade Deletion

- [x] Review existing DELETE API endpoint
  - [x] Verify cascade deletion is working properly
  - [x] Ensure snapshots are deleted with project
  - [x] Ensure project_permissions are deleted
  - [x] Test that no orphaned data remains

#### 4. Error Handling & UX

- [x] Add proper error handling
  - [x] Handle network errors
  - [x] Handle permission errors
  - [x] Handle database errors
  - [x] Show appropriate toast messages
- [x] Implement loading states
  - [x] Disable buttons during deletion
  - [x] Show loading indicator
  - [x] Prevent multiple deletion attempts

#### 5. Testing & Validation

- [x] Test deletion permissions
  - [x] Only owners can see delete button
  - [x] Only owners can delete projects
  - [x] Non-owners get proper error messages
- [x] Test cascade deletion
  - [x] Verify snapshots are deleted
  - [x] Verify permissions are deleted
  - [x] Check no orphaned data remains
- [x] Test user experience
  - [x] Confirmation dialog works properly
  - [x] Toast notifications appear
  - [x] Redirect works after deletion
  - [x] Loading states work correctly

### Database Schema Review

Current cascade deletion setup:

- `snapshots.project_id` → `projects.id` ON DELETE CASCADE
- `project_permissions.project_id` → `projects.id` ON DELETE CASCADE
- `projects.public_snapshot_id` → `snapshots.id` ON DELETE SET NULL
- `projects.new_snapshot_id` → `snapshots.id` ON DELETE SET NULL

### Security Considerations

- [x] Verify only project owners can delete
- [x] Ensure proper authentication checks
- [x] Validate project exists before deletion
- [x] Check for any business logic constraints
- [x] Ensure audit trail if needed

### Current Status

- ✅ **TASK COMPLETED SUCCESSFULLY!**
- ✅ Delete button implemented with trash icon
- ✅ Confirmation dialog working properly
- ✅ Server action created and tested
- ✅ **FIXED: Server action authentication issue resolved**
  - ✅ Changed from fetch API call to direct Supabase call
  - ✅ Proper cookie/session handling in server action
  - ✅ Authentication and permissions working correctly
- ✅ **FIXED: Post-deletion page error resolved**
  - ✅ Added immediate redirect with router.refresh()
  - ✅ Removed revalidation of deleted project path
  - ✅ No more RPC errors after successful deletion
- ✅ Proper error handling and UX implemented
- 🎯 **READY FOR PRODUCTION USE - ALL ISSUES RESOLVED**

### Files to Modify

- `/src/components/projects/ProjectDetails.tsx` - Add delete button and dialog
- `/src/app/projects/[id]/actions.ts` - Add deleteProject server action
- Review `/src/app/api/projects/[id]/route.ts` - Verify DELETE endpoint

### Notes

- ~~Use existing DELETE API endpoint at `/api/projects/[id]`~~ **UPDATED**: Direct Supabase call in server action
- Leverage Radix UI components for consistent design
- Follow established patterns for server actions and error handling
- Ensure proper cascade deletion to avoid orphaned data
- Maintain security by restricting deletion to project owners only

### Issue Resolution

**Problem 1**: Server action was making fetch() call to API endpoint without proper authentication cookies.

**Solution 1**: Changed server action to use direct Supabase client call instead of fetch() to API endpoint. This ensures proper session/cookie handling in the server action context.

**Problem 2**: After successful deletion, page showed RPC errors because it tried to reload data for a non-existent project.

**Solution 2 (FINAL)**:

- **Reverted to client-side redirect approach due to Next.js redirect() exception handling issues**
- Server action now returns `{ success: true }` on successful deletion
- Component handles successful deletion with client-side redirect using `window.location.href = '/projects'`
- Removed server-side redirect and unused import
- This ensures proper navigation without redirect exception handling complications

**Files Modified**:

- `/src/app/projects/[id]/actions.ts` - Updated deleteProject function to return success status instead of redirect
- `/src/components/projects/ProjectDetails.tsx` - Added client-side redirect on successful deletion
- `/src/app/projects/[id]/actions.ts` - Removed `redirect()` import and call, simplified error handling
