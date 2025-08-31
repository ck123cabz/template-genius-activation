<!-- Powered by BMAD™ Core -->

# SM Agent Gate Checklist - Story Planning & Documentation

## Instructions for SM (Scrum Master) Agent

This checklist validates story creation and documentation quality before handoff to Dev Agent. Complete each section and mark as [x] Done, [ ] Not Done, or [N/A] Not Applicable.

[[LLM: INITIALIZATION INSTRUCTIONS - SM AGENT GATE VALIDATION

This checklist ensures SM Agent deliverables meet BMAD quality standards for:

1. Story structure and clarity
2. Documentation completeness
3. File creation standards 
4. Revenue Intelligence integration
5. Learning capture requirements

EXECUTION APPROACH:

1. Validate against existing story-draft-checklist.md patterns
2. Ensure Revenue Intelligence Engine requirements are captured
3. Verify file structure follows project conventions
4. Check integration with Serena memory system
5. Confirm learning capture workflows are documented

The goal is deliverable quality that enables smooth Dev Agent execution.]]

## 1. STORY STRUCTURE & CONTENT VALIDATION

[[LLM: Stories must be complete and implementable. Verify each element]]

### Core Story Elements
- [ ] **Story Goal:** Clear user story format with business value stated
- [ ] **Acceptance Criteria:** Specific, testable criteria defined (minimum 3)
- [ ] **Integration Verifications:** IV1-IV3 patterns for backward compatibility
- [ ] **Technical Context:** Key files, components, and patterns identified
- [ ] **Revenue Intelligence Integration:** Learning capture requirements specified

### Documentation Quality
- [ ] **Self-Contained:** Story readable without extensive external references
- [ ] **References:** Specific links to architecture docs with section anchors
- [ ] **Dependencies:** Clear prerequisite stories and their completion status
- [ ] **Edge Cases:** Error scenarios and boundary conditions addressed
- [ ] **Testing Approach:** Manual and automated testing guidance provided

## 2. FILE CREATION & STRUCTURE VERIFICATION

[[LLM: Proper file structure enables discoverability and maintainability]]

### File Creation Standards
- [ ] **Story File:** Created in `docs/stories/story-epic-X-Y.md` with consistent naming
- [ ] **File Headers:** Include epic/story numbers and clear titles
- [ ] **Template Adherence:** Follows `.bmad-core/templates/story-tmpl.yaml` structure
- [ ] **Cross-References:** Proper markdown links to related docs and architecture
- [ ] **Version Control:** Story file committed with descriptive commit message

### Content Organization
- [ ] **Task Lists:** Clear checkbox tasks for Dev Agent execution
- [ ] **Data Models:** References to schema changes with specific sections
- [ ] **Server Actions:** Required API endpoints and business logic identified
- [ ] **Component Updates:** Specific UI components and enhancement patterns
- [ ] **Integration Points:** Stripe, Supabase, and external service connections

## 3. REVENUE INTELLIGENCE ENGINE ALIGNMENT

[[LLM: Every story must support the core business objective of learning capture]]

### Learning Capture Integration
- [ ] **Hypothesis Tracking:** Story enables hypothesis before/outcome after pattern
- [ ] **Journey Context:** Connection to 4-page client journey flow specified
- [ ] **Pattern Recognition:** How this story contributes to conversion intelligence
- [ ] **Data Collection:** Specific learning fields and data capture requirements
- [ ] **Outcome Correlation:** Link between implementation and revenue metrics

### Business Value Validation
- [ ] **Conversion Impact:** Clear connection to client payment likelihood
- [ ] **Learning Velocity:** How this accelerates pattern recognition
- [ ] **Admin Workflow:** Preservation of existing admin productivity
- [ ] **Client Experience:** Enhancement to 4-page journey effectiveness
- [ ] **Intelligence Compound:** How learnings build on previous stories

## 4. TECHNICAL INTEGRATION REQUIREMENTS

[[LLM: Stories must integrate with existing architecture and patterns]]

### Architecture Alignment
- [ ] **Tech Stack Compliance:** Uses approved Next.js 15, Supabase, Shadcn/ui patterns
- [ ] **Component Reuse:** Leverages existing 40+ Shadcn/ui components
- [ ] **Server Actions:** Follows established server action patterns
- [ ] **Database Schema:** Extensions use established naming and structure conventions
- [ ] **Environment Variables:** New configs follow security and documentation standards

### Quality Gates Preparation
- [ ] **Testing Strategy:** Unit, integration, and Playwright MCP testing approaches
- [ ] **Performance Criteria:** Page load and interaction performance expectations
- [ ] **Security Requirements:** Input validation, authentication, and data protection
- [ ] **Error Handling:** Graceful failure and user feedback patterns
- [ ] **Accessibility:** ARIA compliance and keyboard navigation requirements

## 5. HANDOFF PREPARATION

[[LLM: Dev Agent needs complete context to execute efficiently]]

### Implementation Guidance
- [ ] **Mock Data:** Test data requirements and existing mock integration
- [ ] **Development Workflow:** Docker compose, testing, and build process integration
- [ ] **Git Strategy:** Branch naming and commit message conventions
- [ ] **Code Patterns:** Specific examples from existing codebase to follow
- [ ] **Quality Checks:** Linting, TypeScript, and build validation requirements

### Documentation Updates
- [ ] **Serena Memory:** Required memory updates for pattern persistence
- [ ] **Architecture Docs:** Any updates needed to architecture documentation
- [ ] **API Documentation:** Server action documentation requirements
- [ ] **User Guide:** Any admin interface documentation needs
- [ ] **Deployment Notes:** Environment configuration or deployment changes

## FINAL SM AGENT VALIDATION

[[LLM: SM GATE SUMMARY

After completing the checklist:

1. Summarize story readiness for Dev Agent execution
2. List any blockers or missing information
3. Confirm integration with Revenue Intelligence objectives
4. Note any risks or technical debt considerations
5. Validate handoff completeness

This gate ensures Dev Agent receives implementable, complete requirements.]]

**Story Readiness Assessment:**
- [ ] **READY:** Story provides complete implementation guidance for Dev Agent
- [ ] **NEEDS REVISION:** Missing critical information (specify what)
- [ ] **BLOCKED:** Requires external input or decisions (specify from whom)

**Integration Verification:**
- [ ] Revenue Intelligence Engine alignment confirmed
- [ ] Learning capture workflow specified
- [ ] Existing system compatibility verified
- [ ] Quality gate criteria established

**SM Agent Certification:**
- [ ] I, the SM Agent, confirm this story meets BMAD quality standards for Dev Agent handoff
- [ ] All file creation and documentation standards have been met
- [ ] Revenue Intelligence integration requirements are clear and implementable