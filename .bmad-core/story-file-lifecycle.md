# BMAD Story File Lifecycle - Automatic Saving Process

## 📋 Overview

The BMAD Epic Orchestrator automatically manages story files throughout the entire SM → Dev → QA cycle, ensuring complete traceability and iterative learning context.

## 🔄 Complete Lifecycle

### Phase 1: SM Agent - Story Creation
**When:** SM agent completes story drafting
**File Operation:** `CREATE` new file
**Location:** `docs/stories/story-epic-{epic}-{number}.md`
**Content:** Initial story with user story, acceptance criteria, dev notes, tasks

### Phase 2: Dev Agent - Implementation  
**When:** Dev agent completes implementation
**File Operation:** Story file updated with Dev Agent Record
**Content Added:** Implementation details, files modified, completion notes

### Phase 3: QA Agent - Quality Review
**When:** QA agent completes review
**File Operation:** Story file updated with QA Results
**Content Added:** Quality gate, assessment, issues, recommendations

### Phase 4: Learning Extraction
**When:** Story cycle completes, before next story
**File Operation:** Story file updated with learnings
**Content Added:** Architecture decisions, patterns for next story

## 📁 File Management Strategy

### Orchestrator-Managed Approach
- **Responsibility:** Orchestrator handles all file I/O operations
- **Agent Responsibility:** Agents provide content, orchestrator saves it
- **Benefits:** Consistent format, error handling, atomic operations

### File Structure Generated
```markdown
# Story {epic}.{number}: {Title}

## Status
{COMPLETED/IN_PROGRESS} - {QA Gate}

## Story  
{User story from SM agent}

## Acceptance Criteria
- [x] {Validated criteria from QA}

## Build On Previous Work
{Previous story learnings}

## Dev Implementation Notes
{Technical implementation details}

## Tasks / Subtasks
- [x] {Completed tasks}

## Testing Requirements
{Testing approach and coverage}

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| {date} | 1.0 | Story created | SM Agent |
| {date} | 1.1 | Implementation completed | Dev Agent |
| {date} | 1.2 | QA review completed | QA Agent |

## Dev Agent Record
### Agent Model Used
{Agent details and capabilities}

### Debug Log References  
{Implementation logs and traces}

### Completion Notes List
{Detailed implementation summary}

### File List
{Files created/modified during implementation}

## QA Results
### Quality Gate: {PASS/CONCERNS/FAIL}

### Acceptance Criteria Review
{Detailed validation results}

### Code Quality Score: {Rating}/10

### Issues Found:
{List of issues and concerns}

### Test Coverage: {Percentage}%

### Recommendations:
{Future improvements}

## Architecture Decisions
{Technical decisions made during implementation}

## Learnings for Next Story
{Patterns, components, and context for next story}

**Story Status: ✅ APPROVED FOR DEPLOYMENT**
```

## 🤖 Implementation Details

### Automatic Saving Process
```typescript
// In orchestration cycle
for (let storyNumber = 1; storyNumber <= storyCount; storyNumber++) {
  // SM Agent creates story
  const smResult = await executeSMAgent();
  
  // Dev Agent implements story
  const devResult = await executeDevAgent();
  
  // QA Agent reviews story
  const qaResult = await executeQAAgent();
  
  // 📝 AUTOMATIC SAVE: Complete story file
  await saveCompleteStoryFile(epic, storyNumber, {
    smResult, devResult, qaResult, previousLearnings
  });
  console.log(`📁 Saved: docs/stories/story-epic-${epic.id}-${storyNumber}.md`);
  
  // Extract learnings for next story
  previousLearnings = extractLearnings(devResult, qaResult);
}
```

### Error Handling
- **Atomic Operations:** File saves are atomic (success or failure)
- **Directory Creation:** Automatically creates `docs/stories/` if missing
- **Error Recovery:** Failed saves don't break orchestration
- **Backup Strategy:** Checkpoint system preserves state

### File Naming Convention
- **Pattern:** `story-epic-{epic}-{number}.md`
- **Examples:**
  - `story-epic-1-1.md` (Epic 1, Story 1)
  - `story-epic-1-2.md` (Epic 1, Story 2)
  - `story-epic-2-1.md` (Epic 2, Story 1)

## ✅ Benefits

### Complete Automation
- **Zero Manual File Management:** Everything saved automatically
- **Consistent Format:** All stories follow BMAD template
- **Complete Audit Trail:** Full SM → Dev → QA journey documented

### Iterative Learning
- **Context Preservation:** Previous story learnings captured
- **Pattern Recognition:** Reusable components identified
- **Architecture Consistency:** Decisions carried forward

### Quality Assurance
- **Traceability:** Complete record of all agent activities
- **Validation:** QA gates and assessments documented
- **Compliance:** Follows BMAD methodology standards

## 🚀 Ready for Production

The story file lifecycle is now fully automated in the BMAD Epic Orchestrator:

**Command:** `/bmad-execute-epic 1`
**Result:** Complete epic with all story files automatically saved

**File Output:**
- `docs/stories/story-epic-1-1.md`
- `docs/stories/story-epic-1-2.md`  
- `docs/stories/story-epic-1-3.md`
- `docs/stories/story-epic-1-4.md`

Each file contains the complete SM → Dev → QA journey with learnings for the next story! 📝✨