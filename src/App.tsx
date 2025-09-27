import React from 'react';
import { Settings, User, Crown, Coins, TrendingUp, Award, Zap, Target, HelpCircle, BookOpen } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { getEgoColor } from '../../config/theme';

export default function GlobalHUD() {
  const { user } = useGameState();
  const { activeEgoState, openModal, openEgoModal, showToast } = useAppStore();
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
              className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all text-xs font-medium"
            >
              Sign In
            </button>
          </div>
          
          <h1 className="text-white text-lg font-light">Libero</h1>
          
          <div className="flex items-center space-x-2">
            {/* Helper Button */}
            <button
              onClick={() => openModal('documentationHub')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
              title="Help & Documentation"
            >
              <HelpCircle size={16} className="text-white/80" />
            </button>
            {/* <button 
              onClick={() => openModal('chatgptChat')} // Removed as per prompt
              className="w-8 h-8 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 flex items-center justify-center transition-all hover:scale-110" // Removed as per prompt
              title="Test ChatGPT API" // Removed as per prompt
            > */}
            
            <button 
              onClick={() => openModal('settings')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
            >
              <Settings size={16} className="text-white/80" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate XP progress
  const xpProgress = (user.experience % 100) / 100;
  const sessionsLeft = user.plan === 'free' ? Math.max(0, 1 - user.daily_sessions_used) : '∞';
  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  const handleEgoStateClick = () => {
    openEgoModal();
  };

  const handlePlanClick = () => {
    openModal('plan');
  };

  const handleTokensClick = () => {
    openModal('tokens');
  };

  const handleLevelClick = () => {
    const nextLevelXp = (user.level * 100) - user.experience;
    showToast({
      type: 'info',
      message: `Level ${user.level}! ${nextLevelXp} XP needed for next level.`
    });
  };

  const handleStreakClick = () => {
    if (user.session_streak > 0) {
      showToast({
        type: 'success',
        message: `Amazing! ${user.session_streak} day streak. Keep the momentum going!`
      });
    } else {
      showToast({
        type: 'info',
        message: 'Start a session today to begin your transformation streak!'
      });
    }
  };

  const handleAwardsClick = () => {
    if (user.achievements.length > 0) {
      showToast({
        type: 'success',
        message: `You've earned ${user.achievements.length} achievements! View them in your profile.`
      });
    } else {
      showToast({
        type: 'info',
        message: 'Complete sessions to unlock achievements and badges!'
      });
    }
  };
  return (
    <div 
      data-hud
      className="global-hud fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-2 py-2"
    >
      <div className="flex items-center justify-between text-xs sm:text-sm">
        {/* Left: Ego State */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEgoStateClick}
            className="w-8 h-8 rounded-full bg-gradient-to-br border-2 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
              borderColor: egoColor.accent + '80'
            }}
          >
            <span className="text-sm">{egoState.icon}</span>
          </button>
          <div className="hidden sm:block">
            <button 
              onClick={handleEgoStateClick}
              className="text-white font-medium hover:text-white/80 transition-colors text-left"
            >
              {egoState.name}
            </button>
            <div className="text-white/60 text-xs">{egoState.role}</div>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Level */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLevelClick}
              className="w-5 h-5 rounded bg-teal-500/20 border border-teal-500/40 flex items-center justify-center hover:bg-teal-500/30 hover:scale-110 transition-all text-xxs"
            >
              <span className="text-teal-400 font-bold text-xs">L{user.level}</span>
            </button>
            <span className="text-white/60 hidden sm:inline">Level</span>
          </div>

          {/* XP Progress */}
          <button 
            onClick={handleLevelClick}
            className="flex items-center space-x-2 hover:scale-105 transition-all"
          > 
            <span className="text-orange-400 font-medium">{user.experience % 100} XP</span>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </div>
          </button>

          {/* Streak */}
          <button 
            onClick={handleStreakClick}
            className="flex items-center space-x-1 hover:scale-105 transition-all"
          >
            <span className="text-yellow-400 font-medium">{user.session_streak}d</span>
            <span className="text-white/60 hidden sm:inline">streak</span>
          </button>

          {/* Sessions */}
          <div className="flex items-center space-x-1">
            <span className="text-purple-400 font-medium">{user.daily_sessions_used}</span>
            <span className="text-white/60 hidden sm:inline">Sessions</span>
          </div>

          {/* Awards */}
          <button 
            onClick={handleAwardsClick}
            className="flex items-center space-x-1 hover:scale-105 transition-all"
          >
            <span className="text-blue-400 font-medium">{user.achievements.length}</span>
            <span className="text-white/60 hidden sm:inline">Awards</span>
          </button>
        </div>

        {/* Right: Tokens & Plan */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleTokensClick}
            className="flex items-center space-x-1 hover:scale-105 transition-all"
          >
            <span className="text-yellow-400 font-medium">{user.tokens}</span>
            <span className="text-white/60 hidden sm:inline">tokens</span>
          </button>
          
          <button 
            onClick={handlePlanClick}
            className="flex items-center space-x-1 hover:scale-105 transition-all"
          >
            <span className="text-green-400 font-medium uppercase">{user.plan}</span>
            <span className="text-white/60 hidden sm:inline">Plan</span>
          </button>
          
          <div className="flex items-center space-x-1">
            <span className="text-teal-400 font-medium">{sessionsLeft}</span>
            <span className="text-white/60 hidden sm:inline">Left</span>
          </div>
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center space-x-2"> 
          {/* Helper Button */}
          <button
            onClick={() => openModal('documentationHub')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
            title="Help & Documentation"
          >
            <HelpCircle size={16} className="text-white/80" />
          </button>
          
          <button 
            onClick={() => openModal('settings')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            <Settings size={16} className="text-white/80" />
          </button>
        </div>
      </div>
    </div>
  );
}