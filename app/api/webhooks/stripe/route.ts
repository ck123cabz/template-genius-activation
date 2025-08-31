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

    // Update client with payment information and outcome
    const updates = {
      journey_outcome: "paid",
      outcome_notes: `Payment successful via Stripe. Amount: $${(paymentIntent.amount / 100).toFixed(2)} USD. Payment ID: ${paymentIntent.id}`,
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

    // Optional: Update journey status if journey_id is provided
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

    // Update client with payment failure information
    const updates = {
      outcome_notes: `Payment failed via Stripe. Reason: ${paymentIntent.last_payment_error?.message || "Unknown error"}. Payment ID: ${paymentIntent.id}`,
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

    console.log(`Client ${client.id} (${client.token}) payment failed, notes updated`);
  } catch (error) {
    console.error("Error processing failed payment:", error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout session completed:", session.id);

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

    // Update client with checkout completion
    const updates = {
      journey_outcome: session.payment_status === "paid" ? "paid" : "pending",
      outcome_notes: `Checkout completed via Stripe. Session ID: ${session.id}. Status: ${session.payment_status}`,
      outcome_timestamp: new Date().toISOString(),
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

    console.log(`Client ${client.id} (${client.token}) checkout completed with status: ${session.payment_status}`);
  } catch (error) {
    console.error("Error processing checkout completion:", error);
  }
}