import React, { useState } from 'react';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight } from 'lucide-react';
import Orb from '../Orb';
import { EGO_STATES, useAppStore } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { useGameState } from '../GameStateManager';
import { TabId } from '../../types/Navigation';
import { THEME, getEgoColor, LIBERO_BRAND } from '../../config/theme';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
  activeTab?: TabId;
  onShowAuth: () => void;
}

export default function HomeScreen({ 
  onOrbTap, 
  onTabChange,
  selectedEgoState,
  onEgoStateChange,
  activeTab,
  onShowAuth
}: HomeScreenProps) {
  const { activeEgoState } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { user } = useGameState();
  const { customActions } = useProtocolStore();
  
  const currentState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  // Handle orb tap with authentication check
  const handleOrbTap = () => {
    if (import.meta.env.DEV) {
      console.log('[HOME] Orb tapped, isAuthenticated:', isAuthenticated);
    }
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[HOME] Not authenticated, showing auth modal');
      }
      onShowAuth();
      return;
    }
    onOrbTap();
  };

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>
        {/* Tagline */}
        <div className="text-center mb-6">
          <h2 className="text-white text-lg font-light mb-1">
            Enter with Libero in {currentState.name}
          </h2>
          <p className="text-white/70 text-xs">Tap to begin with Libero</p>
        </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-2" >
        {/* Center Orb */}
        <div className="mb-3">
          <Orb 
            onTap={handleOrbTap}
            egoState={currentState.id}
            size={window.innerWidth < 768 ? 180 : 240}
            variant="webgl"
            afterglow={false}
          />
        </div>

        {/* Tagline - Closer to orb */}
        <div className="text-center mb-3">
        <div className="grid grid-cols-2 gap-2 max-w-xs w-full mb-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              // TODO: Start quick session
            }}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl rounded-lg p-2 border border-teal-500/30 hover:border-teal-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-1">
              <Zap size={12} className="text-teal-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Quick Session</h3>
            <p className="text-white/70 text-xs">5-10 minute transformation</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('explore');
            }}
            className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-lg p-2 border border-purple-500/30 hover:border-purple-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-1">
              <Target size={12} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Deep Journey</h3>
            <p className="text-white/70 text-xs">15-30 minute protocols</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('create');
            }}
            className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-lg p-2 border border-orange-500/30 hover:border-orange-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-1">
              <Sparkles size={12} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Custom</h3>
            <p className="text-white/70 text-xs">Create your own protocol</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('chat');
            }}
            className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg p-2 border border-rose-500/30 hover:border-rose-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-1">
              <Heart size={12} className="text-rose-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Chat</h3>
            <p className="text-white/70 text-xs">Talk with Libero</p>
          </button>
        </div>

        {/* Current State Display */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              // Open ego states modal
              useAppStore.getState().openModal('egoStates');
            }}
            className="flex items-center space-x-2 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-lg p-2 border border-white/20 hover:border-white/30 hover:scale-105 transition-all"
          >
            <div className="text-lg">{currentState.icon}</div>
            <div className="text-left">
              <div className="text-white font-semibold text-xs">{currentState.name}</div>
  )
}