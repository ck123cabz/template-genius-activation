/**
 * Payment utilities for secure handling of payment identifiers
 * Implements proper masking for production security
 */

/**
 * Masks sensitive payment session IDs for display in UI
 * In production, only shows first 8 and last 4 characters with masking
 * In development, shows more characters for debugging
 */
export function maskPaymentSessionId(sessionId: string | null | undefined): string {
  if (!sessionId) return 'N/A';
  
  // Determine if we're in production or development
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (sessionId.length < 12) {
    // For short IDs, mask everything except first 4 characters
    return sessionId.substring(0, 4) + '*'.repeat(sessionId.length - 4);
  }
  
  if (isProduction) {
    // Production: Show first 8 chars, mask middle, show last 4
    const start = sessionId.substring(0, 8);
    const end = sessionId.substring(sessionId.length - 4);
    const maskedLength = Math.max(4, sessionId.length - 12);
    return `${start}${'*'.repeat(maskedLength)}${end}`;
  } else {
    // Development: Show more for debugging (first 20 chars + ...)
    return sessionId.length > 20 
      ? `${sessionId.substring(0, 20)}...`
      : sessionId;
  }
}

/**
 * Masks Stripe payment intent IDs for display
 */
export function maskPaymentIntentId(paymentIntentId: string | null | undefined): string {
  if (!paymentIntentId) return 'N/A';
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Stripe payment intents typically start with 'pi_'
  if (paymentIntentId.startsWith('pi_')) {
    if (isProduction) {
      // Show 'pi_' + first 6 chars + mask + last 4 chars
      const prefix = 'pi_';
      const afterPrefix = paymentIntentId.substring(3);
      
      if (afterPrefix.length <= 10) {
        return prefix + afterPrefix.substring(0, 4) + '*'.repeat(afterPrefix.length - 4);
      }
      
      const start = afterPrefix.substring(0, 6);
      const end = afterPrefix.substring(afterPrefix.length - 4);
      const maskedLength = Math.max(4, afterPrefix.length - 10);
      return `${prefix}${start}${'*'.repeat(maskedLength)}${end}`;
    } else {
      // Development: Show first 15 chars
      return paymentIntentId.length > 15 
        ? `${paymentIntentId.substring(0, 15)}...`
        : paymentIntentId;
    }
  }
  
  // For non-standard payment IDs, use generic masking
  return maskPaymentSessionId(paymentIntentId);
}

/**
 * Masks customer IDs for display
 */
export function maskCustomerId(customerId: string | null | undefined): string {
  if (!customerId) return 'N/A';
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Stripe customer IDs typically start with 'cus_'
  if (customerId.startsWith('cus_')) {
    if (isProduction) {
      // Show 'cus_' + first 4 chars + mask
      const prefix = 'cus_';
      const afterPrefix = customerId.substring(4);
      return prefix + afterPrefix.substring(0, 4) + '*'.repeat(Math.max(4, afterPrefix.length - 4));
    } else {
      return customerId.length > 12 
        ? `${customerId.substring(0, 12)}...`
        : customerId;
    }
  }
  
  // For non-standard customer IDs, use generic masking
  return maskPaymentSessionId(customerId);
}

/**
 * Gets a display-safe version of any payment-related identifier
 */
export function safeDisplayId(id: string | null | undefined, type: 'session' | 'payment' | 'customer' = 'session'): string {
  switch (type) {
    case 'payment':
      return maskPaymentIntentId(id);
    case 'customer':
      return maskCustomerId(id);
    case 'session':
    default:
      return maskPaymentSessionId(id);
  }
}

/**
 * Determines if an ID should be copyable in the current environment
 * In production, sensitive IDs should not be copyable
 */
export function isIdCopyable(id: string | null | undefined): boolean {
  if (!id) return false;
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, don't allow copying of sensitive payment identifiers
  if (isProduction) {
    return false;
  }
  
  // In development, allow copying for debugging
  return true;
}