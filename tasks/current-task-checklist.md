# Current Task Checklist

## 🎯 ACTIVE ISSUES

### Known Issues to Address

- [ ] **Snapshot Creation Bug**: When creating a new snapshot from the edit page, the new snapshot doesn't copy `contents` and `team_members` from the previous snapshot.
  - **Location**: `src/app/api/projects/[id]/snapshots/route.ts`
  - **Issue**: Fields `contents` and `team_members` are empty arrays in new snapshots
  - **Expected**: Copy these fields from the previous snapshot (either public_snapshot or latest snapshot)

## 🔧 TECHNICAL TODO

### Project Scoring System

- [ ] **Real LLM Integration**: Replace mock response with actual AI processing
  - Current: Mock data generation for testing
  - Needed: Integration with AI service (Gemini/OpenAI) for real analysis

### Future Enhancements

- [ ] **Scoring Display Components**: Create UI components to display scoring results on project pages
- [ ] **Leaderboard**: Public ranking system based on project scores
- [ ] **Scoring History**: Track and display scoring changes over time

## 📝 NOTES

### Current State

- ✅ Project scoring API endpoint is functional with mock data
- ✅ Scoring button appears conditionally for project owners
- ✅ Database schema and RLS policies are complete
- ✅ UI components for scoring display (brief and details) are implemented
- ✅ Markdown rendering for scoring content is working

### Next Priority

Focus on fixing the snapshot creation bug as it affects core functionality.

---

_Last updated: Current session_
