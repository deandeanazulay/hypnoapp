import React from 'react';
import { Settings, User } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { getEgoColor } from '../../config/theme';

export default function GlobalHUD() {
  const { user } = useGameState();
  const { activeEgoState, openModal } = useAppStore();
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return (
      <div 
        data-hud
        className="global-hud fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => openModal('auth')}
              className="px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all text-sm font-medium"
            >
              Sign In
            </button>
          </div>
          
          <h1 className="text-white text-lg font-light">Libero</h1>
          
          <button 
            onClick={() => openModal('settings')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            <Settings size={16} className="text-white/80" />
          </button>
        </div>
      </div>
    );
  }

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);
  
  // Calculate XP progress
  const xpProgress = (user.experience % 100) / 100;
  const sessionsLeft = user.plan === 'free' ? Math.max(0, 1 - user.daily_sessions_used) : '∞';

  return (
    <div 
      data-hud
      className="global-hud fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-2 py-2"
    >
      <div className="flex items-center justify-between text-xs sm:text-sm">
        {/* Left: Ego State */}
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br border-2 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
              borderColor: egoColor.accent + '80'
            }}
          >
            <span className="text-sm">{egoState.icon}</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-white font-medium">{egoState.name}</div>
            <div className="text-white/60 text-xs">{egoState.role}</div>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Level */}
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 rounded bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <span className="text-teal-400 font-bold text-xs">L{user.level}</span>
            </div>
            <span className="text-white/60 hidden sm:inline">Level</span>
          </div>

          {/* XP Progress */}
          <div className="flex items-center space-x-2">
            <span className="text-orange-400 font-medium">{user.experience % 100}/100 XP</span>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center space-x-1">
            <span className="text-yellow-400 font-medium">{user.session_streak}d</span>
            <span className="text-white/60 hidden sm:inline">streak</span>
          </div>

          {/* Sessions */}
          <div className="flex items-center space-x-1">
            <span className="text-purple-400 font-medium">{user.daily_sessions_used}</span>
            <span className="text-white/60 hidden sm:inline">Sessions</span>
          </div>

          {/* Awards */}
          <div className="flex items-center space-x-1">
            <span className="text-blue-400 font-medium">{user.achievements.length}</span>
            <span className="text-white/60 hidden sm:inline">Awards</span>
          </div>
        </div>

        {/* Right: Tokens & Plan */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-400 font-medium">{user.tokens}</span>
            <span className="text-white/60 hidden sm:inline">tokens</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-green-400 font-medium uppercase">{user.plan}</span>
            <span className="text-white/60 hidden sm:inline">Plan</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-teal-400 font-medium">{sessionsLeft}</span>
            <span className="text-white/60 hidden sm:inline">Left</span>
          </div>
        </div>
      </div>
    </div>
  );
}