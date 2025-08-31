import Stripe from "stripe";

// Initialize Stripe only if environment variable is available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
}) : null;

export { stripe };

/**
 * Story 2.3: Payment Metadata Correlation System
 * 
 * Creates payment intent with client and journey metadata for automatic correlation
 */
export async function createPaymentIntentWithMetadata(
  amount: number, // in cents
  currency: string = "usd",
  clientId: number,
  clientToken: string,
  journeyId?: number,
  pageType?: string
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error("Stripe not configured - check STRIPE_SECRET_KEY environment variable");
  }

  const metadata: Record<string, string> = {
    client_id: clientId.toString(),
    client_token: clientToken,
    journey_type: "template_genius_activation",
    created_at: new Date().toISOString(),
  };

  if (journeyId) {
    metadata.journey_id = journeyId.toString();
  }

  if (pageType) {
    metadata.page_type = pageType;
  }

  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    description: `Template Genius activation fee for ${clientToken}`,
  });
}

/**
 * Creates Stripe checkout session with client metadata
 */
export async function createCheckoutSessionWithMetadata(
  priceData: {
    amount: number; // in cents
    currency: string;
    productName: string;
    description?: string;
  },
  clientId: number,
  clientToken: string,
  successUrl: string,
  cancelUrl: string,
  journeyId?: number
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe not configured - check STRIPE_SECRET_KEY environment variable");
  }

  const metadata: Record<string, string> = {
    client_id: clientId.toString(),
    client_token: clientToken,
    journey_type: "template_genius_activation",
    created_at: new Date().toISOString(),
  };

  if (journeyId) {
    metadata.journey_id = journeyId.toString();
  }

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: priceData.currency,
          product_data: {
            name: priceData.productName,
            description: priceData.description,
          },
          unit_amount: priceData.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    customer_email: undefined, // Will be filled by Stripe Checkout
  });
}

/**
 * Retrieves payment information for a client
 */
export async function getClientPaymentHistory(
  clientId: string,
  clientToken: string
): Promise<Stripe.PaymentIntent[]> {
  if (!stripe) {
    throw new Error("Stripe not configured - check STRIPE_SECRET_KEY environment variable");
  }

  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  return paymentIntents.data.filter(
    (pi) =>
      pi.metadata.client_id === clientId || pi.metadata.client_token === clientToken
  );
}

/**
 * Webhook signature verification utility
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe not configured - check STRIPE_SECRET_KEY environment variable");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * Extract client information from Stripe payment metadata
 */
export function extractClientMetadata(
  stripeObject: Stripe.PaymentIntent | Stripe.Checkout.Session
): {
  clientId?: number;
  clientToken?: string;
  journeyId?: number;
  pageType?: string;
} {
  const metadata = stripeObject.metadata;
  
  return {
    clientId: metadata.client_id ? parseInt(metadata.client_id) : undefined,
    clientToken: metadata.client_token || undefined,
    journeyId: metadata.journey_id ? parseInt(metadata.journey_id) : undefined,
    pageType: metadata.page_type || undefined,
  };
}

/**
 * Format amount for display (converts cents to dollars)
 */
export function formatAmount(amountInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

/**
 * Convert dollars to cents for Stripe API
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}