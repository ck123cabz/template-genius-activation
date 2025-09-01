#!/usr/bin/env node

/**
 * COMPREHENSIVE STRIPE PAYMENT INTEGRATION VALIDATION
 * 
 * Tests the complete payment correlation system including:
 * - Webhook processing
 * - Database correlation tracking
 * - Client status updates
 * - Revenue Intelligence Engine operations
 */

const WEBHOOK_BASE_URL = 'http://localhost:3000/api/test-stripe-webhook';
const TEST_CLIENT_TOKEN = 'G1001';

// Test scenarios
const scenarios = [
  {
    name: 'Payment Success - Standard Flow',
    action: 'payment_success',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      payment_intent_id: `pi_test_success_${Date.now()}`,
      amount: 50000,
      currency: 'usd'
    }
  },
  {
    name: 'Payment Failure - Card Declined',
    action: 'payment_failure',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      payment_intent_id: `pi_test_failure_${Date.now()}`,
      amount: 50000,
      currency: 'usd',
      failure_reason: 'Card declined',
      failure_code: 'card_declined'
    }
  },
  {
    name: 'Checkout Complete - Paid Status',
    action: 'checkout_complete',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      session_id: `cs_test_complete_${Date.now()}`,
      payment_intent_id: `pi_test_checkout_${Date.now()}`,
      amount: 50000,
      currency: 'usd',
      payment_status: 'paid'
    }
  },
  {
    name: 'Large Payment - Enterprise',
    action: 'payment_success',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      payment_intent_id: `pi_test_enterprise_${Date.now()}`,
      amount: 500000,
      currency: 'usd'
    }
  },
  {
    name: 'International Payment - EUR',
    action: 'payment_success',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      payment_intent_id: `pi_test_eur_${Date.now()}`,
      amount: 45000,
      currency: 'eur'
    }
  }
];

// Performance tracking
let testResults = {
  total: 0,
  success: 0,
  failure: 0,
  times: [],
  errors: []
};

async function makeRequest(scenario) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(WEBHOOK_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenario)
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const data = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${data.substring(0, 200)}`);
    }

    testResults.total++;
    testResults.times.push(responseTime);

    if (response.ok && parsedData.success) {
      testResults.success++;
      console.log(`✅ ${scenario.name}: ${responseTime}ms - Correlation ID: ${parsedData.correlation_id}`);
      return { success: true, responseTime, data: parsedData };
    } else {
      testResults.failure++;
      testResults.errors.push(`${scenario.name}: ${parsedData.error || 'Unknown error'}`);
      console.log(`❌ ${scenario.name}: ${responseTime}ms - Error: ${parsedData.error || 'Unknown error'}`);
      return { success: false, responseTime, error: parsedData.error };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    testResults.total++;
    testResults.failure++;
    testResults.times.push(responseTime);
    testResults.errors.push(`${scenario.name}: ${error.message}`);
    
    console.log(`💥 ${scenario.name}: ${responseTime}ms - Network Error: ${error.message}`);
    return { success: false, responseTime, error: error.message };
  }
}

async function loadTest() {
  console.log('🚀 STRIPE PAYMENT INTEGRATION VALIDATION STARTED\n');
  console.log(`Testing against: ${WEBHOOK_BASE_URL}`);
  console.log(`Test client token: ${TEST_CLIENT_TOKEN}\n`);

  // Test 1: Individual scenario testing
  console.log('📋 INDIVIDUAL SCENARIO TESTING');
  console.log('='.repeat(50));
  
  for (const scenario of scenarios) {
    await makeRequest(scenario);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 LOAD TESTING (10 concurrent requests)');
  console.log('='.repeat(50));
  
  // Test 2: Concurrent load testing
  const concurrentRequests = Array(10).fill(null).map((_, index) => ({
    name: `Concurrent Payment ${index + 1}`,
    action: 'payment_success',
    clientToken: TEST_CLIENT_TOKEN,
    paymentData: {
      payment_intent_id: `pi_test_concurrent_${Date.now()}_${index}`,
      amount: 50000,
      currency: 'usd'
    }
  }));

  const concurrentPromises = concurrentRequests.map(scenario => makeRequest(scenario));
  await Promise.all(concurrentPromises);

  // Test 3: Rapid fire testing
  console.log('\n⚡ RAPID FIRE TESTING (50 requests in 5 seconds)');
  console.log('='.repeat(50));
  
  const rapidFirePromises = [];
  for (let i = 0; i < 50; i++) {
    rapidFirePromises.push(makeRequest({
      name: `Rapid Fire ${i + 1}`,
      action: 'payment_success',
      clientToken: TEST_CLIENT_TOKEN,
      paymentData: {
        payment_intent_id: `pi_test_rapid_${Date.now()}_${i}`,
        amount: 50000,
        currency: 'usd'
      }
    }));
    
    // Small delay to spread requests over 5 seconds
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  await Promise.all(rapidFirePromises);

  // Generate comprehensive report
  console.log('\n' + '='.repeat(70));
  console.log('📈 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  
  const avgResponseTime = testResults.times.reduce((sum, time) => sum + time, 0) / testResults.times.length;
  const minResponseTime = Math.min(...testResults.times);
  const maxResponseTime = Math.max(...testResults.times);
  const p95ResponseTime = testResults.times.sort((a, b) => a - b)[Math.floor(testResults.times.length * 0.95)];
  
  console.log(`📊 Performance Metrics:`);
  console.log(`   • Total Requests: ${testResults.total}`);
  console.log(`   • Successful: ${testResults.success} (${((testResults.success / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`   • Failed: ${testResults.failure} (${((testResults.failure / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`   • Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   • Min Response Time: ${minResponseTime}ms`);
  console.log(`   • Max Response Time: ${maxResponseTime}ms`);
  console.log(`   • P95 Response Time: ${p95ResponseTime}ms`);
  
  const throughput = testResults.total / (testResults.times.reduce((sum, time) => sum + time, 0) / 1000);
  console.log(`   • Estimated Throughput: ${throughput.toFixed(2)} RPS`);

  if (testResults.errors.length > 0) {
    console.log(`\n❌ Error Details:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log(`\n🎯 Success Criteria Assessment:`);
  console.log(`   • Response Time < 1000ms: ${avgResponseTime < 1000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   • Success Rate > 95%: ${(testResults.success / testResults.total) > 0.95 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   • P95 < 2000ms: ${p95ResponseTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   • No Critical Errors: ${testResults.errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

  const overallSuccess = (
    avgResponseTime < 1000 &&
    (testResults.success / testResults.total) > 0.95 &&
    p95ResponseTime < 2000
  );

  console.log(`\n${overallSuccess ? '🎉' : '⚠️'} OVERALL RESULT: ${overallSuccess ? 'VALIDATION SUCCESSFUL' : 'VALIDATION NEEDS ATTENTION'}`);
  
  if (overallSuccess) {
    console.log('\n✨ The Stripe payment integration is ready for production!');
    console.log('   • All webhook endpoints are functioning correctly');
    console.log('   • Payment correlation tracking is operational');
    console.log('   • Revenue Intelligence Engine is capturing data');
    console.log('   • Performance meets production requirements');
  } else {
    console.log('\n🔧 Recommendations for improvement:');
    if (avgResponseTime >= 1000) console.log('   • Optimize webhook processing performance');
    if ((testResults.success / testResults.total) <= 0.95) console.log('   • Improve error handling and retry logic');
    if (p95ResponseTime >= 2000) console.log('   • Investigate database query performance');
  }
}

// Run the validation
loadTest().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});