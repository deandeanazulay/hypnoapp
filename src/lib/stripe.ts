import { safeFetch, ApiError } from '../utils/apiErrorHandler';

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
    
    const origin = this.resolveOrigin();

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
            success_url: `${origin}/payment-success`,
            cancel_url: `${origin}/payment-cancelled`,
            mode: product.mode
          })
        },
        {
          operation: 'Create Checkout Session',
          additionalContext: {
            productKey,
            priceId: product.priceId,
            mode: product.mode,
            origin
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

  private resolveOrigin(): string {
    const envCandidates = [
      import.meta.env.VITE_PUBLIC_APP_ORIGIN,
      import.meta.env.VITE_PUBLIC_SITE_URL,
      import.meta.env.VITE_APP_ORIGIN,
      import.meta.env.VITE_APP_URL,
      import.meta.env.VITE_SITE_URL,
      import.meta.env.VITE_VERCEL_URL ? `https://${import.meta.env.VITE_VERCEL_URL}` : undefined,
    ];

    const fallbackOrigin = envCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    const rawOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : fallbackOrigin;

    if (!rawOrigin) {
      throw new ApiError(
        'Unable to determine application origin',
        500,
        'ORIGIN_UNAVAILABLE',
        'No browser origin available and no fallback origin configured',
        'Configure the application origin and try again'
      );
    }

    const originWithProtocol = rawOrigin.startsWith('http://') || rawOrigin.startsWith('https://')
      ? rawOrigin
      : `https://${rawOrigin}`;

    try {
      const url = new URL(originWithProtocol);
      return url.origin;
    } catch (error) {
      throw new ApiError(
        'Invalid application origin configuration',
        500,
        'INVALID_ORIGIN',
        error instanceof Error ? error.message : 'Origin could not be parsed as a valid URL',
        'Update the application origin configuration and try again'
      );
    }
  }
}

export const paymentService = new PaymentService();
