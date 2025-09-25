import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useSimpleAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AUTH] Initial session check:', { session, error });
      setState({
        user: session?.user ?? null,
        loading: false,
        error: error?.message ?? null
      });
    }).catch((err) => {
      console.error('[AUTH] Error getting initial session:', err);
      setState({
        user: null,
        loading: false,
        error: 'Failed to initialize auth'
      });
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AUTH] Auth state changed:', { session });
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
        error: null
      }));
      
      // Trigger profile creation/fetch when user signs in
      if (session?.user && _event === 'SIGNED_IN') {
        console.log('[AUTH] User signed in, profile will be fetched by GameStateManager');
      }
    });

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
    }
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
    }
    return { error }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}