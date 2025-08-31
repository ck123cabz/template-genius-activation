# mandatory-checkpoint-system

**Orchestrator task**: Mandatory compliance verification system to prevent agent specification violations and ensure process integrity.

## Purpose
Critical quality control system that BLOCKS workflow progression until agent compliance is verified. Prevents the "checkbox unchecked but story marked complete" failure that occurred in Story 2.3.

## System Architecture

### Checkpoint Locations (MANDATORY HALT POINTS)
```yaml
CHECKPOINT_A1: "Post-SM Agent Verification"
  location: "After SM agent story enhancement"  
  requirement: "100% SM specification compliance or HALT"
  
CHECKPOINT_B1: "Post-Dev Agent Verification"  
  location: "After Dev agent implementation"
  requirement: "100% Dev specification compliance or HALT"
  
CHECKPOINT_C1: "Post-QA Agent Verification"
  location: "After QA agent review"  
  requirement: "100% QA specification compliance or HALT"
```

### Enforcement Rules
```yaml
NO_BYPASS_ALLOWED: true
MAX_RETRIES_PER_CHECKPOINT: 2  
ESCALATION: "Human intervention required after 2 failures"
HALT_ON_ANY_FAILURE: true
DOCUMENTATION_MUST_MATCH_REALITY: true
```

## CHECKPOINT A1: Post-SM Agent Verification

### SM Agent Compliance Requirements
Based on `.bmad-core/agents/sm.md` and `.bmad-core/templates/story-tmpl.yaml`:

```yaml
REQUIRED_UPDATES:
  status_change:
    from: "DRAFT"
    to: "APPROVED" 
    validation: "Exact status text match required"
    
  story_section:  
    format: "As a [role], I want [action] so that [benefit]"
    completeness: "Must be complete, not placeholder text"
    validation: "Must contain actual business value statement"
    
  acceptance_criteria:
    format: "Numbered list format required"
    completeness: "All epic requirements translated to AC"
    validation: "Each AC must be testable and specific"
    
  tasks_subtasks:
    format: "Hierarchical task breakdown"
    completeness: "All tasks have clear subtasks"
    validation: "Each task references specific AC numbers"
    
  dev_notes:
    sections: ["Architecture Context", "Testing Requirements", "Previous Learnings"]
    completeness: "All sections populated with guidance"
    validation: "Must provide clear developer guidance"
    
  change_log:
    entry_required: "Story creation entry with timestamp"
    format: "| Date | Version | Description | Author |"
    validation: "Must document SM agent story enhancement"
```

### A1 Verification Process
```yaml
step_1_scan_story_file:
  action: "Read complete story file"
  extract: ["status", "story_section", "acceptance_criteria", "tasks_subtasks", "dev_notes", "change_log"]
  
step_2_validate_status:
  check: "status == 'APPROVED'"
  failure_action: "REJECT - SM must change status from DRAFT to APPROVED"
  
step_3_validate_completeness:
  story_section: "Must not contain 'TODO', 'TBD', or placeholder text"
  acceptance_criteria: "Must have 3+ numbered criteria"
  tasks_subtasks: "Must have hierarchical breakdown"
  dev_notes: "Must contain architecture and testing guidance"
  
step_4_template_compliance:
  validate_against: ".bmad-core/templates/story-tmpl.yaml"
  check_sections: ["all required sections present", "proper formatting", "no missing elements"]

A1_SUCCESS_CRITERIA:
  - status_changed_correctly: true
  - all_sections_complete: true  
  - template_compliant: true
  - no_placeholder_content: true
  - change_log_updated: true
```

## CHECKPOINT B1: Post-Dev Agent Verification 

### Dev Agent Compliance Requirements  
Based on `.bmad-core/agents/dev.md` lines 59-67:

```yaml
CRITICAL_REQUIREMENTS:
  task_checkbox_completion:
    rule: "Only if ALL pass, then update the task checkbox with [x]"
    validation: "ZERO unchecked [ ] boxes allowed if status is READY FOR REVIEW"
    failure_action: "HALT - Dev must complete ALL task checkboxes"
    
  status_change:
    from: "APPROVED"  
    to: "READY FOR REVIEW"
    validation: "Status change only after all tasks [x] completed"
    
  dev_agent_record:
    sections: ["Agent Model Used", "Debug Log References", "Completion Notes List", "File List"]
    completeness: "ALL subsections must be populated"
    validation: "Dev Agent Record section must be 100% complete"
    
  file_list:
    requirement: "All new/modified/deleted files documented"
    format: "Clear list of implementation files"
    validation: "File list must match actual implementation"
    
  change_log:
    entry_required: "Implementation completion entry"
    validation: "Must document dev agent completion with timestamp"
```

