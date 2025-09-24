import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProfile {
  id: string;
  email: string | null;
  level: number;
  experience: number;
  current_state: string;
  session_streak: number;
  last_session_time: string | null;
  achievements: string[];
  orb_energy: number;
  depth: number;
  breathing: string;
  hp: number;
  mp: number;
  tokens: number;
  plan: string;
  daily_sessions_used: number;
  last_session_date: string | null;
  ego_state_usage: Record<string, number>;
  active_ego_state: string;
  created_at: string;
  updated_at: string;
}

interface GameState {
  user: UserProfile | null;
  isLoading: boolean;
  updateUser: (updates: Partial<UserProfile>) => void;
  addExperience: (amount: number) => void;
  incrementStreak: () => void;
  updateEgoStateUsage: (state: string) => void;
  setActiveEgoState: (state: string) => void;
}

const GameStateContext = createContext<GameState | undefined>(undefined);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock user data
    const mockUser: UserProfile = {
      id: 'mock-user-id',
      email: 'user@example.com',
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
      ego_state_usage: {
        guardian: 0,
        rebel: 0,
        mystic: 0,
        lover: 0,
        builder: 0,
        seeker: 0,
        trickster: 0,
        warrior: 0,
        visionary: 0
      },
      active_ego_state: 'guardian',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 100);
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    setUser(prev => prev ? {
      ...prev,
      ...updates,
      updated_at: new Date().toISOString()
    } : null);
  };

  const addExperience = (amount: number) => {
    if (!user) return;

    const newExperience = user.experience + amount;
    const newLevel = Math.floor(newExperience / 100) + 1;

    updateUser({
      experience: newExperience,
      level: newLevel
    });
  };

  const incrementStreak = () => {
    if (!user) return;

    updateUser({
      session_streak: user.session_streak + 1,
      last_session_time: new Date().toISOString(),
      last_session_date: new Date().toDateString()
    });
  };

  const updateEgoStateUsage = (state: string) => {
    if (!user) return;

    const currentUsage = user.ego_state_usage[state] || 0;
    updateUser({
      ego_state_usage: {
        ...user.ego_state_usage,
        [state]: currentUsage + 1
      }
    });
  };

  const setActiveEgoState = (state: string) => {
    updateUser({
      active_ego_state: state
    });
  };

  const value: GameState = {
    user,
    isLoading,
    updateUser,
    addExperience,
    incrementStreak,
    updateEgoStateUsage,
    setActiveEgoState
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