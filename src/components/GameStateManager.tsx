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
  hp: number; // Homeostasis Points (0-100)
  mp: number; // Motivation Points (0-100)
  tokens: number; // In-app credits
  plan: 'free' | 'pro_monthly' | 'pro_annual';
  dailySessionsUsed: number;
  lastSessionDate: string | null;
  egoStateUsage: { [key: string]: number }; // Session counts per ego state
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
    }
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
    // Get current ego state from appStore
    const currentEgoState = localStorage.getItem('app-store') ? 
      JSON.parse(localStorage.getItem('app-store') || '{}').state?.activeEgoState || 'guardian' : 'guardian';
    
    // XP calculation: floor(durationSec / 60) * baseMultiplier * depthMultiplier
    const baseMultiplier = 10;
    const depthMultiplier = 1 + (user.depth * 0.15);
    const xpGained = Math.floor(duration / 60) * baseMultiplier * depthMultiplier;
    
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
    if (newLevel > user.level) tokenReward += 10; // Level up bonus
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
    switch (feature) {
      case 'unlimited_sessions':
        return user.plan !== 'free';
      case 'hypoxia':
        return user.plan !== 'free';
      case 'premium_voices':
        return user.plan !== 'free';
      case 'custom_outlines':
        return user.plan !== 'free';
      case 'daily_session':
        return user.plan === 'free' ? user.dailySessionsUsed < 1 : true;
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