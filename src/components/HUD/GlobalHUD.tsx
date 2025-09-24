import React from 'react';
import { Settings, User, LogIn } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useGameState } from '../GameStateManager';
import { useAppStore } from '../../store';

interface GlobalHUDProps {
  onShowAuth: () => void;
}

export default function GlobalHUD({ onShowAuth }: GlobalHUDProps) {
  const { isAuthenticated, user } = useAuth();
  const { user: gameUser } = useGameState();
  const { openModal } = useAppStore();

  const handleSettingsClick = () => {
    openModal('settings');
  };

  return (
    <div 
      data-hud
      className="global-hud w-full bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between relative z-50"
    >
      {/* Left Side - User Info or Sign In */}
      <div className="flex items-center space-x-3">
        {isAuthenticated && gameUser ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center border border-teal-400/30">
              <span className="text-black text-sm font-bold">L{gameUser.level}</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white text-sm font-medium">Level {gameUser.level}</div>
              <div className="text-teal-400 text-xs">{gameUser.experience} XP</div>
            </div>
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
          >
            <LogIn size={16} />
            <span className="text-sm font-medium">Sign In</span>
          </button>
        )}
      </div>

      {/* Center - App Title */}
      <div className="flex-1 text-center">
        <h1 className="text-white text-lg font-light bg-gradient-to-r from-white via-teal-400 to-purple-400 bg-clip-text text-transparent">
          Libero
        </h1>
        <p className="text-white/50 text-xs hidden sm:block">The Hypnotist That Frees Minds</p>
      </div>

      {/* Right Side - Settings */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleSettingsClick}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
        >
          <Settings size={16} className="text-white/80" />
        </button>
      </div>
    </div>
  );
}