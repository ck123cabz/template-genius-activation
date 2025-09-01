import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔧 Starting table rename migration...');
    
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if current_journey_pages table exists
    console.log('📋 Checking current table status...');
    
    const { data: beforeTables, error: beforeError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['current_journey_pages', 'journey_pages']);

    if (beforeError) {
      console.error('Error checking table status:', beforeError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to check table status: ${beforeError.message}`,
        details: beforeError 
      }, { status: 500 });
    }

    console.log('📋 Current tables before migration:', beforeTables);

    const hasCurrentJourneyPages = beforeTables?.some(t => t.table_name === 'current_journey_pages');
    const hasJourneyPages = beforeTables?.some(t => t.table_name === 'journey_pages');

    if (!hasCurrentJourneyPages && hasJourneyPages) {
      return NextResponse.json({
        success: true,
        message: 'Table already renamed correctly',
        status: 'journey_pages already exists, current_journey_pages does not exist',
        tables: beforeTables
      });
    }

    if (!hasCurrentJourneyPages) {
      return NextResponse.json({
        success: false,
        error: 'current_journey_pages table not found',
        message: 'Cannot rename table because current_journey_pages does not exist',
        tables: beforeTables
      }, { status: 404 });
    }

    if (hasJourneyPages) {
      return NextResponse.json({
        success: false,
        error: 'journey_pages table already exists',
        message: 'Cannot rename because both current_journey_pages and journey_pages exist',
        tables: beforeTables
      }, { status: 409 });
    }

    // Execute the table rename using raw SQL
    console.log('🔄 Executing table rename: current_journey_pages → journey_pages');
    
    // Use the sql method to execute raw SQL
    const { data: renameResult, error: renameError } = await supabase.rpc('alter_table_rename', {
      old_name: 'current_journey_pages',
      new_name: 'journey_pages'
    });

    if (renameError) {
      // Supabase might not have the RPC function, let's try a different approach
      console.log('RPC method failed, this is expected. Manual SQL execution required.');
      
      return NextResponse.json({
        success: false,
        error: 'Cannot execute ALTER TABLE via API',
        message: 'Please execute this SQL manually in Supabase Dashboard > SQL Editor:',
        sql: 'ALTER TABLE current_journey_pages RENAME TO journey_pages;',
        instructions: [
          '1. Go to https://app.supabase.com/project/tmfvxxqouakrlrqznpya/sql',
          '2. Execute: ALTER TABLE current_journey_pages RENAME TO journey_pages;',
          '3. Call this API endpoint again to verify the rename worked'
        ]
      }, { status: 422 });
    }

    // Verify the rename worked
    console.log('🔍 Verifying table rename...');
    
    const { data: afterTables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['current_journey_pages', 'journey_pages']);

    if (verifyError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify migration',
        message: verifyError.message
      }, { status: 500 });
    }

    const finalHasJourneyPages = afterTables?.some(t => t.table_name === 'journey_pages');
    const finalHasCurrentJourneyPages = afterTables?.some(t => t.table_name === 'current_journey_pages');

    if (finalHasJourneyPages && !finalHasCurrentJourneyPages) {
      console.log('🎉 SUCCESS: Table renamed successfully!');
      
      return NextResponse.json({
        success: true,
        message: 'Table renamed successfully',
        before: beforeTables,
        after: afterTables,
        status: {
          journey_pages_exists: finalHasJourneyPages,
          current_journey_pages_exists: finalHasCurrentJourneyPages
        },
        nextSteps: [
          'Test the journey pages at http://localhost:3000/journey/G5840',
          'Verify client activation flow works end-to-end'
        ]
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Migration verification failed',
        message: 'Table rename may not have completed properly',
        status: {
          journey_pages_exists: finalHasJourneyPages,
          current_journey_pages_exists: finalHasCurrentJourneyPages
        },
        tables: afterTables
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Migration failed with exception:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Migration failed with exception',
      message: error instanceof Error ? error.message : 'Unknown error',
      instructions: [
        'Manual fix required:',
        '1. Go to Supabase Dashboard > SQL Editor',
        '2. Execute: ALTER TABLE current_journey_pages RENAME TO journey_pages;',
        '3. Verify the table is renamed correctly'
      ]
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Just check the current table status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['current_journey_pages', 'journey_pages']);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    const hasCurrentJourneyPages = tables?.some(t => t.table_name === 'current_journey_pages');
    const hasJourneyPages = tables?.some(t => t.table_name === 'journey_pages');

    return NextResponse.json({
      success: true,
      tables: tables,
      status: {
        current_journey_pages_exists: hasCurrentJourneyPages,
        journey_pages_exists: hasJourneyPages,
        needs_migration: hasCurrentJourneyPages && !hasJourneyPages
      },
      message: hasJourneyPages ? 'Table correctly named' : 'Migration needed'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}