### B1 Verification Process (CRITICAL FOR STORY 2.3 FAILURE PREVENTION)
```yaml
step_1_checkbox_scan:
  action: "grep -n '- \[ \]' {story_file_path}"
  expected_result: "ZERO unchecked boxes found"
  failure_condition: "ANY unchecked boxes found"
  failure_message: "CRITICAL FAILURE - Dev Agent must complete ALL task checkboxes before proceeding"
  
step_2_status_validation:
  check: "status == 'READY FOR REVIEW'"
  prerequisite: "step_1_checkbox_scan == ZERO unchecked"
  failure_action: "REJECT - Status cannot be READY FOR REVIEW with unchecked tasks"
  
step_3_dev_record_validation:
  agent_model_used: "Must specify model name/version"
  debug_log_references: "Must document any debug logs or state 'None'"
  completion_notes: "Must document implementation approach and issues"
  file_list: "Must list all files created/modified/deleted"
  
step_4_implementation_consistency:
  file_existence_check: "Verify files in File List actually exist"
  code_quality_check: "No TypeScript/lint errors allowed"
  test_completion_check: "Tests must pass if specified"

B1_SUCCESS_CRITERIA:
  - zero_unchecked_checkboxes: true  # CRITICAL FOR STORY 2.3 PREVENTION
  - status_properly_updated: true
  - dev_record_100_percent_complete: true
  - file_list_accurate: true
  - implementation_quality_verified: true
  - change_log_updated: true
```

## CHECKPOINT C1: Post-QA Agent Verification

### QA Agent Compliance Requirements
Based on `.bmad-core/agents/qa.md` lines 60-63:

```yaml
REQUIRED_UPDATES:
  qa_results_section:
    sections: ["Acceptance Criteria Validation", "Integration Verification", "Quality Score", "Gate Decision", "Evidence"]
    completeness: "ALL subsections must be comprehensive"
    validation: "QA Results section must provide complete quality assessment"
    
  gate_decision:
    options: ["PASS", "CONCERNS", "FAIL", "WAIVED"]  
    requirement: "Clear final decision with rationale"
    validation: "Gate decision must match quality assessment"
    
  gate_file_creation:
    location: "docs/qa/gates/{epic}.{story}-{slug}.yml"
    requirement: "YAML gate file must be created"
    validation: "Gate file must exist and contain proper decision"
    
  evidence_documentation:
    requirement: "Screenshots, test results, or validation evidence"
    validation: "Evidence must support gate decision"
    
  change_log:
    entry_required: "QA completion entry with gate decision"
    validation: "Must document QA completion with timestamp and decision"
```

### C1 Verification Process
```yaml
step_1_qa_section_validation:
  qa_results_exists: "QA Results section must be present"
  comprehensive_review: "Must address all acceptance criteria individually"
  quality_score: "Must provide numerical score (1-10)"
  gate_decision: "Must provide clear PASS/CONCERNS/FAIL/WAIVED decision"
  
step_2_gate_file_validation:
  file_path: "docs/qa/gates/{epic}.{story}-{slug}.yml"
  file_exists: "Gate file must be created"
  yaml_valid: "Gate file must be valid YAML"
  decision_consistency: "Gate file decision must match QA Results section"
  
step_3_process_compliance_check:
  dev_compliance_validated: "QA must verify Dev Agent completed their responsibilities"
  checkbox_verification: "QA should have caught any unchecked boxes"  
  documentation_accuracy: "QA must verify story documentation matches implementation"
  
step_4_evidence_validation:
  evidence_provided: "Screenshots, logs, or test results must be documented"
  evidence_supports_decision: "Evidence must justify the gate decision"

C1_SUCCESS_CRITERIA:
  - qa_results_section_complete: true
  - gate_decision_clear: true
  - gate_file_created: true
  - evidence_documented: true
  - process_compliance_verified: true
  - change_log_updated: true
```

## Checkpoint Failure Handling

### Non-Compliance Response Protocol
```yaml
CHECKPOINT_FAILURE_ACTIONS:
  immediate_halt:
    orchestration_stopped: true
    agent_handback_initiated: true
    specific_remediation_provided: true
    
  handback_message_template: |
    MANDATORY CHECKPOINT FAILURE - ORCHESTRATION HALTED
    
    Agent: {agent_type}
    Checkpoint: {checkpoint_name}  
    Story: {story_file}
    
    COMPLIANCE FAILURES DETECTED:
    {specific_failures_list}
    
    REQUIRED ACTIONS TO PROCEED:
    {remediation_actions_list}
    
    SPECIFICATION REFERENCE:
    {agent_spec_reference}
    
    You must complete ALL required actions and confirm readiness before orchestration can continue.
    
  retry_process:
    1: "Spawn same agent with handback context and specific remediation list"
    2: "Wait for agent completion confirmation"
    3: "Re-run same checkpoint verification"  
    4: "If still non-compliant: increment retry count"
    5: "If retry_count >= 2: Escalate to human intervention"
```

