import React, { useState } from 'react';
import ActionsBar from '../ActionsBar';
import Orb from '../Orb';
import { EGO_STATES, useAppStore } from '../../store';
import { TabId } from '../../types/Navigation';
import { THEME, getEgoColor } from '../../config/theme';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  selectedAction: any;
  onActionSelect: (action: any) => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
  activeTab?: TabId;
}

export default function HomeScreen({ 
  onOrbTap, 
  onTabChange,
  selectedAction,
  onActionSelect,
  selectedEgoState,
  onEgoStateChange,
  activeTab
}: HomeScreenProps) {
  const { activeEgoState } = useAppStore();
  
  const currentState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/10 to-teal-950/10" />
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* 1. Ego States Carousel - Fixed Height */}
      <div className="flex-shrink-0 h-12 flex items-center justify-center relative z-40">
        <EgoStatesCarousel 
          activeEgoState={activeEgoState}
          onEgoStateChange={(egoStateId) => {
            const { setActiveEgoState } = useAppStore.getState();
            setActiveEgoState(egoStateId);
          }}
        />
      </div>

      {/* 2. Main Orb Section - Takes remaining space and centers orb */}
      <div className="flex-1 min-h-0 relative z-30">
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <Orb
            onTap={onOrbTap}
            afterglow={false}
            egoState={activeEgoState}
            size={380}
            variant="webgl"
            className="mx-auto"
          />
        </div>
      </div>

      {/* 3. Actions Bar - Fixed at bottom with proper spacing */}
      <div className="flex-shrink-0 px-4 relative z-40 -mt-20">
        <ActionsBar 
          selectedAction={selectedAction}
          onActionSelect={onActionSelect}
          onNavigateToCreate={() => onTabChange('create')}
        />
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
    <div className="relative overflow-hidden w-full flex justify-center items-center">
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