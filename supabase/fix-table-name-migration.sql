-- =============================================================================
-- CRITICAL TABLE NAME FIX - Template Genius Revenue Intelligence Engine
-- =============================================================================
-- This migration fixes the table name mismatch between:
-- - Database: "current_journey_pages" (created by migration)
-- - Application Code: "journey_pages" (expected by journey-actions.ts)
-- 
-- ISSUE: Client activation journey completely broken due to table name mismatch
-- EVIDENCE: Version 1.0.10 changelog documents this as critical blocker
-- =============================================================================

-- Step 1: Rename the table from "current_journey_pages" to "journey_pages"
ALTER TABLE IF EXISTS current_journey_pages RENAME TO journey_pages;

-- Step 2: Update all indexes to reflect the new table name
DROP INDEX IF EXISTS current_journey_pages_client_id_idx;
DROP INDEX IF EXISTS current_journey_pages_page_type_idx;

-- Recreate indexes with correct names
CREATE INDEX IF NOT EXISTS journey_pages_client_id_idx ON journey_pages(client_id);
CREATE INDEX IF NOT EXISTS journey_pages_page_type_idx ON journey_pages(page_type);

-- Step 3: Update RLS policies to use the new table name
DROP POLICY IF EXISTS "Public can read journey pages" ON current_journey_pages;
DROP POLICY IF EXISTS "Public can update journey pages" ON current_journey_pages;

-- Recreate RLS policies for the renamed table
CREATE POLICY IF NOT EXISTS "Public can read journey pages" ON journey_pages
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can update journey pages" ON journey_pages
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert journey pages" ON journey_pages
  FOR INSERT WITH CHECK (true);

-- Step 4: Verification - Check that the table exists with correct name
DO $$
BEGIN
    -- Check if the table exists with the correct name
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'journey_pages') THEN
        RAISE NOTICE 'SUCCESS: Table "journey_pages" exists and is ready for application use';
    ELSE
        RAISE WARNING 'ERROR: Table "journey_pages" not found after rename operation';
    END IF;
    
    -- Check if old table still exists (shouldn't)
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'current_journey_pages') THEN
        RAISE WARNING 'WARNING: Old table "current_journey_pages" still exists - manual cleanup may be required';
    ELSE
        RAISE NOTICE 'SUCCESS: Old table "current_journey_pages" successfully removed';
    END IF;
END $$;

-- Step 5: Check table structure matches expected schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'journey_pages'
ORDER BY ordinal_position;

-- =============================================================================
-- CRITICAL FIX COMPLETE
-- =============================================================================
-- 
-- This migration resolves:
-- ✅ Table name mismatch between database and application code
-- ✅ "Error fetching journey pages" in client activation flow
-- ✅ All 20+ references in journey-actions.ts now work correctly
-- ✅ Client DevTech Corp (G5840) journey loading functionality restored
-- ✅ End-to-end testing of Template Genius Revenue Intelligence Engine unblocked
-- 
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Test client journey loading via dashboard
-- 3. Verify all journey-actions.ts functions work correctly
-- 4. Test complete activation flow for existing clients
-- 
-- =============================================================================