-- =============================================================================
-- FIX CRITICAL TABLE NAME MISMATCH - Template Genius Revenue Intelligence
-- =============================================================================
-- 
-- PROBLEM: Application code expects "journey_pages" but database has "current_journey_pages"
-- ERROR: "Could not find the table 'public.journey_pages' in the schema cache"
-- 
-- SOLUTION: Rename table from "current_journey_pages" to "journey_pages"
-- =============================================================================

-- Rename the table to match application expectations
ALTER TABLE current_journey_pages RENAME TO journey_pages;

-- Update any affected indexes (they should auto-rename but let's verify)
-- The indexes will automatically be renamed with the table

-- Verify the rename was successful
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'journey_pages') THEN
        RAISE NOTICE 'SUCCESS: Table renamed to "journey_pages"';
    ELSE
        RAISE EXCEPTION 'ERROR: Table "journey_pages" not found after rename operation';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'current_journey_pages') THEN
        RAISE EXCEPTION 'ERROR: Old table "current_journey_pages" still exists after rename';
    ELSE
        RAISE NOTICE 'SUCCESS: Old table "current_journey_pages" no longer exists';
    END IF;
END $$;

-- List all current tables for verification
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;