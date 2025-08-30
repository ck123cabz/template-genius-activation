import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_CONFIG } from '@/lib/stripe';
import { supabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// Disable body parsing for webhook payload verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get the request body as text for signature verification
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_CONFIG.secret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session completion
 * This is the primary event for recording paid outcomes
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const clientId = session.metadata?.client_id;
    const gToken = session.metadata?.g_token;
    const journeyId = session.metadata?.journey_id;
    
    // Support both client_id and g_token identification
    if (!clientId && !gToken) {
      console.error('No client_id or g_token in session metadata:', session.id);
      return;
    }

    console.log(`Processing checkout completion for client ${clientId || gToken}, session: ${session.id}`);

    // Get client data - support both ID and G-token lookup
    let clientQuery = supabase.from('clients').select('*');
    
    if (clientId) {
      clientQuery = clientQuery.eq('id', parseInt(clientId));
    } else if (gToken) {
      clientQuery = clientQuery.eq('g_token', gToken);
    }
    
    const { data: client, error: clientError } = await clientQuery.single();

    if (clientError || !client) {
      console.error('Client not found for webhook:', clientId || gToken, clientError);
      return;
    }

    // Get the journey ID if not provided
    const actualJourneyId = journeyId || client.current_journey_id;
    
    // Freeze journey content at payment time for correlation
    let frozenJourneyContent = null;
    if (actualJourneyId) {
      // Capture all journey pages at the moment of payment
      const { data: journeyPages, error: pagesError } = await supabase
        .from('journey_pages')
        .select('page_type, content, updated_at')
        .eq('journey_id', actualJourneyId)
        .order('page_type');

      if (!pagesError && journeyPages) {
        // Also capture any active hypotheses
        const { data: hypotheses } = await supabase
          .from('content_hypotheses')
          .select('hypothesis, change_type, created_at')
          .eq('journey_id', actualJourneyId)
          .order('created_at', { ascending: false })
          .limit(5);

        frozenJourneyContent = {
          journey_hypothesis: client.journey_hypothesis || client.hypothesis,
          pages: journeyPages,
          recent_hypotheses: hypotheses || [],
          frozen_at: new Date().toISOString(),
          payment_source: session.metadata?.source || 'activation',
        };
      }
    }

    // Calculate journey duration
    const journeyDurationDays = Math.floor(
      (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create outcome record with enhanced data
    const outcomeData = {
      client_id: client.id,
      journey_id: actualJourneyId,
      journey_outcome: 'paid' as const,
      outcome_notes: `Automatic payment confirmation via Stripe webhook. Session: ${session.id}`,
      revenue_amount: (session.amount_total || 0) / 100, // Convert from cents to dollars
      recorded_by: 'stripe_webhook',
      journey_duration_days: journeyDurationDays,
      original_hypothesis: client.journey_hypothesis || client.hypothesis,
      hypothesis_accuracy: 'unknown', // Will be manually reviewed later
      conversion_factors: 'Payment completed via Stripe checkout',
      stripe_payment_id: session.payment_intent as string,
      payment_timestamp: new Date().toISOString(),
      frozen_journey_content: frozenJourneyContent,
      metadata: {
        recorded_from: 'stripe_webhook',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        payment_method_types: session.payment_method_types,
        webhook_processed_at: new Date().toISOString(),
        g_token: client.g_token,
        client_name: client.name,
      },
    };

    // Insert outcome record
    const { data: outcome, error: insertError } = await supabase
      .from('journey_outcomes')
      .insert(outcomeData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert outcome record:', insertError);
      return;
    }

    console.log(`Successfully recorded paid outcome for client ${client.name} (${client.g_token}):`, outcome.id);
    console.log(`Payment amount: $${outcomeData.revenue_amount}, Journey duration: ${journeyDurationDays} days`);

    // Revalidate dashboard to show updated data
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

/**
 * Handle successful payment intent (additional confirmation)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    
    // Additional logging for payment success
    // The main outcome recording is handled by checkout.session.completed
    // This provides additional confirmation and could be used for analytics
    
    const clientId = paymentIntent.metadata?.client_id;
    if (clientId) {
      console.log(`Payment confirmed for client ${clientId}, amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const clientId = paymentIntent.metadata?.client_id;
    
    if (!clientId) {
      console.error('No client_id in payment intent metadata:', paymentIntent.id);
      return;
    }

    console.log(`Payment failed for client ${clientId}, payment intent: ${paymentIntent.id}`);

    // Log the payment failure but don't automatically mark as "ghosted"
    // Failed payments might be retried, so we'll track this separately
    
    // Could add a payment_attempts table or metadata tracking here
    // For now, just log the failure for administrative review

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

// GET method for webhook endpoint verification (if needed)
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint active',
    supported_events: STRIPE_WEBHOOK_CONFIG.events,
  });
}