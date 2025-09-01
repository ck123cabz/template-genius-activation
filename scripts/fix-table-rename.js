#!/usr/bin/env node

/**
 * Script to fix the critical table name mismatch
 * Renames "current_journey_pages" to "journey_pages" to match application code
 */

const { createClient } = require('@supabase/supabase-js');

async function fixTableRename() {
  console.log('🔧 Starting table rename migration...');
  
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Checking current table status...');
    
    // Check if current_journey_pages exists
    const { data: currentTables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('📋 Attempting direct query instead...');
    }
    
    // Execute the rename migration
    console.log('🔄 Executing table rename: current_journey_pages → journey_pages');
    
    const migrationSQL = `
      -- Rename the table to match application expectations
      ALTER TABLE current_journey_pages RENAME TO journey_pages;
      
      -- Verify the operation
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.tables 
                       WHERE table_schema = 'public' AND table_name = 'journey_pages')
          THEN 'SUCCESS: journey_pages table exists'
          ELSE 'ERROR: journey_pages table not found'
        END as result;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.log('❌ RPC failed, trying direct SQL execution...');
      
      // Fallback: Try direct query execution
      const { data: renameData, error: renameError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['current_journey_pages', 'journey_pages']);
      
      console.log('📋 Current tables:', renameData);
      
      // If we can't use RPC, we'll need to use the Supabase dashboard
      console.log('⚠️  Please execute this SQL in Supabase Dashboard > SQL Editor:');
      console.log('');
      console.log('ALTER TABLE current_journey_pages RENAME TO journey_pages;');
      console.log('');
      console.log('Then run this script again to verify.');
      
      return false;
    }
    
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', data);
    
    // Verify the rename worked
    console.log('🔍 Verifying table rename...');
    
    const { data: finalTables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['current_journey_pages', 'journey_pages']);
    
    if (verifyError) {
      console.log('⚠️  Could not verify tables:', verifyError.message);
    } else {
      console.log('📋 Final table status:', finalTables);
      
      const hasJourneyPages = finalTables.some(t => t.table_name === 'journey_pages');
      const hasCurrentJourneyPages = finalTables.some(t => t.table_name === 'current_journey_pages');
      
      if (hasJourneyPages && !hasCurrentJourneyPages) {
        console.log('🎉 SUCCESS: Table renamed successfully!');
        console.log('✅ journey_pages table exists');
        console.log('✅ current_journey_pages table no longer exists');
        return true;
      } else {
        console.log('❌ Migration incomplete:');
        console.log(`- journey_pages exists: ${hasJourneyPages}`);
        console.log(`- current_journey_pages exists: ${hasCurrentJourneyPages}`);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('Manual fix required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Execute: ALTER TABLE current_journey_pages RENAME TO journey_pages;');
    console.log('3. Verify the table is renamed correctly');
    return false;
  }
}

// Run the migration
if (require.main === module) {
  fixTableRename()
    .then(success => {
      if (success) {
        console.log('🚀 Ready to test the application!');
        console.log('📱 Test URL: http://localhost:3000/journey/G5840');
        process.exit(0);
      } else {
        console.log('🔧 Manual intervention required.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixTableRename };