/**
 * Stripe Configuration for Template Genius Revenue Intelligence Engine
 * Story 3.1: Stripe Checkout Integration with Journey Metadata
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Environment validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

// Validate environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.warn(
    `Missing Stripe environment variables: ${missingEnvVars.join(', ')}. ` +
    'Payment functionality will be disabled.'
  );
}

/**
 * Server-side Stripe instance
 * Only available on server with proper secret key
 */
let stripeServerInstance: any = null;

if (typeof window === 'undefined' && requiredEnvVars.STRIPE_SECRET_KEY) {
  // Dynamically import Stripe for server-side only
  import('stripe').then(({ default: Stripe }) => {
    stripeServerInstance = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-09-30.acacia',
      typescript: true,
    });
  }).catch(error => {
    console.error('Failed to initialize server-side Stripe:', error);
  });
}

/**
 * Get server-side Stripe instance
 * Used in server actions and API routes
 */
export const getStripe = (): any => {
  if (typeof window !== 'undefined') {
    throw new Error('Server-side Stripe instance cannot be used on client');
  }
  
  if (!stripeServerInstance) {
    if (!requiredEnvVars.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    // Synchronous import for server-side usage
    const Stripe = require('stripe');
    stripeServerInstance = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
      typescript: true,
    });
  }
  
  return stripeServerInstance;
};

/**
 * Client-side Stripe promise
 * Lazy-loaded for optimal performance
 */
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get client-side Stripe instance
 * Used in components for checkout redirection
 */
export const getStripeJS = (): Promise<Stripe | null> => {
  if (typeof window === 'undefined') {
    throw new Error('Client-side Stripe instance cannot be used on server');
  }

  if (!stripePromise) {
    if (!requiredEnvVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(requiredEnvVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  
  return stripePromise;
};

/**
 * Stripe configuration interface
 */
export interface StripeConfig {
  publishableKey: string;
  appearance: {
    theme: 'stripe' | 'night' | 'flat';
    variables: {
      colorPrimary: string;
      colorBackground: string;
      colorText: string;
      colorDanger: string;
      fontFamily: string;
      spacingUnit: string;
      borderRadius: string;
    };
  };
  clientSecret?: string;
}

/**
 * Template Genius branded Stripe configuration
 * Maintains consistent branding across payment flows
 */
export const getStripeConfig = (): StripeConfig => {
  return {
    publishableKey: requiredEnvVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb', // Template Genius blue
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };
};

/**
 * Webhook signature validation
 * Used in webhook endpoints for security
 */
export const validateWebhookSignature = (
  body: string | Buffer,
  signature: string
): any => {
  if (!requiredEnvVars.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }

  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    requiredEnvVars.STRIPE_WEBHOOK_SECRET
  );
};

/**
 * Environment configuration helper
 */
export const isStripeConfigured = (): boolean => {
  return Boolean(
    requiredEnvVars.STRIPE_SECRET_KEY &&
    requiredEnvVars.STRIPE_WEBHOOK_SECRET &&
    requiredEnvVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
};

/**
 * Payment amount constants
 */
export const PAYMENT_AMOUNTS = {
  ACTIVATION_FEE: 50000, // $500.00 in cents
} as const;

/**
 * Success/cancel URL generators
 */
export const getPaymentUrls = (clientId: string, baseUrl?: string) => {
  const base = baseUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  return {
    success_url: `${base}/confirmation?client=${clientId}&payment=success`,
    cancel_url: `${base}/journey/retry?client=${clientId}&payment=cancelled`,
  };
};

/**
 * Type definitions for enhanced type safety
 */
export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status: 'paid' | 'unpaid';
  metadata: Record<string, string>;
};

export type PaymentResult = {
  success: boolean;
  sessionId?: string;
  sessionUrl?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};