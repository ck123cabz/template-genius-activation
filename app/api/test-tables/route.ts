import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing table access...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test 1: Try to query current_journey_pages
    console.log('Testing current_journey_pages table...');
    const { data: currentData, error: currentError } = await supabase
      .from('current_journey_pages')
      .select('id, client_id, page_type')
      .limit(1);

    // Test 2: Try to query journey_pages
    console.log('Testing journey_pages table...');
    const { data: journeyData, error: journeyError } = await supabase
      .from('journey_pages')
      .select('id, client_id, page_type')
      .limit(1);

    return NextResponse.json({
      success: true,
      tests: {
        current_journey_pages: {
          exists: !currentError,
          error: currentError?.message,
          sample_data: currentData?.length || 0
        },
        journey_pages: {
          exists: !journeyError,
          error: journeyError?.message,
          sample_data: journeyData?.length || 0
        }
      },
      analysis: {
        needs_rename: !currentError && !!journeyError,
        already_fixed: !!currentError && !journeyError,
        both_exist: !currentError && !journeyError,
        neither_exist: !!currentError && !!journeyError
      },
      recommendation: !currentError && !!journeyError
        ? "RENAME REQUIRED: current_journey_pages exists but journey_pages does not"
        : !currentError && !journeyError
        ? "CONFLICT: Both tables exist - manual cleanup required"
        : !!currentError && !journeyError
        ? "ALREADY FIXED: journey_pages exists, current_journey_pages does not"
        : "ERROR: Neither table exists - schema setup required"
    });

  } catch (error) {
    console.error('Table test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test table access'
    }, { status: 500 });
  }
}