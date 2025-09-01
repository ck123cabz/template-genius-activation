# 🚨 URGENT: Critical Table Rename Required

## Problem Confirmed
**API Test Results**: `current_journey_pages` exists but `journey_pages` does not exist.

**Root Cause**: Database migration created table as `current_journey_pages` but application code expects `journey_pages`.

**Impact**: Complete activation flow broken - clients cannot access journey pages.

## Immediate Fix Required

### Step 1: Execute SQL in Supabase Dashboard

1. **Go to**: https://app.supabase.com/project/tmfvxxqouakrlrqznpya/sql
2. **Login** with your Supabase credentials
3. **Paste and Execute** this SQL:

```sql
-- Rename table to match application code expectations
ALTER TABLE current_journey_pages RENAME TO journey_pages;

-- Verify the rename was successful
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('current_journey_pages', 'journey_pages')
ORDER BY table_name;

-- Should show only 'journey_pages' after successful rename
```

### Step 2: Verify Fix

After executing the SQL:

```bash
# Test the API to confirm fix
curl -X GET "http://localhost:3000/api/test-tables"

# Should return:
# - current_journey_pages: exists: false
# - journey_pages: exists: true
# - recommendation: "ALREADY FIXED"
```

### Step 3: Test End-to-End Flow

1. **Navigate to**: http://localhost:3000/journey/G5840
2. **Expect**: Journey pages load without "Error fetching journey pages"
3. **Verify**: 4-page journey flow works (activation → agreement → confirmation → processing)

## Alternative: Manual SQL Execution via CLI

If you have `supabase` CLI installed:

```bash
supabase db reset --project-ref tmfvxxqouakrlrqznpya
# Then re-run migrations with correct table name
```

## Verification Commands

```bash
# Test table exists
curl -X GET "http://localhost:3000/api/test-tables"

# Test client journey loads
curl -X GET "http://localhost:3000/journey/G5840" | grep -c "Error fetching"
# Should return 0 (no errors)
```

## Expected Results After Fix

- ✅ `journey_pages` table exists and contains journey data
- ✅ Client G5840 journey loads at http://localhost:3000/journey/G5840
- ✅ Client G0001 journey loads at http://localhost:3000/journey/G0001
- ✅ Dashboard shows clients without journey page errors
- ✅ End-to-end testing can proceed

## Files That Will Work After Fix

- `/app/actions/journey-actions.ts` - All 20+ references to `journey_pages` table
- `/app/actions/journey-analytics-actions.ts` - All 10+ references resolved
- Client activation flow completely functional

## Next Phase After Fix

1. **Complete E2E Testing**: Full journey flow validation
2. **Payment Integration**: Stripe payment session creation and webhook handling  
3. **Database Validation**: All foreign key relationships working
4. **Performance Testing**: Load testing with multiple concurrent clients

---

**CRITICAL**: This table rename is blocking the entire Template Genius Revenue Intelligence Engine end-to-end validation. Execute immediately.