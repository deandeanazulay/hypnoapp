import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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