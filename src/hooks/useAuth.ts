import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          user: session?.user ?? null, 
          session,
          loading: false 
        }))
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
        error: null
      }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {}
      }
    })

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
      return { error }
    }

    // Ensure profile exists after successful signup
    try {
      await supabase.rpc('ensure_profile')
    } catch (profileError) {
      console.log('Profile creation handled by backend:', profileError)
      // Don't fail signup if profile creation has issues
    }
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
      return { error }
    }

    // Ensure profile exists after successful signin
    try {
      await supabase.rpc('ensure_profile')
    } catch (profileError) {
      console.log('Profile creation handled by backend:', profileError)
      // Don't fail signin if profile creation has issues
    }
    return { error: null }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
    }
    
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    return { error }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!authState.user
  }
}