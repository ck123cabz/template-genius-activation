import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";

// Ensure environment variables are available for Stripe integration
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not found - webhook handler will return 503");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("STRIPE_WEBHOOK_SECRET not found - webhook handler will return 503");
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook handler called but environment variables not configured");
    return NextResponse.json(
      { error: "Stripe not configured - check STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`Processing Stripe webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  // Extract client information from metadata
  const clientToken = paymentIntent.metadata?.client_token;
  const clientId = paymentIntent.metadata?.client_id;
  const journeyId = paymentIntent.metadata?.journey_id;

  if (!clientToken && !clientId) {
    console.error("No client identification found in payment metadata");
    return;
  }

  try {
    // Find the client by token or ID
    let client;
    if (clientId) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("id", parseInt(clientId))
        .single();
      client = data;
    } else if (clientToken) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("token", clientToken)
        .single();
      client = data;
    }

    if (!client) {
      console.error("Client not found for payment:", { clientId, clientToken });
      return;
    }

    // Calculate conversion duration if journey start time is available
    let conversionDuration: number | undefined;
    if (paymentIntent.metadata?.journey_start_time) {
      try {
        const startTime = new Date(paymentIntent.metadata.journey_start_time);
        const endTime = new Date();
        conversionDuration = endTime.getTime() - startTime.getTime();
      } catch (error) {
        console.warn("Invalid journey_start_time in payment metadata:", error);
      }
    }

    // Story 2.3: Create payment-outcome correlation record
    const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
    
    const correlationResult = await createPaymentCorrelation({
      stripePaymentIntentId: paymentIntent.id,
      clientId: client.id,
      outcomeType: 'paid',
      paymentMetadata: {
        // Core payment data
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
        
        // Existing metadata
        client_token: paymentIntent.metadata?.client_token,
        client_id: paymentIntent.metadata?.client_id,
        journey_id: paymentIntent.metadata?.journey_id,
        
        // Enhanced Story 2.3 metadata
        content_version_id: paymentIntent.metadata?.content_version_id,
        journey_start_time: paymentIntent.metadata?.journey_start_time,
        page_sequence: paymentIntent.metadata?.page_sequence,
        journey_hypothesis: paymentIntent.metadata?.journey_hypothesis,
        page_hypotheses: paymentIntent.metadata?.page_hypotheses,
        referrer: paymentIntent.metadata?.referrer,
        user_agent: paymentIntent.metadata?.user_agent,
        conversion_duration: conversionDuration?.toString(),
      },
      journeyContext: {
        payment_intent_id: paymentIntent.id,
        payment_method_selected: paymentIntent.payment_method_types?.[0],
        amount_paid: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        processing_time: new Date().toISOString(),
        
        // Enhanced journey context
        pages_visited: paymentIntent.metadata?.page_sequence ? JSON.parse(paymentIntent.metadata.page_sequence) : [],
        hypothesis_context: paymentIntent.metadata?.journey_hypothesis,
        attribution: {
          referrer: paymentIntent.metadata?.referrer,
          user_agent: paymentIntent.metadata?.user_agent,
        },
      },
      conversionDuration,
    });

    if (!correlationResult.success) {
      console.error("Failed to create payment correlation:", correlationResult.error);
      // Continue with existing outcome update even if correlation fails
    } else {
      console.log(`Payment correlation created: ${correlationResult.correlationId}`);
    }

    // Update client with payment information and outcome (existing functionality)
    const updates = {
      journey_outcome: "paid",
      outcome_notes: `Payment successful via Stripe. Amount: $${(paymentIntent.amount / 100).toFixed(2)} USD. Payment ID: ${paymentIntent.id}. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
      outcome_timestamp: new Date().toISOString(),
      payment_received: true,
      payment_amount: paymentIntent.amount / 100, // Convert from cents
      payment_timestamp: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", client.id);

    if (error) {
      console.error("Failed to update client after payment:", error);
      return;
    }

    console.log(`Client ${client.id} (${client.token}) marked as paid: $${(paymentIntent.amount / 100).toFixed(2)}`);

    // Optional: Update journey status if journey_id is provided (existing functionality)
    if (journeyId) {
      await supabaseServer
        .from("journey_pages")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: {
            payment_processed: true,
            payment_intent_id: paymentIntent.id,
            amount_paid: paymentIntent.amount / 100,
            correlation_id: correlationResult.correlationId,
          },
        })
        .eq("id", parseInt(journeyId));
    }
  } catch (error) {
    console.error("Error processing successful payment:", error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  const clientToken = paymentIntent.metadata?.client_token;
  const clientId = paymentIntent.metadata?.client_id;

  if (!clientToken && !clientId) {
    console.error("No client identification found in failed payment metadata");
    return;
  }

  try {
    // Find the client
    let client;
    if (clientId) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("id", parseInt(clientId))
        .single();
      client = data;
    } else if (clientToken) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("token", clientToken)
        .single();
      client = data;
    }

    if (!client) {
      console.error("Client not found for failed payment:", { clientId, clientToken });
      return;
    }

    // Calculate conversion duration if journey start time is available
    let conversionDuration: number | undefined;
    if (paymentIntent.metadata?.journey_start_time) {
      try {
        const startTime = new Date(paymentIntent.metadata.journey_start_time);
        const endTime = new Date();
        conversionDuration = endTime.getTime() - startTime.getTime();
      } catch (error) {
        console.warn("Invalid journey_start_time in failed payment metadata:", error);
      }
    }

    // Story 2.3: Create payment failure correlation record
    const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
    
    const correlationResult = await createPaymentCorrelation({
      stripePaymentIntentId: paymentIntent.id,
      clientId: client.id,
      outcomeType: 'failed',
      paymentMetadata: {
        // Core payment data
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        failure_code: paymentIntent.last_payment_error?.code,
        
        // Existing metadata
        client_token: paymentIntent.metadata?.client_token,
        client_id: paymentIntent.metadata?.client_id,
        journey_id: paymentIntent.metadata?.journey_id,
        
        // Enhanced Story 2.3 metadata
        content_version_id: paymentIntent.metadata?.content_version_id,
        journey_start_time: paymentIntent.metadata?.journey_start_time,
        page_sequence: paymentIntent.metadata?.page_sequence,
        journey_hypothesis: paymentIntent.metadata?.journey_hypothesis,
        page_hypotheses: paymentIntent.metadata?.page_hypotheses,
        referrer: paymentIntent.metadata?.referrer,
        user_agent: paymentIntent.metadata?.user_agent,
        conversion_duration: conversionDuration?.toString(),
      },
      journeyContext: {
        payment_intent_id: paymentIntent.id,
        payment_method_attempted: paymentIntent.payment_method_types?.[0],
        amount_attempted: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        failure_timestamp: new Date().toISOString(),
        failure_details: {
          message: paymentIntent.last_payment_error?.message,
          code: paymentIntent.last_payment_error?.code,
          type: paymentIntent.last_payment_error?.type,
        },
        
        // Enhanced journey context
        pages_visited: paymentIntent.metadata?.page_sequence ? JSON.parse(paymentIntent.metadata.page_sequence) : [],
        hypothesis_context: paymentIntent.metadata?.journey_hypothesis,
        attribution: {
          referrer: paymentIntent.metadata?.referrer,
          user_agent: paymentIntent.metadata?.user_agent,
        },
      },
      conversionDuration,
    });

    if (!correlationResult.success) {
      console.error("Failed to create payment failure correlation:", correlationResult.error);
      // Continue with existing outcome update even if correlation fails
    } else {
      console.log(`Payment failure correlation created: ${correlationResult.correlationId}`);
    }

    // Update client with payment failure information (existing functionality enhanced)
    const updates = {
      journey_outcome: "pending", // Keep as pending rather than failed to allow retry
      outcome_notes: `Payment failed via Stripe. Reason: ${paymentIntent.last_payment_error?.message || "Unknown error"}. Payment ID: ${paymentIntent.id}. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
      outcome_timestamp: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", client.id);

    if (error) {
      console.error("Failed to update client after payment failure:", error);
      return;
    }

    console.log(`Client ${client.id} (${client.token}) payment failed, notes updated with correlation tracking`);
  } catch (error) {
    console.error("Error processing failed payment:", error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout session completed:", session.id);

  // Story 3.1: Enhanced checkout session processing with content snapshot
  const clientToken = session.metadata?.client_token;
  const clientId = session.metadata?.client_id;

  if (!clientToken && !clientId) {
    console.error("No client identification found in checkout session metadata");
    return;
  }

  try {
    // Find the client
    let client;
    if (clientId) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("id", parseInt(clientId))
        .single();
      client = data;
    } else if (clientToken) {
      const { data } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("token", clientToken)
        .single();
      client = data;
    }

    if (!client) {
      console.error("Client not found for checkout completion:", { clientId, clientToken });
      return;
    }

    // Calculate conversion duration if journey start time is available
    let conversionDuration: number | undefined;
    if (session.metadata?.journey_start_time) {
      try {
        const startTime = new Date(session.metadata.journey_start_time);
        const endTime = new Date();
        conversionDuration = endTime.getTime() - startTime.getTime();
      } catch (error) {
        console.warn("Invalid journey_start_time in checkout session metadata:", error);
      }
    }

    // Determine outcome type based on payment status
    const outcomeType = session.payment_status === "paid" ? "paid" : 
                       session.payment_status === "unpaid" ? "pending" : "pending";

    // Story 2.3: Create checkout completion correlation record
    const { createPaymentCorrelation } = await import("@/app/actions/correlation-actions");
    
    const correlationResult = await createPaymentCorrelation({
      stripePaymentIntentId: session.payment_intent as string || `checkout_${session.id}`,
      stripeSessionId: session.id,
      clientId: client.id,
      outcomeType,
      paymentMetadata: {
        // Core session data
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        payment_method: session.payment_method_types?.[0] || 'unknown',
        payment_status: session.payment_status,
        session_id: session.id,
        
        // Existing metadata
        client_token: session.metadata?.client_token,
        client_id: session.metadata?.client_id,
        journey_id: session.metadata?.journey_id,
        
        // Enhanced Story 2.3 metadata
        content_version_id: session.metadata?.content_version_id,
        journey_start_time: session.metadata?.journey_start_time,
        page_sequence: session.metadata?.page_sequence,
        journey_hypothesis: session.metadata?.journey_hypothesis,
        page_hypotheses: session.metadata?.page_hypotheses,
        referrer: session.metadata?.referrer,
        user_agent: session.metadata?.user_agent,
        conversion_duration: conversionDuration?.toString(),
      },
      journeyContext: {
        session_id: session.id,
        payment_intent_id: session.payment_intent,
        payment_status: session.payment_status,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        checkout_completion_time: new Date().toISOString(),
        
        // Enhanced journey context for checkout
        pages_visited: session.metadata?.page_sequence ? JSON.parse(session.metadata.page_sequence) : [],
        hypothesis_context: session.metadata?.journey_hypothesis,
        attribution: {
          referrer: session.metadata?.referrer,
          user_agent: session.metadata?.user_agent,
        },
        checkout_details: {
          mode: session.mode,
          success_url: session.success_url,
          cancel_url: session.cancel_url,
        },
      },
      conversionDuration,
    });

    if (!correlationResult.success) {
      console.error("Failed to create checkout completion correlation:", correlationResult.error);
      // Continue with existing outcome update even if correlation fails
    } else {
      console.log(`Checkout completion correlation created: ${correlationResult.correlationId}`);
    }

    // Story 3.1: Update client with enhanced checkout completion tracking
    const updates: any = {
      journey_outcome: session.payment_status === "paid" ? "paid" : "pending",
      outcome_notes: `Checkout completed via Stripe. Session ID: ${session.id}. Status: ${session.payment_status}. ${correlationResult.success ? `Correlation ID: ${correlationResult.correlationId}` : 'Correlation creation failed.'}`,
      outcome_timestamp: new Date().toISOString(),
      payment_session_id: session.id,
      payment_status: session.payment_status,
    };

    if (session.payment_status === "paid" && session.amount_total) {
      updates.payment_received = true;
      updates.payment_amount = session.amount_total / 100; // Convert from cents
      updates.payment_timestamp = new Date().toISOString();
    }

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", client.id);

    if (error) {
      console.error("Failed to update client after checkout completion:", error);
      return;
    }

    console.log(`Client ${client.id} (${client.token}) checkout completed with status: ${session.payment_status} and correlation tracking`);
  } catch (error) {
    console.error("Error processing checkout completion:", error);
  }
}