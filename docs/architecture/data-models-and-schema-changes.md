# Data Models and Schema Changes

## New Data Models

### **Enhanced Client Model**
**Purpose:** Extend existing client structure with activation token generation and content version tracking  
**Integration:** Builds on existing client table structure with direct content versioning

**Key Attributes:**
- `activation_token: string` - G[4-digit] unique token with collision detection
- `current_version_id: UUID` - Links to currently active content version for this client
- `status: string` - 'pending', 'active', 'paid', 'failed' for workflow tracking
- `metadata: JSONB` - Flexible storage for client-specific analytics and iteration tracking

**Relationships:**
- **With Existing:** Extends current client structure without breaking changes
- **With New:** Direct relationship to content_versions for client-specific content

### **Content Versions Model (PRD-Required)**
**Purpose:** Client-specific content versioning with complete learning capture system  
**Integration:** Core model enabling "each client becomes a controlled experiment" workflow

**Key Attributes:**
- `client_id: UUID` - Direct reference to clients(id) for content ownership
- `page_type: string` - 'activation', 'agreement', 'confirmation', 'processing'
- `content: JSONB` - Full page content structure for complete customization
- `iteration_notes: TEXT` - "Why this change?" rationale capture (PRD requirement)
- `hypothesis: TEXT` - Expected outcome for learning (PRD requirement)
- `outcome: VARCHAR(20)` - 'success', 'failure', 'pending' tracking (PRD requirement)
- `is_current: boolean` - Marks the active version for each client/page combination
- `version_number: integer` - Sequential version tracking per client
- `created_by: TEXT` - Admin user tracking
- `metadata: JSONB` - Additional analytics and context

**Relationships:**
- **With Existing:** References clients table for content ownership
- **With New:** Referenced by payments for conversion analysis

### **Payment Records Model**
**Purpose:** Track payment processing with content version analytics for business validation  
**Integration:** Stripe payment integration with direct content-version conversion tracking

**Key Attributes:**
- `client_id: UUID` - References clients(id) for payment tracking
- `content_version_id: UUID` - References content_versions(id) for precise conversion analytics
- `stripe_payment_intent_id: string` - Stripe payment reference (unique)
- `amount: integer` - Payment amount in cents (50000 for $500)
- `status: string` - 'pending', 'succeeded', 'failed', 'cancelled'
- `created_at: TIMESTAMP` - Payment timing for analytics

**Relationships:**
- **With Existing:** References clients table
- **With New:** Links to content_versions for exact content-conversion tracking

## PRD-Aligned Schema Implementation

**Database Changes Required:**

**New Tables:**
- `content_versions` - Client-specific content versions with learning capture
- `payments` - Payment processing with content version tracking

**Modified Tables:**  
- `clients` - Add activation_token, current_version_id, status fields

**New Indexes:**
- `clients.activation_token` - Unique constraint and fast lookup for activation URLs
- `content_versions.client_id` - Fast content retrieval per client
- `content_versions.is_current` - Quick access to active versions
- `payments.content_version_id` - Fast conversion analytics by content version

**Migration Strategy:**
```sql
-- Phase 1: Extend existing clients table (PRD-compliant)
ALTER TABLE clients ADD COLUMN activation_token VARCHAR(5) UNIQUE;
ALTER TABLE clients ADD COLUMN current_version_id UUID;
ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'pending';

-- Phase 2: Create PRD-required content versioning system
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  page_type VARCHAR(50) NOT NULL, -- 'activation', 'agreement', 'confirmation', 'processing'
  content JSONB NOT NULL,
  iteration_notes TEXT,           -- PRD requirement: "Why this change?"
  hypothesis TEXT,               -- PRD requirement: Expected outcome
  outcome VARCHAR(20),           -- PRD requirement: success/failure/pending
  is_current BOOLEAN DEFAULT false, -- Marks active version
  version_number INTEGER,        -- Sequential versioning
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin',
  metadata JSONB DEFAULT '{}'
);

-- Phase 3: Payment tracking with content-version linking
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content_version_id UUID REFERENCES content_versions(id), -- Links payment to exact content
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 4: Proper constraints and triggers
ALTER TABLE clients ADD CONSTRAINT fk_clients_current_version 
  FOREIGN KEY (current_version_id) REFERENCES content_versions(id);

-- Ensure only one current version per client per page type
CREATE UNIQUE INDEX idx_content_versions_current 
  ON content_versions(client_id, page_type) 
  WHERE is_current = true;

-- Auto-increment version numbers per client
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO NEW.version_number
  FROM content_versions 
  WHERE client_id = NEW.client_id AND page_type = NEW.page_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_version_number_trigger
  BEFORE INSERT ON content_versions
  FOR EACH ROW EXECUTE FUNCTION set_version_number();

-- Phase 5: Token generation function with collision detection
CREATE OR REPLACE FUNCTION generate_activation_token()
RETURNS VARCHAR AS $$
DECLARE
    token VARCHAR(5);
BEGIN
    LOOP
        token := 'G' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM clients WHERE activation_token = token);
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;
```

**PRD Workflow Support:**
- Client-centric design enables true content isolation per client
- Learning fields (`iteration_notes`, `hypothesis`, `outcome`) support admin workflow
- Version management with `is_current` flag and auto-incrementing version numbers
- Payment-content linking enables precise conversion tracking

**Storage Efficiency (Free Tier Compliant):**
- Each content version ~20-50KB (within PRD limits)
- 100 clients × 4 page types × 5 versions = ~100MB (well under 500MB limit)
- Learning data enables business intelligence without additional storage cost

---
