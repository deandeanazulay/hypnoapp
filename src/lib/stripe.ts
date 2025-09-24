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
      throw new Error('Product not found');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const response = await fetch(`${baseUrl}/functions/v1/stripe-checkout`, {
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
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { url: data.url };
  }
}

export const paymentService = new PaymentService();