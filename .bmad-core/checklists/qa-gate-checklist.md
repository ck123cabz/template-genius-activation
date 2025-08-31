<!-- Powered by BMAD™ Core -->

# QA Agent Gate Checklist - Testing & Quality Validation

## Instructions for QA Agent

This checklist validates testing completeness and implementation quality before story completion. Complete each section and mark as [x] Done, [ ] Not Done, or [N/A] Not Applicable.

[[LLM: INITIALIZATION INSTRUCTIONS - QA AGENT GATE VALIDATION

This checklist ensures QA Agent deliverables meet BMAD quality standards for:

1. Comprehensive testing validation
2. Quality gate decision creation
3. Revenue Intelligence verification
4. Documentation and evidence gathering
5. Final story approval or issue identification

EXECUTION APPROACH:

1. Use existing qa-gate-tmpl.yaml template for gate decisions
2. Leverage Playwright MCP for comprehensive browser testing
3. Validate Revenue Intelligence workflows end-to-end
4. Create detailed evidence documentation
5. Generate final gate decision YAML file

The goal is thorough validation that ensures production readiness.]]

## 1. ACCEPTANCE CRITERIA VALIDATION

[[LLM: Every AC must be tested and verified working]]

### Core Functionality Testing
- [ ] **AC Coverage:** All acceptance criteria tested individually and documented
- [ ] **User Story Flow:** End-to-end user workflows tested with real scenarios
- [ ] **Business Logic:** Server actions tested with valid and invalid inputs
- [ ] **Data Persistence:** Database operations verified with actual data flow
- [ ] **Error Scenarios:** Error handling tested with boundary conditions

### Integration Verification Testing
- [ ] **IV1 - Backward Compatibility:** Existing functionality unaffected by changes
- [ ] **IV2 - Workflow Preservation:** Admin workflows maintain existing efficiency
- [ ] **IV3 - Performance & Styling:** Page performance and UI consistency maintained
- [ ] **Cross-Browser:** Functionality works across Chrome, Firefox, Safari
- [ ] **Responsive Design:** Mobile and desktop layouts function correctly

## 2. BROWSER & UI TESTING WITH PLAYWRIGHT MCP

[[LLM: Use Playwright MCP tools for comprehensive browser testing]]

### Automated Browser Testing
- [ ] **Navigation Testing:** `mcp__playwright__browser_navigate` to all relevant pages
- [ ] **Element Interaction:** `mcp__playwright__browser_click` on all interactive elements
- [ ] **Form Submission:** `mcp__playwright__browser_type` and form validation testing
- [ ] **Screenshot Verification:** `mcp__playwright__browser_take_screenshot` for visual regression
- [ ] **Console Monitoring:** `mcp__playwright__browser_console_messages` for error detection

### UI Component Validation
- [ ] **Component Rendering:** All new/modified components display correctly
- [ ] **Interactive Elements:** Buttons, forms, modals, and navigation function properly
- [ ] **Loading States:** Proper loading indicators during async operations
- [ ] **Error States:** User-friendly error messages displayed appropriately
- [ ] **Accessibility:** Keyboard navigation and screen reader compatibility

## 3. REVENUE INTELLIGENCE ENGINE VALIDATION

[[LLM: Core business functionality must be thoroughly validated]]

### Learning Capture Workflow Testing
- [ ] **Hypothesis Entry:** Admin can create and modify hypotheses before content changes
- [ ] **Content Versioning:** Content changes properly tracked with hypothesis metadata
- [ ] **Version History:** Content history displays correctly with learning context
- [ ] **Outcome Recording:** Payment events correctly correlate with content versions
- [ ] **Pattern Recognition:** Data structures support future intelligence analysis

### Client Journey Flow Testing
- [ ] **4-Page Navigation:** Client journey pages (activation → agreement → confirmation → processing)
- [ ] **Content Isolation:** Page-specific content displays correctly per client
- [ ] **Payment Integration:** Stripe payment flow completes successfully with metadata
- [ ] **Admin Visibility:** Admin can view client progress and learning data
- [ ] **Performance:** Journey pages load within 2 seconds (NFR2 compliance)

## 4. TECHNICAL INTEGRATION TESTING

[[LLM: All system integrations must be validated]]

### Database & API Testing
- [ ] **Server Actions:** All new server actions tested with valid/invalid inputs
- [ ] **Database Schema:** New tables/columns function correctly with existing data
- [ ] **Data Validation:** Zod schemas properly validate all inputs
- [ ] **RLS Policies:** Supabase Row Level Security enforced correctly
- [ ] **Mock Data:** Development mock system works without database dependencies

