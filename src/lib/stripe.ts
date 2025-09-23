// Stripe Configuration and Client-side Integration
import { supabase } from './supabase';

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year';
  mode: 'subscription' | 'payment';
}

// Product Configuration
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'mystic-subscription',
    name: 'Mystic Subscription',
    description: 'Unlock your full potential with unlimited sessions, all 15 archetypal guides, and premium features.',
    priceId: import.meta.env.VITE_STRIPE_MYSTIC_PRICE_ID || 'price_1QRockLNNCdK8vdNKQZSWMdP',
    price: 27.00,
    currency: 'usd',
    interval: 'month',
    mode: 'subscription'
  }
];

// Payment Service
export class PaymentService {
  private static instance: PaymentService;
  
  private constructor() {}
  
  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createCheckoutSession(productId: string): Promise<{ url: string; sessionId: string }> {
    const product = STRIPE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: product.priceId,
        success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment-cancelled`,
        mode: product.mode
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { url: data.url, sessionId: data.sessionId };
  }

  async getUserSubscription() {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    
    return data;
  }

  async getSubscriptionStatus(): Promise<'free' | 'active' | 'cancelled' | 'past_due'> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) return 'free';
    
    switch (subscription.subscription_status) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
        return 'past_due';
      case 'canceled':
      case 'incomplete_expired':
      case 'unpaid':
        return 'cancelled';
      default:
        return 'free';
    }
  }

  getProductById(id: string): StripeProduct | undefined {
    return STRIPE_PRODUCTS.find(p => p.id === id);
  }
}

export const paymentService = PaymentService.getInstance();