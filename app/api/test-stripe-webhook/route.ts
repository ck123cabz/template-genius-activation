import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Test endpoint to validate Stripe webhook integration without actually using Stripe
 * This simulates the payment correlation flow for development and testing
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientToken, paymentData } = body;

    if (!action || !clientToken) {
      return NextResponse.json(
        { error: "Missing required fields: action, clientToken" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find the client by token
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("token", clientToken)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found", details: clientError },
        { status: 404 }
      );
    }

    switch (action) {
      case "payment_success":
        return await handleTestPaymentSuccess(client, paymentData);
      case "payment_failure":
        return await handleTestPaymentFailure(client, paymentData);
      case "checkout_complete":
        return await handleTestCheckoutComplete(client, paymentData);
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

async function handleTestPaymentSuccess(client: any, paymentData: any) {
  const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
  const supabase = await createServiceClient();

  const testPaymentIntent = {
    id: paymentData?.payment_intent_id || `pi_test_${Date.now()}`,
    amount: paymentData?.amount || 50000,
    currency: paymentData?.currency || 'usd',
  };

  // Create payment correlation
  const correlationResult = await createPaymentCorrelation({
    stripePaymentIntentId: testPaymentIntent.id,
    clientId: client.id,
    outcomeType: 'paid',
    paymentMetadata: {
      amount: testPaymentIntent.amount,
      currency: testPaymentIntent.currency,
      payment_method: 'test_card',
      client_token: client.token,
      client_id: client.id.toString(),
      test_mode: true,
    },
    journeyContext: {
      payment_intent_id: testPaymentIntent.id,
      payment_method_selected: 'test_card',
      amount_paid: testPaymentIntent.amount / 100,
      currency: testPaymentIntent.currency,
      processing_time: new Date().toISOString(),
      test_environment: true,
    },
  });

  // Update client with payment information
  const { error: updateError } = await supabase
    .from("clients")
    .update({
      journey_outcome: "paid",
      outcome_notes: `TEST: Payment successful. Amount: $${(testPaymentIntent.amount / 100).toFixed(2)} USD. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
      outcome_timestamp: new Date().toISOString(),
      payment_received: true,
      payment_amount: testPaymentIntent.amount / 100,
      payment_timestamp: new Date().toISOString(),
      payment_status: 'paid',
    })
    .eq("id", client.id);

  if (updateError) {
    console.error("Failed to update client:", updateError);
    return NextResponse.json(
      { error: "Failed to update client", details: updateError },
      { status: 500 }
    );
  }

  // Store payment event
  await supabase
    .from("payment_events")
    .insert({
      client_id: client.id,
      stripe_event_id: `test_success_${testPaymentIntent.id}`,
      event_type: "test.payment_intent.succeeded",
      event_data: {
        payment_intent_id: testPaymentIntent.id,
        amount: testPaymentIntent.amount,
        currency: testPaymentIntent.currency,
        test_mode: true,
        correlation_id: correlationResult.correlationId,
      },
      processed_at: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: "Test payment success processed",
    client_id: client.id,
    correlation_id: correlationResult.correlationId,
    amount_paid: testPaymentIntent.amount / 100,
  });
}

async function handleTestPaymentFailure(client: any, paymentData: any) {
  const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
  const supabase = await createServiceClient();

  const testPaymentIntent = {
    id: paymentData?.payment_intent_id || `pi_test_failed_${Date.now()}`,
    amount: paymentData?.amount || 50000,
    currency: paymentData?.currency || 'usd',
  };

  // Create payment failure correlation
  const correlationResult = await createPaymentCorrelation({
    stripePaymentIntentId: testPaymentIntent.id,
    clientId: client.id,
    outcomeType: 'failed',
    paymentMetadata: {
      amount: testPaymentIntent.amount,
      currency: testPaymentIntent.currency,
      payment_method: 'test_card',
      failure_reason: paymentData?.failure_reason || 'Test failure',
      failure_code: paymentData?.failure_code || 'card_declined',
      client_token: client.token,
      client_id: client.id.toString(),
      test_mode: true,
    },
    journeyContext: {
      payment_intent_id: testPaymentIntent.id,
      payment_method_attempted: 'test_card',
      amount_attempted: testPaymentIntent.amount / 100,
      currency: testPaymentIntent.currency,
      failure_timestamp: new Date().toISOString(),
      failure_details: {
        message: paymentData?.failure_reason || 'Test failure',
        code: paymentData?.failure_code || 'card_declined',
        type: 'test_error',
      },
      test_environment: true,
    },
  });

  // Update client with payment failure information
  const { error: updateError } = await supabase
    .from("clients")
    .update({
      journey_outcome: "pending",
      outcome_notes: `TEST: Payment failed. Reason: ${paymentData?.failure_reason || 'Test failure'}. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
      outcome_timestamp: new Date().toISOString(),
      payment_status: 'failed',
    })
    .eq("id", client.id);

  if (updateError) {
    console.error("Failed to update client:", updateError);
    return NextResponse.json(
      { error: "Failed to update client", details: updateError },
      { status: 500 }
    );
  }

  // Store payment failure event
  await supabase
    .from("payment_events")
    .insert({
      client_id: client.id,
      stripe_event_id: `test_failed_${testPaymentIntent.id}`,
      event_type: "test.payment_intent.payment_failed",
      event_data: {
        payment_intent_id: testPaymentIntent.id,
        amount: testPaymentIntent.amount,
        currency: testPaymentIntent.currency,
        failure_reason: paymentData?.failure_reason || 'Test failure',
        failure_code: paymentData?.failure_code || 'card_declined',
        test_mode: true,
        correlation_id: correlationResult.correlationId,
      },
      processed_at: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: "Test payment failure processed",
    client_id: client.id,
    correlation_id: correlationResult.correlationId,
    failure_reason: paymentData?.failure_reason || 'Test failure',
  });
}

async function handleTestCheckoutComplete(client: any, paymentData: any) {
  const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
  const supabase = await createServiceClient();

  const testSession = {
    id: paymentData?.session_id || `cs_test_${Date.now()}`,
    payment_intent: paymentData?.payment_intent_id || `pi_test_${Date.now()}`,
    amount_total: paymentData?.amount || 50000,
    currency: paymentData?.currency || 'usd',
    payment_status: paymentData?.payment_status || 'paid',
  };

  const outcomeType = testSession.payment_status === 'paid' ? 'paid' : 'pending';

  // Create checkout completion correlation
  const correlationResult = await createPaymentCorrelation({
    stripePaymentIntentId: testSession.payment_intent,
    stripeSessionId: testSession.id,
    clientId: client.id,
    outcomeType,
    paymentMetadata: {
      amount: testSession.amount_total,
      currency: testSession.currency,
      payment_method: 'test_card',
      payment_status: testSession.payment_status,
      session_id: testSession.id,
      client_token: client.token,
      client_id: client.id.toString(),
      test_mode: true,
    },
    journeyContext: {
      session_id: testSession.id,
      payment_intent_id: testSession.payment_intent,
      payment_status: testSession.payment_status,
      amount_total: testSession.amount_total / 100,
      currency: testSession.currency,
      checkout_completion_time: new Date().toISOString(),
      test_environment: true,
    },
  });

  // Update client with checkout completion
  const updates: any = {
    journey_outcome: testSession.payment_status === 'paid' ? 'paid' : 'pending',
    outcome_notes: `TEST: Checkout completed. Session ID: ${testSession.id}. Status: ${testSession.payment_status}. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
    outcome_timestamp: new Date().toISOString(),
    payment_session_id: testSession.id,
    payment_status: testSession.payment_status,
  };

  if (testSession.payment_status === 'paid') {
    updates.payment_received = true;
    updates.payment_amount = testSession.amount_total / 100;
    updates.payment_timestamp = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", client.id);

  if (updateError) {
    console.error("Failed to update client:", updateError);
    return NextResponse.json(
      { error: "Failed to update client", details: updateError },
      { status: 500 }
    );
  }

  // Store checkout completion event
  await supabase
    .from("payment_events")
    .insert({
      client_id: client.id,
      stripe_event_id: `test_checkout_${testSession.id}`,
      event_type: "test.checkout.session.completed",
      event_data: {
        session_id: testSession.id,
        payment_intent_id: testSession.payment_intent,
        payment_status: testSession.payment_status,
        amount_total: testSession.amount_total,
        currency: testSession.currency,
        test_mode: true,
        correlation_id: correlationResult.correlationId,
      },
      processed_at: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: "Test checkout completion processed",
    client_id: client.id,
    correlation_id: correlationResult.correlationId,
    payment_status: testSession.payment_status,
    amount: testSession.payment_status === 'paid' ? testSession.amount_total / 100 : 0,
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Stripe Webhook Test Endpoint",
    endpoints: {
      "POST /api/test-stripe-webhook": "Test webhook integration",
    },
    usage: {
      payment_success: {
        action: "payment_success",
        clientToken: "G1001",
        paymentData: {
          payment_intent_id: "pi_test_123",
          amount: 50000,
          currency: "usd"
        }
      },
      payment_failure: {
        action: "payment_failure",
        clientToken: "G1001",
        paymentData: {
          payment_intent_id: "pi_test_fail_123",
          amount: 50000,
          currency: "usd",
          failure_reason: "Card declined",
          failure_code: "card_declined"
        }
      },
      checkout_complete: {
        action: "checkout_complete",
        clientToken: "G1001",
        paymentData: {
          session_id: "cs_test_123",
          payment_intent_id: "pi_test_123",
          amount: 50000,
          currency: "usd",
          payment_status: "paid"
        }
      }
    }
  });
}