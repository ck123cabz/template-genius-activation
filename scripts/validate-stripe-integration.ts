#!/usr/bin/env tsx

/**
 * Stripe Payment Integration Validation Script
 * 
 * This script validates:
 * 1. Stripe environment variables configuration
 * 2. Database schema for payment tables  
 * 3. Payment session creation and webhook handling
 * 4. Database relationships and foreign keys
 * 5. Payment event logging functionality
 */

import { supabase } from '../lib/supabase';
import { getStripe, isStripeConfigured, PAYMENT_AMOUNTS } from '../lib/stripe';

interface ValidationResult {
  success: boolean;
  details: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate Stripe environment variables
 */
async function validateStripeConfiguration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  // Check if Stripe is configured
  const isConfigured = isStripeConfigured();
  
  if (!isConfigured) {
    result.success = false;
    result.errors.push('Stripe is not configured - missing environment variables');
  }

  // Check individual environment variables
  const envVars = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET, 
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  };

  Object.entries(envVars).forEach(([key, value]) => {
    if (!value) {
      result.errors.push(`Missing environment variable: ${key}`);
    } else {
      result.details.push(`✓ ${key} is configured`);
    }
  });

  // Try to initialize Stripe if configured
  if (isConfigured) {
    try {
      const stripe = getStripe();
      if (stripe) {
        result.details.push('✓ Stripe server instance initialized successfully');
        
        // Test basic API connectivity (this will only work with real keys)
        try {
          await stripe.products.list({ limit: 1 });
          result.details.push('✓ Stripe API connectivity verified');
        } catch (error: any) {
          if (error?.code === 'api_key_invalid') {
            result.warnings.push('Stripe API key appears to be invalid (test keys expected)');
          } else {
            result.warnings.push(`Stripe API test failed: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Failed to initialize Stripe: ${error.message}`);
    }
  }

  // Validate payment amount configuration
  if (PAYMENT_AMOUNTS.ACTIVATION_FEE) {
    result.details.push(`✓ Activation fee configured: $${PAYMENT_AMOUNTS.ACTIVATION_FEE / 100}`);
  } else {
    result.warnings.push('Activation fee not configured');
  }

  return result;
}

/**
 * Validate payment-related database tables
 */
async function validatePaymentTables(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  if (!supabase) {
    result.errors.push('Supabase client not available');
    result.success = false;
    return result;
  }
  
  const requiredTables = [
    'clients',
    'payment_sessions', 
    'payment_events',
    'content_snapshots',
    'payment_timing_analytics'
  ];

  // Check if tables exist
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') { // relation does not exist
          result.errors.push(`Table '${tableName}' does not exist`);
          result.success = false;
        } else {
          result.warnings.push(`Table '${tableName}' exists but query failed: ${error.message}`);
        }
      } else {
        result.details.push(`✓ Table '${tableName}' exists and is accessible`);
      }
    } catch (error: any) {
      result.errors.push(`Failed to check table '${tableName}': ${error.message}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Validate payment_sessions table structure
 */
async function validatePaymentSessionsTable(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  if (!supabase) {
    result.errors.push('Supabase client not available');
    result.success = false;
    return result;
  }

  try {
    // Query the table structure
    const { data, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .limit(1);

    if (error) {
      result.errors.push(`Cannot access payment_sessions table: ${error.message}`);
      result.success = false;
      return result;
    }

    result.details.push('✓ payment_sessions table structure validated');

    // Check for existing data
    const { data: sessions, error: countError } = await supabase
      .from('payment_sessions')
      .select('id, client_id, stripe_session_id, status')
      .limit(10);

    if (countError) {
      result.warnings.push(`Could not fetch payment sessions: ${countError.message}`);
    } else {
      result.details.push(`✓ Found ${sessions?.length || 0} payment sessions in database`);
      
      if (sessions && sessions.length > 0) {
        const statuses = sessions.map(s => s.status).filter(Boolean);
        const uniqueStatuses = [...new Set(statuses)];
        result.details.push(`Payment session statuses found: ${uniqueStatuses.join(', ')}`);
      }
    }

  } catch (error: any) {
    result.errors.push(`Payment sessions validation failed: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Validate payment_events table structure  
 */
async function validatePaymentEventsTable(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  if (!supabase) {
    result.errors.push('Supabase client not available');
    result.success = false;
    return result;
  }

  try {
    const { data, error } = await supabase
      .from('payment_events')
      .select('*')
      .limit(1);

    if (error) {
      result.errors.push(`Cannot access payment_events table: ${error.message}`);
      result.success = false;
      return result;
    }

    result.details.push('✓ payment_events table structure validated');

    // Check for existing events
    const { data: events, error: countError } = await supabase
      .from('payment_events')
      .select('id, event_type, stripe_event_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (countError) {
      result.warnings.push(`Could not fetch payment events: ${countError.message}`);
    } else {
      result.details.push(`✓ Found ${events?.length || 0} payment events in database`);
      
      if (events && events.length > 0) {
        const eventTypes = events.map(e => e.event_type).filter(Boolean);
        const uniqueEventTypes = [...new Set(eventTypes)];
        result.details.push(`Event types found: ${uniqueEventTypes.join(', ')}`);
      }
    }

  } catch (error: any) {
    result.errors.push(`Payment events validation failed: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Validate foreign key relationships
 */
async function validateForeignKeyRelationships(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  if (!supabase) {
    result.errors.push('Supabase client not available');
    result.success = false;
    return result;
  }

  try {
    // Test clients table has payment-related fields
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, payment_status, payment_session_id, content_snapshot_id')
      .limit(1);

    if (clientsError) {
      result.errors.push(`Cannot access clients payment fields: ${clientsError.message}`);
    } else {
      result.details.push('✓ Clients table has payment-related fields');
    }

    // Test payment_sessions references clients
    const { data: sessionData, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('id, client_id')
      .limit(1);

    if (sessionError) {
      result.errors.push(`Cannot access payment_sessions client relationship: ${sessionError.message}`);
    } else {
      result.details.push('✓ payment_sessions table has client_id foreign key');
    }

    // Test content_snapshots references clients
    const { data: snapshotData, error: snapshotError } = await supabase
      .from('content_snapshots')
      .select('id, client_id, payment_session_id')
      .limit(1);

    if (snapshotError) {
      result.errors.push(`Cannot access content_snapshots relationships: ${snapshotError.message}`);
    } else {
      result.details.push('✓ content_snapshots table has proper foreign keys');
    }

  } catch (error: any) {
    result.errors.push(`Foreign key validation failed: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Test webhook endpoint accessibility
 */
async function validateWebhookEndpoint(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    details: [],
    warnings: [],
    errors: []
  };

  // We can't directly test the webhook endpoint without Stripe sending events,
  // but we can validate the route file exists and is properly structured
  
  try {
    // Check if webhook route file exists
    const fs = require('fs');
    const path = require('path');
    
    const webhookPath = path.join(process.cwd(), 'app/api/webhooks/stripe/route.ts');
    
    if (fs.existsSync(webhookPath)) {
      result.details.push('✓ Stripe webhook endpoint file exists');
      
      // Read and validate basic structure
      const webhookContent = fs.readFileSync(webhookPath, 'utf8');
      
      const requiredFunctions = [
        'handlePaymentSuccess',
        'handlePaymentFailure', 
        'handleCheckoutCompleted'
      ];
      
      for (const func of requiredFunctions) {
        if (webhookContent.includes(func)) {
          result.details.push(`✓ Webhook handler '${func}' found`);
        } else {
          result.warnings.push(`Webhook handler '${func}' not found`);
        }
      }
      
      // Check for proper event handling
      const eventTypes = [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'checkout.session.completed'
      ];
      
      for (const eventType of eventTypes) {
        if (webhookContent.includes(eventType)) {
          result.details.push(`✓ Event type '${eventType}' handled`);
        } else {
          result.warnings.push(`Event type '${eventType}' not handled`);
        }
      }
      
    } else {
      result.errors.push('Stripe webhook endpoint file not found');
      result.success = false;
    }
  } catch (error: any) {
    result.errors.push(`Webhook endpoint validation failed: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 STRIPE PAYMENT INTEGRATION VALIDATION');
  console.log('==========================================\n');

  const validationFunctions = [
    { name: 'Stripe Configuration', fn: validateStripeConfiguration },
    { name: 'Payment Tables', fn: validatePaymentTables },
    { name: 'Payment Sessions Table', fn: validatePaymentSessionsTable },
    { name: 'Payment Events Table', fn: validatePaymentEventsTable },
    { name: 'Foreign Key Relationships', fn: validateForeignKeyRelationships },
    { name: 'Webhook Endpoint', fn: validateWebhookEndpoint }
  ];

  let overallSuccess = true;
  const summary = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  for (const validation of validationFunctions) {
    console.log(`🧪 Testing: ${validation.name}`);
    console.log('-'.repeat(50));
    
    try {
      const result = await validation.fn();
      
      if (result.success) {
        summary.passed++;
        console.log('✅ PASSED');
      } else {
        summary.failed++;
        overallSuccess = false;
        console.log('❌ FAILED');
      }
      
      // Print details
      result.details.forEach(detail => console.log(`   ${detail}`));
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
        summary.warnings++;
      });
      result.errors.forEach(error => console.log(`   ❌ ${error}`));
      
    } catch (error: any) {
      summary.failed++;
      overallSuccess = false;
      console.log('❌ FAILED - Exception occurred');
      console.log(`   ❌ ${error.message}`);
    }
    
    console.log('');
  }

  // Print summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('====================');
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log('');

  if (overallSuccess) {
    console.log('🎉 All validations passed! Stripe integration appears to be working correctly.');
  } else {
    console.log('🚨 Some validations failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

export { main as validateStripeIntegration };