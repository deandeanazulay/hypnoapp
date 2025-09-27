import React, { useState } from 'react';
import Orb from '../Orb';
import { EGO_STATES, useAppStore } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
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
    if (import.meta.env.DEV) {
      console.log('[HOME] Authenticated, calling original onOrbTap');
    }
    onOrbTap();
  };

  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      style={{ background: LIBERO_BRAND.colors.midnight }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{ background: LIBERO_BRAND.gradients.brandAura }}
        />
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: LIBERO_BRAND.colors.textMuted
            }}
          />
        ))}
      </div>

      {/* 1. Ego States Carousel - Fixed Height */}
      <div className="flex-shrink-0 h-12 flex items-center justify-center relative z-40 pt-10">
        <EgoStatesCarousel 
          activeEgoState={activeEgoState}
          onEgoStateChange={(egoStateId) => {
            const { setActiveEgoState } = useAppStore.getState();
            setActiveEgoState(egoStateId);
          }}
        />
      </div>

      {/* 2. Main Orb Section - Takes remaining space and centers orb */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative z-30 -mt-50">
        <div className="flex flex-col items-center justify-center ">
          <Orb
            onTap={handleOrbTap}
            egoState={activeEgoState}
            afterglow={true}
            size={420}
            variant="webgl"
          />
          
          {/* Orb Guidance Text - Closer to orb */}
          <div className="text-center max-w-md px-4 -mt-8">
            {/* Current Ego State in Color */}
            <div className="mb-3">
              <span 
                className="text-brand-h2 font-light"
                style={{ color: getEgoColor(activeEgoState).accent }}
              >
                {currentState.name}
              </span>
            </div>
            
            <p 
              className="text-lg font-light mb-2"
              style={{ color: LIBERO_BRAND.colors.textSecondary }}
            >
              Tap to begin your journey
            </p>
            <p 
              className="text-sm"
              style={{ color: LIBERO_BRAND.colors.textMuted }}
            >
              with Libero in {currentState.role} mode
            </p>
            {!isAuthenticated && (
              <p 
                className="text-xs mt-2"
                style={{ color: `${LIBERO_BRAND.colors.liberoTeal}CC` }}
              >
                Sign in to unlock full transformation experience
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 1. Ego States Carousel Component - Perfectly centered
interface EgoStatesCarouselProps {
  activeEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

function EgoStatesCarousel({ activeEgoState, onEgoStateChange }: EgoStatesCarouselProps) {
  return (
    <div className="relative w-full flex justify-center items-center">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      {/* Perfectly centered scrolling container */}
      <div className="flex items-center justify-center space-x-3 px-8 animate-scroll-x">
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
          const isSelected = activeEgoState === state.id;
          const egoColor = getEgoColor(state.id);
          return (
            <div key={`${state.id}-${index}`} className="flex-shrink-0">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${egoColor.bg} border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isSelected ? 'border-white/80 scale-115 opacity-100' : 'border-white/30 opacity-60 hover:opacity-80'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${egoColor.accent}80` : `0 0 10px ${egoColor.accent}40`
                }}
              >
                <span className="text-lg">{state.icon}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}