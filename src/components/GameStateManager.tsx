import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { paymentService } from '../lib/stripe';
import { useUIStore } from '../state/uiStore';

interface UserState {
  level: number;
  experience: number;
  currentState: 'calm' | 'focused' | 'stressed' | 'deep' | 'transcendent';
  sessionStreak: number;
  lastSessionTime: Date | null;
  achievements: string[];
  orbEnergy: number; // 0-1
  depth: number; // 1-5
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  hp: number; // Homeostasis Points (0-100)
  mp: number; // Motivation Points (0-100)
  tokens: number; // In-app credits
  plan: 'free' | 'pro_monthly' | 'pro_annual';
  dailySessionsUsed: number;
  lastSessionDate: string | null;
  egoStateUsage: { [key: string]: number }; // Session counts per ego state
  subscriptionStatus: 'free' | 'active' | 'cancelled' | 'past_due';
}

interface GameState {
  user: UserState;
  updateUserState: (updates: Partial<UserState>) => void;
  completeSession: (sessionType: string, duration: number) => void;
  getOrbState: () => any;
  canAccess: (feature: string) => boolean;
  spendTokens: (amount: number, feature: string) => boolean;
}

const GameStateContext = createContext<GameState | null>(null);

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
};

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserState>({
    level: 1,
    experience: 0,
    currentState: 'calm',
    sessionStreak: 0,
    lastSessionTime: null,
    achievements: [],
    orbEnergy: 0.3,
    depth: 1,
    breathing: 'rest',
    hp: 80,
    mp: 60,
    tokens: 50,
    plan: 'free',
    dailySessionsUsed: 0,
    lastSessionDate: null,
    egoStateUsage: {
      guardian: 15,
      rebel: 8,
      healer: 22,
      explorer: 12,
      mystic: 18,
      sage: 10,
      child: 14,
      performer: 9,
      shadow: 6,
      builder: 11,
      seeker: 7,
      lover: 13,
      trickster: 4,
      warrior: 9,
      visionary: 5
    },
    subscriptionStatus: 'free'
  });

  // Load saved state
  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated && authUser) {
      // Load from Supabase
      loadUserProfile();
    } else {
      // Load from localStorage for non-authenticated users
      const saved = localStorage.getItem('gameState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(prev => ({
            ...prev,
            ...parsed,
            lastSessionTime: parsed.lastSessionTime ? new Date(parsed.lastSessionTime) : null
          }));
        } catch (e) {
          console.log('Failed to load saved state');
        }
      }
    }
  }, [isAuthenticated, authUser, authLoading]);

  const loadUserProfile = async () => {
    if (!authUser) return;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await createUserProfile();
      } else {
        console.error('Error loading user profile:', error);
      }
      return;
    }

    if (profile) {
      setUser({
        level: profile.level,
        experience: profile.experience,
        currentState: profile.current_state,
        sessionStreak: profile.session_streak,
        lastSessionTime: profile.last_session_time ? new Date(profile.last_session_time) : null,
        achievements: profile.achievements,
        orbEnergy: profile.orb_energy,
        depth: profile.depth,
        breathing: profile.breathing,
        hp: profile.hp,
        mp: profile.mp,
        tokens: profile.tokens,
        plan: profile.plan,
        dailySessionsUsed: profile.daily_sessions_used,
        lastSessionDate: profile.last_session_date,
        egoStateUsage: profile.ego_state_usage,
        subscriptionStatus: 'free' // Will be updated by subscription status check
      });
      
      // Load subscription status
      const subscriptionStatus = await paymentService.getSubscriptionStatus();
      setUser(prev => ({ ...prev, subscriptionStatus }));
    }
  };

  const createUserProfile = async () => {
    if (!authUser) return;

    // First check if profile already exists to avoid conflicts
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      // Profile already exists, just load it
      await loadUserProfile();
      return;
    }

    const defaultProfile: Partial<UserProfile> = {
      id: authUser.id,
      email: authUser.email || authUser.user_metadata?.email || '',
      level: 1,
      experience: 0,
      current_state: 'calm',
      session_streak: 0,
      achievements: [],
      orb_energy: 0.3,
      depth: 1,
      breathing: 'rest',
      hp: 80,
      mp: 60,
      tokens: 50,
      plan: 'free',
      daily_sessions_used: 0,
      ego_state_usage: {
        guardian: 0,
        rebel: 0,
        healer: 0,
        explorer: 0,
        mystic: 0,
        sage: 0,
        child: 0,
        performer: 0,
        shadow: 0,
        builder: 0,
        seeker: 0,
        lover: 0,
        trickster: 0,
        warrior: 0,
        visionary: 0
      },
      active_ego_state: 'guardian',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([defaultProfile])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If it's a unique constraint violation, profile already exists
      if (error.code === '23505') {
        await loadUserProfile();
      } else {
        // For other errors, still try to load in case profile was created
        await loadUserProfile();
      }
    } else {
      await loadUserProfile();
    }
  };

  // Save state changes
  useEffect(() => {
    if (isAuthenticated && authUser) {
      // Save to Supabase
      saveUserProfile();
    } else {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('gameState', JSON.stringify(user));
    }
  }, [user, isAuthenticated, authUser]);

  const saveUserProfile = async () => {
    if (!authUser) return;

    const profileData: Partial<UserProfile> = {
      level: user.level,
      experience: user.experience,
      current_state: user.currentState,
      session_streak: user.sessionStreak,
      last_session_time: user.lastSessionTime?.toISOString() || null,
      achievements: user.achievements,
      orb_energy: user.orbEnergy,
      depth: user.depth,
      breathing: user.breathing,
      hp: user.hp,
      mp: user.mp,
      tokens: user.tokens,
      plan: user.plan,
      daily_sessions_used: user.dailySessionsUsed,
      last_session_date: user.lastSessionDate,
      ego_state_usage: user.egoStateUsage,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', authUser.id);

    if (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const updateUserState = (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const completeSession = (sessionType: string, duration: number) => {
    const { showToast } = useUIStore.getState();
    // Get current ego state from appStore
    const currentEgoState = localStorage.getItem('app-store') ? 
      JSON.parse(localStorage.getItem('app-store') || '{}').state?.activeEgoState || 'guardian' : 'guardian';

    // XP calculation: floor(durationSec / 60) * baseMultiplier * depthMultiplier
    const baseMultiplier = 10;
    const depthMultiplier = 1 + (user.depth * 0.15);
    const xpGained = Math.floor(duration / 60) * baseMultiplier * depthMultiplier;

    // Save session to database if authenticated
    if (isAuthenticated && authUser) {
      saveSessionToDatabase(currentEgoState, sessionType, duration, xpGained);
    }
    
    const newExperience = user.experience + xpGained;
    // Level: floor(0.1 * sqrt(totalXP)) + 1 (smooth, slow growth)
    const newLevel = Math.floor(0.1 * Math.sqrt(newExperience)) + 1;
    
    // HP/MP updates
    const hpDelta = duration >= 300 ? 1 : 0; // +1 HP for sessions ≥5min
    const mpDelta = duration >= 900 ? 1 : 0; // +1 MP for sessions ≥15min
    
    // Streak calculation (calendar-day based)
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const lastSessionDate = user.lastSessionDate;
    
    let newStreak = user.sessionStreak;
    if (!lastSessionDate || lastSessionDate === yesterday) {
      newStreak = user.sessionStreak + 1;
    } else if (lastSessionDate !== today) {
      newStreak = 1; // Reset streak if gap > 1 day
    }
    
    // Token rewards
    let tokenReward = 0;
    if (newLevel > user.level) {
      tokenReward += 10; // Level up bonus
      // Level up notification
      showToast({
        type: 'success',
        message: `🎉 Level Up! You've reached Level ${newLevel}`,
        duration: 4000
      });
    }
    if (newStreak > 0 && newStreak % 7 === 0) tokenReward += 25; // Weekly streak bonus
    
    setUser(prev => ({
      ...prev,
      experience: newExperience,
      level: newLevel,
      sessionStreak: newStreak,
      lastSessionTime: new Date(),
      lastSessionDate: today,
      hp: Math.min(prev.hp + hpDelta, 100),
      mp: Math.min(prev.mp + mpDelta, 100),
      tokens: prev.tokens + tokenReward,
      dailySessionsUsed: prev.lastSessionDate === today ? prev.dailySessionsUsed + 1 : 1,
      orbEnergy: Math.min(prev.orbEnergy + 0.1, 1.0),
      egoStateUsage: {
        ...prev.egoStateUsage,
        [currentEgoState]: (prev.egoStateUsage[currentEgoState] || 0) + 1
      },
      achievements: [
        ...prev.achievements,
        ...(newLevel > prev.level ? [`Level ${newLevel} Reached`] : [])
      ]
    }));
    
    // Success notification for session completion
    showToast({
      type: 'success', 
      message: `Session complete! +${Math.floor(xpGained)} XP earned`,
      duration: 3000
    });
  };

  const saveSessionToDatabase = async (egoState: string, sessionType: string, duration: number, xpGained: number) => {
    if (!authUser) return;

    const { error } = await supabase
      .from('sessions')
      .insert([{
        user_id: authUser.id,
        ego_state: egoState,
        action: sessionType,
        duration: duration,
        experience_gained: xpGained,
        completed_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error saving session:', error);
    }
  };

  const getOrbState = () => ({
    depth: user.depth,
    breathing: user.breathing,
    phase: user.currentState,
    isListening: false,
    isSpeaking: false,
    emotion: user.currentState,
    energy: user.orbEnergy
  });

  const canAccess = (feature: string) => {
    // Check subscription status for premium features
    if (user.subscriptionStatus === 'active') {
      return true;
    }
    
    switch (feature) {
      case 'unlimited_sessions':
        return user.subscriptionStatus === 'active';
      case 'hypoxia':
        return user.subscriptionStatus === 'active';
      case 'premium_voices':
        return user.subscriptionStatus === 'active';
      case 'custom_outlines':
        return user.subscriptionStatus === 'active';
      case 'daily_session':
        return user.subscriptionStatus === 'active' ? true : user.dailySessionsUsed < 1;
      default:
        return true;
    }
  };

  const spendTokens = (amount: number, feature: string) => {
    if (user.tokens >= amount) {
      setUser(prev => ({ ...prev, tokens: prev.tokens - amount }));
      return true;
    }
    return false;
  };

  return (
    <GameStateContext.Provider value={{
      user,
      updateUserState,
      completeSession,
      getOrbState,
      canAccess,
      spendTokens
    }}>
      {children}
    </GameStateContext.Provider>
  );
};