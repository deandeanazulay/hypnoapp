import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import type { UserProfile } from '../lib/supabase';

interface GameState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (updates: Partial<UserProfile>) => void;
  addExperience: (amount: number) => void;
  incrementStreak: () => void;
  updateEgoStateUsage: (state: string) => void;
  setActiveEgoState: (state: string) => void;
  refetchUser: () => Promise<void>;
}

const GameStateContext = createContext<GameState | undefined>(undefined);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser, isAuthenticated } = useSimpleAuth();

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] Fetching user profile for ID:', userId);
      }
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User profile doesn't exist, create it
          if (import.meta.env.DEV) {
            console.log('[GAME_STATE] User profile not found, creating new profile');
          }
          await createUserProfile(userId);
          return;
        } else {
          console.error('[GAME_STATE] Error fetching user profile:', error);
          setError('Failed to load user profile');
          setIsLoading(false);
          return;
        }
      }

      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] User profile fetched successfully:', data);
      }
      setUser(data);
      setIsLoading(false);
    } catch (err) {
      console.error('[GAME_STATE] Unexpected error fetching user profile:', err);
      setError('Unexpected error loading profile');
      setIsLoading(false);
    }
  };

  // Create new user profile
  const createUserProfile = async (userId: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] Creating user profile for ID:', userId);
      }
      
      const newProfile: Partial<UserProfile> = {
        id: userId,
        email: authUser?.email || null,
        level: 1,
        experience: 0,
        current_state: 'calm',
        session_streak: 0,
        last_session_time: null,
        achievements: [],
        orb_energy: 0.3,
        depth: 1,
        breathing: 'rest',
        hp: 80,
        mp: 60,
        tokens: 50,
        plan: 'free',
        daily_sessions_used: 0,
        last_session_date: null,
        ego_state_usage: {},
        active_ego_state: 'guardian'
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('[GAME_STATE] Error creating user profile:', error);
        setError('Failed to create user profile');
        setIsLoading(false);
        return;
      }

      console.log('[GAME_STATE] User profile created successfully:', data);
      setUser(data);
      setIsLoading(false);
    } catch (err) {
      console.error('[GAME_STATE] Unexpected error creating user profile:', err);
      setError('Failed to initialize profile');
      setIsLoading(false);
    }
  };

  // Load user profile when authenticated user changes
  useEffect(() => {
    if (isAuthenticated && authUser?.id) {
      fetchUserProfile(authUser.id);
    } else {
      // Clear user data when not authenticated
      setUser(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, authUser?.id]);

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user || !authUser?.id) return;
    
    try {
      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] Updating user profile:', updates);
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) {
        console.error('[GAME_STATE] Error updating user profile:', error);
        setError('Failed to update profile');
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] User profile updated successfully:', data);
      }
      setUser(data);
    } catch (err) {
      console.error('[GAME_STATE] Unexpected error updating user profile:', err);
      setError('Failed to save changes');
    }
  };

  const addExperience = async (amount: number) => {
    if (!user) return;

    const newExperience = user.experience + amount;
    const newLevel = Math.floor(newExperience / 100) + 1;

    await updateUser({
      experience: newExperience,
      level: newLevel
    });
  };

  const incrementStreak = async () => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastSessionDate = user.last_session_date;
    
    // Only increment if it's a new day
    if (lastSessionDate === today) {
      if (import.meta.env.DEV) {
        console.log('[GAME_STATE] Session already completed today, not incrementing streak');
      }
      return;
    }

    await updateUser({
      session_streak: user.session_streak + 1,
      last_session_time: new Date().toISOString(),
      last_session_date: today
    });
  };

  const updateEgoStateUsage = async (state: string) => {
    if (!user) return;

    const currentUsage = user.ego_state_usage[state] || 0;
    await updateUser({
      ego_state_usage: {
        ...user.ego_state_usage,
        [state]: currentUsage + 1
      }
    });
  };

  const setActiveEgoState = async (state: string) => {
    await updateUser({
      active_ego_state: state
    });
  };

  const refetchUser = async () => {
    if (authUser?.id) {
      await fetchUserProfile(authUser.id);
    }
  };

  const value: GameState = {
    user,
    isLoading,
    error,
    updateUser,
    addExperience,
    incrementStreak,
    updateEgoStateUsage,
    setActiveEgoState,
    refetchUser
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}