# Acceptance Criteria

## Client Journey Creation
**Given** an admin creates a new client  
**When** they provide company details and overall hypothesis  
**Then** system creates client with 4 connected pages and unique token

## Learning Capture
**Given** an admin edits journey content  
**When** they save changes  
**Then** system requires hypothesis and stores with content version

## Payment Intelligence
**Given** a client completes payment  
**When** Stripe webhook fires  
**Then** system links payment to journey content and marks outcome as 'paid'

## Pattern Recognition
**Given** 3+ similar hypotheses have same outcome  
**When** admin views patterns dashboard  
**Then** system shows this as a recognized pattern with confidence score

---