### External Service Integration
- [ ] **Stripe Integration:** Payment processing tested in test mode
- [ ] **Webhook Handling:** Stripe webhooks properly trigger outcome updates
- [ ] **Environment Variables:** All required configs present and functional
- [ ] **Error Recovery:** Graceful handling of external service failures
- [ ] **Security:** Input validation and authentication properly implemented

## 5. QUALITY GATE DECISION CREATION

[[LLM: Create comprehensive gate decision using existing template patterns]]

### Gate Decision File Creation
- [ ] **YAML File Created:** `docs/qa/gates/[epic].[story]-[slug].yml` following template
- [ ] **Gate Status Determined:** PASS/CONCERNS/FAIL based on testing results
- [ ] **Issues Documented:** All findings categorized by severity (low/medium/high)
- [ ] **Evidence Gathered:** Test results, screenshots, and verification data
- [ ] **Recommendations Provided:** Immediate fixes and future improvements identified

### Quality Metrics Assessment
- [ ] **Security Validation:** No security vulnerabilities or data exposure risks
- [ ] **Performance Validation:** Page load times and interaction performance acceptable
- [ ] **Reliability Validation:** Error handling and failure recovery adequate
- [ ] **Maintainability Validation:** Code quality and documentation standards met
- [ ] **NFR Compliance:** All non-functional requirements satisfied

## 6. EVIDENCE DOCUMENTATION & VERIFICATION

[[LLM: Comprehensive evidence ensures gate decision validity]]

### Test Evidence Collection
- [ ] **Test Scenarios:** All test cases documented with input/output examples
- [ ] **Browser Screenshots:** Visual evidence of functionality across devices
- [ ] **Console Logs:** No critical errors or warnings in browser console
- [ ] **Network Requests:** API calls function correctly with proper responses
- [ ] **Database Queries:** Data operations execute successfully with expected results

### Regression Testing
- [ ] **Existing Features:** No breaking changes to previously working functionality
- [ ] **Integration Points:** All external service connections still functional
- [ ] **User Workflows:** Complete admin and client workflows tested end-to-end
- [ ] **Data Migration:** Existing data compatibility maintained
- [ ] **Performance Impact:** No significant degradation in page load times

## 7. FINAL STORY VALIDATION & HANDOFF

[[LLM: Complete validation before story closure]]

### Story Completion Verification
- [ ] **All Tasks Complete:** Every checkbox task in story file marked complete
- [ ] **Documentation Updated:** Story wrap-up section completed with implementation notes
- [ ] **Serena Memory Updates:** Relevant learnings and patterns documented in memory system
- [ ] **Architecture Alignment:** Implementation matches architectural decisions
- [ ] **Code Quality:** All linting, TypeScript, and build checks pass

### Production Readiness Assessment
- [ ] **Deployment Ready:** Code can be safely deployed to production
- [ ] **Rollback Plan:** Clear rollback strategy documented if issues arise
- [ ] **Monitoring Setup:** Appropriate logging and error tracking in place
- [ ] **User Documentation:** Any user-facing changes documented appropriately
- [ ] **Technical Debt:** Any shortcuts or technical debt clearly identified

## FINAL QA AGENT VALIDATION

[[LLM: QA GATE SUMMARY

After completing the checklist:

1. Generate final gate decision (PASS/CONCERNS/FAIL)
2. Document all critical findings and evidence
3. Confirm Revenue Intelligence integration works correctly
4. List any follow-up work or monitoring needed
5. Validate story completion and production readiness

Create the gate decision YAML file using the template structure.]]

**Final Gate Decision:**
- [ ] **PASS:** All requirements met, production ready
- [ ] **CONCERNS:** Minor issues identified but acceptable for release (document concerns)
- [ ] **FAIL:** Critical issues require fixing before release (specify what)

**Quality Verification:**
- [ ] All acceptance criteria tested and verified working
- [ ] Revenue Intelligence workflows validated end-to-end
- [ ] Browser testing completed successfully across devices
- [ ] Integration testing confirms all system connections functional

**QA Agent Certification:**
- [ ] I, the QA Agent, have completed comprehensive testing of this implementation
- [ ] Gate decision YAML file created with complete evidence and recommendations
- [ ] Story meets BMAD quality standards for production deployment
- [ ] All critical business functionality verified working correctly

**Gate Decision File:** `docs/qa/gates/[epic].[story]-[slug].yml` created with:
- Gate status and reasoning
- Evidence of testing performed
- Issues identified (if any) with severity levels
- Recommendations for immediate and future improvements