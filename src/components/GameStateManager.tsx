import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface GameState {
  user: UserState;
  updateUserState: (updates: Partial<UserState>) => void;
  completeSession: (sessionType: string, duration: number) => void;
  getOrbState: () => any;
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
  const [user, setUser] = useState<UserState>({
    level: 1,
    experience: 0,
    currentState: 'calm',
    sessionStreak: 0,
    lastSessionTime: null,
    achievements: [],
    orbEnergy: 0.3,
    depth: 1,
    breathing: 'rest'
  });

  // Load saved state
  useEffect(() => {
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
  }, []);

  // Save state changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(user));
  }, [user]);

  const updateUserState = (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const completeSession = (sessionType: string, duration: number) => {
    const xpGained = Math.floor(duration / 60) * 10; // 10 XP per minute
    const newExperience = user.experience + xpGained;
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    setUser(prev => ({
      ...prev,
      experience: newExperience,
      level: newLevel,
      sessionStreak: prev.sessionStreak + 1,
      lastSessionTime: new Date(),
      orbEnergy: Math.min(prev.orbEnergy + 0.1, 1.0),
      achievements: [
        ...prev.achievements,
        ...(newLevel > prev.level ? [`Level ${newLevel} Reached`] : [])
      ]
    }));
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

  return (
    <GameStateContext.Provider value={{
      user,
      updateUserState,
      completeSession,
      getOrbState
    }}>
      {children}
    </GameStateContext.Provider>
  );
};