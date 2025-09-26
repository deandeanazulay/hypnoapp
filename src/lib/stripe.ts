import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../utils/apiErrorHandler';

// Client-side Stripe Configuration
export const STRIPE_PRODUCTS = {
  'mystic-subscription': {
    priceId: 'price_mystic_monthly',
    name: 'Mystic Plan',
    description: 'Unlimited sessions with all archetypal guides',
    mode: 'subscription' as const
  }
};

export class PaymentService {
  async createCheckoutSession(productKey: string) {
    const product = STRIPE_PRODUCTS[productKey as keyof typeof STRIPE_PRODUCTS];
    if (!product) {
      throw new ApiError(
        'Product not found',
        400,
        'PRODUCT_NOT_FOUND',
        `Product key: ${productKey}`,
        'Use a valid product key'
      );
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ApiError(
        'Payment service not configured',
        500,
        'MISSING_CONFIG',
        'Supabase URL or API key missing',
        'Contact support for assistance'
      );
    }

    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    try {
      const response = await safeFetch(
        `${baseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: product.priceId,
            success_url: `${window.location.origin}/payment-success`,
            cancel_url: `${window.location.origin}/payment-cancelled`,
            mode: product.mode
          })
        },
        {
          operation: 'Create Checkout Session',
          additionalContext: {
            productKey,
            priceId: product.priceId,
            mode: product.mode
          }
        }
      );

      const data = await response.json();
      
      if (!data.url) {
        throw new ApiError(
          'Invalid checkout response',
          500,
          'INVALID_RESPONSE',
          'No checkout URL returned',
          'Try again or contact support'
        );
      }

      return { url: data.url };
      
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'Failed to create checkout session',
        500,
        'CHECKOUT_FAILED',
        error.message,
        'Try again or contact support'
      );
    }
  }
}

export const paymentService = new PaymentService();