### Escalation Protocol
```yaml
HUMAN_INTERVENTION_TRIGGERS:
  - agent_non_compliance_after_2_retries: true
  - specification_violation_patterns: true
  - workflow_integrity_compromised: true
  - documentation_accuracy_critical_failure: true

ESCALATION_ACTIONS:
  1: "Generate comprehensive failure report"
  2: "Document specific agent specification violations"  
  3: "Provide remediation recommendations"
  4: "Halt all orchestration until human review"
  5: "Update agent specifications if systematic failure detected"
```

## Implementation in Orchestration Workflow

### Updated Orchestrate-Epic Integration
```yaml
ENHANCED_ORCHESTRATION_WORKFLOW:
  A: spawn_sm_agent_for_story
  A1: execute_mandatory_checkpoint_A1  # NEW - MANDATORY HALT POINT
  A1_FAILURE: handback_to_sm_with_specific_failures_and_halt
  
  B: spawn_dev_agent_for_story  
  B1: execute_mandatory_checkpoint_B1  # NEW - PREVENTS STORY 2.3 FAILURE
  B1_FAILURE: handback_to_dev_with_checkbox_requirements_and_halt
  
  C: spawn_qa_agent_for_story
  C1: execute_mandatory_checkpoint_C1  # NEW - MANDATORY HALT POINT  
  C1_FAILURE: handback_to_qa_with_compliance_requirements_and_halt
  
  D: extract_learnings_only_after_all_checkpoints_passed
  
CRITICAL_RULES:
  - NO_PHASE_BYPASS: "Cannot skip any checkpoint"
  - NO_MANUAL_OVERRIDE: "Human cannot bypass checkpoint without fixing failures"
  - DOCUMENTATION_ACCURACY: "Story files must accurately reflect actual state"
  - AGENT_ACCOUNTABILITY: "Each agent responsible for their specification compliance"
```

## Monitoring and Audit Trail

### Checkpoint Execution Logging
```yaml
MANDATORY_LOGGING:
  checkpoint_execution_time: "Track time spent on verification"
  compliance_success_rate: "Track agent specification adherence"  
  failure_patterns: "Identify systematic agent issues"
  remediation_effectiveness: "Track handback success rates"
  
LOG_EVERY_CHECKPOINT:
  - checkpoint_name: "{A1|B1|C1}"
  - story_file: "{epic}-{story}"  
  - agent_type: "{sm|dev|qa}"
  - compliance_result: "{PASS|FAIL}"
  - failure_details: "{specific_violations}"
  - remediation_actions: "{required_fixes}"
  - retry_count: "{0|1|2}"
  - resolution_time: "{duration}"
```

### Success Metrics
```yaml
TARGET_METRICS:
  checkpoint_pass_rate: ">95% on first attempt"
  agent_compliance_rate: "100% after remediation"
  documentation_accuracy: "100% status/checkbox alignment"
  workflow_halt_rate: "<5% for well-specified stories"
  manual_intervention_rate: "<2% for systematic issues"
  
CRITICAL_METRIC:
  checkbox_completion_integrity: "100% for COMPLETE stories"
  # This metric specifically prevents Story 2.3 failure recurrence
```

## Success Criteria for System Deployment

### Validation Requirements
```yaml
DEPLOYMENT_READY_WHEN:
  - story_2_3_failure_impossible: true
  - all_checkpoints_tested: true  
  - agent_handback_process_validated: true
  - escalation_protocol_tested: true
  - documentation_accuracy_guaranteed: true
  
TESTING_CHECKLIST:
  - test_with_intentionally_non_compliant_agents: true
  - verify_checkbox_scan_catches_unchecked_boxes: true
  - confirm_handback_provides_specific_remediation: true
  - validate_no_checkpoint_bypass_possible: true
  - test_escalation_triggers_properly: true
```

---

**CRITICAL SUCCESS FACTOR:** This mandatory checkpoint system prevents the Story 2.3 "checkbox unchecked but story marked complete" failure from ever happening again.

**INTEGRATION REQUIREMENT:** Must be integrated into `.bmad-serena-workflow/tasks/orchestrate-epic.md` as mandatory checkpoint calls after each agent phase.

**ZERO TOLERANCE:** Any agent specification violation must halt orchestration until compliance achieved.