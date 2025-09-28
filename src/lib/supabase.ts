import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. App will run in offline mode.')
  // Create a mock client that returns empty results instead of failing
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'OFFLINE' } }) }) }),
      insert: () => Promise.resolve({ data: null, error: { code: 'OFFLINE' } }),
      update: () => ({ eq: () => Promise.resolve({ error: { code: 'OFFLINE' } }) }),
      upsert: () => Promise.resolve({ error: { code: 'OFFLINE' } })
    })
  };
  // Export mock client instead of throwing
  supabase = mockClient as any;
} else {
  // Ensure URL has protocol to prevent 'Failed to fetch' errors
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Database Types
export interface UserProfile {
  id: string
  email: string
  created_at: string
  updated_at: string
  level: number
  experience: number
  current_state: 'calm' | 'focused' | 'stressed' | 'deep' | 'transcendent'
  session_streak: number
  last_session_time: string | null
  achievements: string[]
  orb_energy: number
  depth: number
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest'
  hp: number
  mp: number
  tokens: number
  plan: 'free' | 'pro_monthly' | 'pro_annual'
  daily_sessions_used: number
  last_session_date: string | null
  ego_state_usage: Record<string, number>
  active_ego_state: string
}

export interface CustomProtocol {
  id: string
  user_id: string
  name: string
  induction: string
  deepener: string
  goals: string[]
  metaphors: string[]
  duration: number
  script?: any
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  ego_state: string
  action: string
  duration: number
  completed_at: string
  experience_gained: number
}