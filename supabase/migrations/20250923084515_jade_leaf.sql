/*
  # Complete Libero Supabase Schema Recreation

  This migration recreates the entire database schema for the Libero hypnosis app.

  1. New Tables
     - user_profiles - User game state, progress, and preferences
     - sessions - Individual hypnosis session records  
     - custom_protocols - User-created hypnosis protocols
     - stripe_customers - Stripe customer mappings
     - stripe_subscriptions - Subscription management
     - stripe_orders - One-time payment tracking

  2. Custom Types
     - stripe_subscription_status - Enum for subscription states
     - stripe_order_status - Enum for order states

  3. Functions
     - handle_updated_at() - Auto-update timestamps
     - handle_new_user() - Auto-create user profiles on signup

  4. Security
     - Enable RLS on all tables
     - Comprehensive policies for authenticated users
     - Automatic user profile creation trigger

  5. Views
     - stripe_user_subscriptions - User subscription data view
     - stripe_user_orders - User order data view
*/

-- Drop existing tables and types if they exist (in correct order)
DROP VIEW IF EXISTS public.stripe_user_orders CASCADE;
DROP VIEW IF EXISTS public.stripe_user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.stripe_orders CASCADE;
DROP TABLE IF EXISTS public.stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS public.stripe_customers CASCADE;
DROP TABLE IF EXISTS public.custom_protocols CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TYPE IF EXISTS public.stripe_order_status CASCADE;
DROP TYPE IF EXISTS public.stripe_subscription_status CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create custom types
CREATE TYPE public.stripe_subscription_status AS ENUM (
  'not_started',
  'incomplete', 
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TYPE public.stripe_order_status AS ENUM (
  'pending',
  'completed', 
  'canceled'
);

-- Create utility functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  current_state text NOT NULL DEFAULT 'calm',
  session_streak integer NOT NULL DEFAULT 0,
  last_session_time timestamptz DEFAULT NULL,
  achievements text[] DEFAULT '{}',
  orb_energy real NOT NULL DEFAULT 0.3,
  depth integer NOT NULL DEFAULT 1,
  breathing text NOT NULL DEFAULT 'rest',
  hp integer NOT NULL DEFAULT 80,
  mp integer NOT NULL DEFAULT 60,
  tokens integer NOT NULL DEFAULT 50,
  plan text NOT NULL DEFAULT 'free',
  daily_sessions_used integer NOT NULL DEFAULT 0,
  last_session_date text DEFAULT NULL,
  ego_state_usage jsonb NOT NULL DEFAULT '{}',
  active_ego_state text NOT NULL DEFAULT 'guardian',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ego_state text NOT NULL,
  action text NOT NULL,
  duration integer NOT NULL,
  experience_gained integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT NOW()
);

-- Create custom_protocols table
CREATE TABLE public.custom_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  induction text NOT NULL,
  deepener text NOT NULL,
  goals text[] DEFAULT '{}',
  metaphors text[] DEFAULT '{}',
  duration integer NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create stripe_customers table
CREATE TABLE public.stripe_customers (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create stripe_subscriptions table
CREATE TABLE public.stripe_subscriptions (
  id bigserial PRIMARY KEY,
  customer_id text NOT NULL UNIQUE,
  subscription_id text DEFAULT NULL,
  price_id text DEFAULT NULL,
  current_period_start bigint DEFAULT NULL,
  current_period_end bigint DEFAULT NULL,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text DEFAULT NULL,
  payment_method_last4 text DEFAULT NULL,
  status public.stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create stripe_orders table
CREATE TABLE public.stripe_orders (
  id bigserial PRIMARY KEY,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status public.stripe_order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON public.sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_custom_protocols_user_id ON public.custom_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for sessions
CREATE POLICY "Users can read own sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for custom_protocols
CREATE POLICY "Users can read own protocols" ON public.custom_protocols
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols" ON public.custom_protocols
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols" ON public.custom_protocols
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols" ON public.custom_protocols
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for stripe_customers
CREATE POLICY "Users can view their own customer data" ON public.stripe_customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- RLS Policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data" ON public.stripe_subscriptions
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- RLS Policies for stripe_orders
CREATE POLICY "Users can view their own order data" ON public.stripe_orders
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Create user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    level,
    experience,
    current_state,
    session_streak,
    last_session_time,
    achievements,
    orb_energy,
    depth,
    breathing,
    hp,
    mp,
    tokens,
    plan,
    daily_sessions_used,
    last_session_date,
    ego_state_usage,
    active_ego_state
  ) VALUES (
    NEW.id,
    NEW.email,
    1,
    0,
    'calm',
    0,
    NULL,
    '{}',
    0.3,
    1,
    'rest',
    80,
    60,
    50,
    'free',
    0,
    NULL,
    '{"guardian": 0, "rebel": 0, "healer": 0, "explorer": 0, "mystic": 0, "sage": 0, "child": 0, "performer": 0, "shadow": 0, "builder": 0, "seeker": 0, "lover": 0, "trickster": 0, "warrior": 0, "visionary": 0}',
    'guardian'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_custom_protocols_updated_at
  BEFORE UPDATE ON public.custom_protocols
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create views for Stripe data access
CREATE OR REPLACE VIEW public.stripe_user_subscriptions
WITH (security_invoker = true) AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status AS subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM public.stripe_customers sc
LEFT JOIN public.stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.user_id = auth.uid() AND sc.deleted_at IS NULL AND ss.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.stripe_user_orders
WITH (security_invoker = true) AS
SELECT 
  sc.customer_id,
  so.id AS order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status AS order_status,
  so.created_at AS order_date
FROM public.stripe_customers sc
LEFT JOIN public.stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.user_id = auth.uid() AND sc.deleted_at IS NULL AND so.deleted_at IS NULL;