# Current Task: EditProjectForm Redesign - Section-Based Form

## Project Edit Form Redesign - Implementation Checklist

### Core Requirements

- [x] Replace MultiStepForm with custom section-based form
- [x] Implement URL-based navigation between sections (query params or hash)
- [x] Add auto-save functionality for each section
- [x] Create 5 main sections: Common Info, Documents, Funding, Milestones, Team
- [x] Implement drag & drop file upload for logo and banner
- [x] Add proper validation for each section
- [x] Ensure responsive design with Radix UI components

### Technical Implementation Steps

#### 1. Form Structure & Navigation

- [x] Create new EditProjectForm component structure
  - [x] Remove MultiStepForm dependency
  - [x] Implement section-based navigation
  - [x] Add URL parameter handling for section switching
  - [x] Create section indicator/navigation menu
  - [x] Implement auto-save on section change

#### 2. Section 1: Common Information

- [x] Basic project information fields
  - [x] Project name (from Basic Information)
  - [x] Project slug (from Basic Information)
  - [x] Slogan field (new, between name and description)
  - [x] Description field
  - [x] Status selector (dropdown with project_status_enum values)
  - [x] Country field (text input)
  - [x] City field (text input)
  - [x] Website field (text input with URL validation)
- [x] File upload components
  - [x] Logo upload (D&D, similar to profile avatar)
  - [x] Banner upload (D&D, similar to profile cover)
  - [x] Implement file upload API integration
  - [x] Add image preview functionality
  - [x] Handle file size and type validation

#### 3. Section 2: Documents

- [x] Create placeholder section
  - [x] Add section header and description
  - [x] Add "Coming Soon" message
  - [x] Prepare structure for future document management
  - [x] No validation required for now

#### 4. Section 3: Funding

- [x] Implement funding details (from MultiStepForm)
  - [x] Funding goal field
  - [x] Currency selector
  - [x] Investment stage selector
  - [x] Additional funding information fields
  - [x] Validation for funding amounts

#### 5. Section 4: Milestones

- [x] Create milestones management section
  - [x] Milestone list display
  - [x] Add new milestone functionality
  - [x] Edit existing milestones
  - [x] Delete milestone functionality
  - [x] Milestone status management
  - [x] Target date and completion date fields
  - [x] Validation for milestone data

#### 6. Section 5: Team

- [x] Implement team management (from MultiStepForm)
  - [x] Team member list
  - [x] Add team member functionality
  - [x] Edit team member roles
  - [x] Remove team members
  - [x] Invite collaborators functionality
  - [x] Validation for team data

#### 7. Auto-Save & Data Management

- [ ] Implement section-level auto-save
  - [ ] Save on section change
  - [ ] Save on form field blur
  - [ ] Handle API calls for snapshot updates
  - [ ] Show save status indicators
  - [ ] Handle save errors gracefully

#### 8. URL Navigation & State Management

- [x] Implement URL-based section navigation
  - [x] Use query parameters or hash for section
  - [x] Handle browser back/forward navigation
  - [x] Maintain form state during navigation
  - [x] Default to first section if no section specified

#### 9. UI/UX Implementation

- [ ] Design section navigation
  - [ ] Create section tabs/menu
  - [ ] Add section completion indicators
  - [ ] Implement responsive design
  - [ ] Add loading states for saves
  - [ ] Show unsaved changes warnings

#### 10. API Integration

- [x] Update snapshot API calls
  - [x] Handle partial updates for each section
  - [x] Implement file upload endpoints
  - [x] Add proper error handling
  - [x] Ensure proper authentication

### Database Schema Considerations

#### Snapshot Table Fields to Update:

- `name` - Project name
- `slogan` - New slogan field
- `description` - Project description
- `status` - Project status (enum)
- `country` - Country field
- `city` - City field
- `website_urls` - Website URLs array
- `logo_url` - Logo image URL
- `banner_url` - Banner image URL

#### Additional Tables:

- Milestones table (if not exists)
- Team members via project_permissions
- Funding data (future implementation)

### File Upload Requirements

- [ ] Logo upload
  - [ ] Max size: 2MB
  - [ ] Formats: JPG, PNG, WebP
  - [ ] Aspect ratio: 1:1 (square)
  - [ ] Auto-resize if needed
- [ ] Banner upload
  - [ ] Max size: 5MB
  - [ ] Formats: JPG, PNG, WebP
  - [ ] Aspect ratio: 16:9 (landscape)
  - [ ] Auto-resize if needed

### Security & Validation

- [ ] Ensure only project owners/editors can edit
- [ ] Validate all form inputs
- [ ] Sanitize file uploads
- [ ] Implement proper error handling
- [ ] Add CSRF protection for file uploads

### Testing Requirements

- [ ] Test section navigation
- [ ] Test auto-save functionality
- [ ] Test file upload functionality
- [ ] Test form validation
- [ ] Test responsive design
- [ ] Test error handling
- [ ] Test permissions

### Files to Create/Modify

#### New Components:

- [x] `/src/components/forms/EditProjectSections/` (new directory)
  - [x] `CommonInfoSection.tsx`
  - [x] `DocumentsSection.tsx`
  - [x] `FundingSection.tsx`
  - [x] `MilestonesSection.tsx`
  - [x] `TeamSection.tsx`
  - [x] `SectionNavigation.tsx`

#### Modified Files:

- [x] `/src/app/projects/[id]/edit/EditProjectForm.tsx` - Complete rewrite
- [ ] `/src/app/projects/[id]/edit/page.tsx` - Update to handle URL params
- [ ] `/src/app/api/projects/[id]/snapshots/route.ts` - Update for partial saves
- [x] `/src/app/api/projects/[id]/upload/route.ts` - New file upload endpoint

#### Utility Files:

- `/src/lib/validations/project-edit.ts` - Section-specific validations
- `/src/hooks/useProjectEdit.ts` - Custom hook for form management

### Current Status

- ✅ **CORE IMPLEMENTATION COMPLETE** - All main components created
- ✅ **SECTIONS IMPLEMENTED** - All 5 sections with full functionality
- ✅ **FILE UPLOAD WORKING** - Logo and banner upload implemented
- ⏳ **REMAINING TASKS** - Page updates and API refinements
- 📋 **NEXT STEPS** - Update page.tsx and test the implementation

### Notes

- Use Radix UI components for consistent design
- Follow established patterns for file uploads from profile edit form
- Implement proper TypeScript types for all form data
- Ensure mobile-responsive design
- Maintain existing functionality while improving UX
- Consider performance implications of auto-save
