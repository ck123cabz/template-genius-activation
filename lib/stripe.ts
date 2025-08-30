import Stripe from 'stripe';

// Initialize Stripe client with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia', // Use latest API version
  typescript: true,
});

export { stripe };

// Stripe webhook configuration
export const STRIPE_WEBHOOK_CONFIG = {
  secret: process.env.STRIPE_WEBHOOK_SECRET!,
  events: [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
  ] as const,
};

// Type for supported webhook events
export type SupportedWebhookEvent = typeof STRIPE_WEBHOOK_CONFIG.events[number];

// Helper function to create payment session with journey metadata
export async function createPaymentSession({
  clientId,
  gToken,
  journeyId,
  amount = 50000, // $500 in cents
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  clientId: number;
  gToken?: string;
  journeyId?: string;
  amount?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: 'Template Genius Activation Fee',
              description: '$500 activation fee (credited towards final placement fee)',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        client_id: clientId.toString(),
        g_token: gToken || '',
        journey_id: journeyId || '',
        source: 'template_genius_activation',
        ...metadata,
      },
    });

    return { session, error: null };
  } catch (error) {
    console.error('Error creating payment session:', error);
    return { session: null, error: error as Error };
  }
}