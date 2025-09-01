-- =============================================================================
-- CRITICAL FIX: Rename current_journey_pages to journey_pages
-- =============================================================================
-- Problem: Application code expects "journey_pages" table but we have "current_journey_pages"
-- This causes errors like "Could not find the table 'public.journey_pages' in the schema cache"
--
-- Solution: Rename the table and update all constraints/indexes
-- =============================================================================

-- Step 1: Rename the table
ALTER TABLE current_journey_pages RENAME TO journey_pages;

-- Step 2: Rename all indexes to match the new table name
DROP INDEX IF EXISTS current_journey_pages_client_id_idx;
CREATE INDEX IF NOT EXISTS journey_pages_client_id_idx ON journey_pages(client_id);

DROP INDEX IF EXISTS current_journey_pages_page_type_idx;  
CREATE INDEX IF NOT EXISTS journey_pages_page_type_idx ON journey_pages(page_type);

-- Step 3: Update any RLS policy names (if they exist)
DROP POLICY IF EXISTS "Public can read journey pages" ON current_journey_pages;
DROP POLICY IF EXISTS "Public can update journey pages" ON current_journey_pages;

-- Recreate policies on the renamed table
CREATE POLICY IF NOT EXISTS "Public can read journey pages" ON journey_pages
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can update journey pages" ON journey_pages  
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert journey pages" ON journey_pages
  FOR INSERT WITH CHECK (true);

-- Step 4: Verify the rename was successful
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'journey_pages') THEN
        RAISE NOTICE 'SUCCESS: Table renamed from current_journey_pages to journey_pages';
    ELSE
        RAISE WARNING 'ERROR: journey_pages table not found after rename operation';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'current_journey_pages') THEN
        RAISE WARNING 'WARNING: current_journey_pages table still exists - rename may have failed';
    ELSE
        RAISE NOTICE 'SUCCESS: current_journey_pages table no longer exists';
    END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- 
-- This migration fixes the critical table name mismatch:
-- ✅ Renamed current_journey_pages → journey_pages
-- ✅ Updated indexes to match new table name
-- ✅ Recreated RLS policies on the new table name
-- ✅ Verification checks included
-- 
-- The application's journey-actions.ts should now work correctly
-- =============================================================================