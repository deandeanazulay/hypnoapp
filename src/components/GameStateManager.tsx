import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User state interface
export interface UserState {
  level: number;
  experience: number;
  hp: number;
  mp: number;
  completedSessions: number;
  favoriteActions: string[];
  unlockedEgoStates: string[];
  achievements: string[];
  stats: {
    totalMinutes: number;
    streakDays: number;
    lastSessionDate?: string;
  };
}

// Game state context interface
interface GameStateContextType {
  userState: UserState;
  updateUserState: (updates: Partial<UserState>) => void;
  getOrbState: (egoState: string) => {
    color: string;
    intensity: number;
    unlocked: boolean;
  };
  canAccess: (feature: string) => boolean;
  addExperience: (amount: number) => void;
  completeSession: (sessionData: any) => void;
}

// Default user state
const defaultUserState: UserState = {
  level: 1,
  experience: 50,
  hp: 85,
  mp: 92,
  completedSessions: 12,
  favoriteActions: ['stress-relief', 'focus', 'creative'],
  unlockedEgoStates: ['guardian', 'healer', 'explorer', 'mystic'],
  achievements: ['first-session', 'week-streak', 'explorer'],
  stats: {
    totalMinutes: 240,
    streakDays: 5,
    lastSessionDate: new Date().toISOString().split('T')[0]
  }
};

// Create context
const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// Provider component
export function GameStateProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('userState');
      return saved ? JSON.parse(saved) : defaultUserState;
    } catch (error) {
      console.warn('Failed to load saved state - using defaults');
      return defaultUserState;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('userState', JSON.stringify(userState));
    } catch (error) {
      console.warn('Failed to save state to localStorage');
    }
  }, [userState]);

  const updateUserState = (updates: Partial<UserState>) => {
    setUserState(prev => ({ ...prev, ...updates }));
  };

  const getOrbState = (egoState: string) => {
    const isUnlocked = userState.unlockedEgoStates.includes(egoState);
    
    const orbConfigs = {
      guardian: { color: '#3B82F6', intensity: 0.8 },
      healer: { color: '#10B981', intensity: 0.7 },
      explorer: { color: '#F59E0B', intensity: 0.9 },
      mystic: { color: '#8B5CF6', intensity: 0.85 },
      sage: { color: '#6B7280', intensity: 0.6 },
      rebel: { color: '#EF4444', intensity: 0.95 },
      performer: { color: '#EC4899', intensity: 0.8 },
      shadow: { color: '#1F2937', intensity: 0.5 },
      child: { color: '#F97316', intensity: 0.9 }
    };

    return {
      ...orbConfigs[egoState as keyof typeof orbConfigs] || orbConfigs.guardian,
      unlocked: isUnlocked
    };
  };

  const canAccess = (feature: string) => {
    const requirements = {
      'advanced-sessions': userState.level >= 3,
      'custom-protocols': userState.level >= 5,
      'voice-commands': userState.completedSessions >= 5,
      'ai-insights': userState.level >= 2
    };

    return requirements[feature as keyof typeof requirements] ?? true;
  };

  const addExperience = (amount: number) => {
    setUserState(prev => {
      const newExp = prev.experience + amount;
      const newLevel = Math.floor(newExp / 100) + 1;
      
      return {
        ...prev,
        experience: newExp,
        level: Math.max(prev.level, newLevel)
      };
    });
  };

  const completeSession = (sessionData: any) => {
    setUserState(prev => ({
      ...prev,
      completedSessions: prev.completedSessions + 1,
      stats: {
        ...prev.stats,
        totalMinutes: prev.stats.totalMinutes + (sessionData.duration || 10),
        lastSessionDate: new Date().toISOString().split('T')[0]
      }
    }));
    
    // Add experience based on session
    addExperience(sessionData.duration || 10);
  };

  const contextValue: GameStateContextType = {
    userState,
    updateUserState,
    getOrbState,
    canAccess,
    addExperience,
    completeSession
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}

// Hook to use game state
export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}