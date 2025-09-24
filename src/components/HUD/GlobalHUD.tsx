import React from 'react';
import { Settings, User } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useGameState } from '../GameStateManager';
import { useAppStore } from '../../store';

interface GlobalHUDProps {
  onShowAuth: () => void;
}

export default function GlobalHUD({ onShowAuth }: GlobalHUDProps) {
  const { isAuthenticated } = useAuth();
  const { user, isLoading } = useGameState();
  const { openModal } = useAppStore();

  if (isLoading) {
    return (
      <div data-hud className="bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
          <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
          <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div data-hud className="bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left: User Info or Sign In */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 border border-teal-400/30 flex items-center justify-center">
                <span className="text-teal-400 text-sm font-bold">L{user.level}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white/80 text-sm font-medium">Level {user.level}</div>
                <div className="text-white/50 text-xs">{user.experience} XP</div>
              </div>
            </>
          ) : (
            <button
              onClick={onShowAuth}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Center: App Title */}
        <div className="text-center">
          <h1 className="text-white font-light text-lg tracking-wide">Libero</h1>
          <p className="text-white/40 text-xs">The Hypnotist That Frees Minds</p>
        </div>

        {/* Right: Settings */}
        <button
          onClick={() => openModal('settings')}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <Settings size={16} className="text-white/70" />
        </button>
      </div>
    </div>
  );
}