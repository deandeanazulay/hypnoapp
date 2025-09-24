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

      {/* 1. Ego States Carousel */}
      <div className="flex-shrink-0 py-3 relative z-40">
        <EgoStatesCarousel 
          activeEgoState={activeEgoState}
          onEgoStateChange={(egoStateId) => {
            const { setActiveEgoState } = useAppStore.getState();
            setActiveEgoState(egoStateId);
          }}
        />
      </div>

      {/* 2. Orb Section */}
      <div className="flex-1 flex items-center justify-center relative z-30 px-4">
        <OrbSection 
          onOrbTap={onOrbTap}
          egoState={activeEgoState}
        />
      </div>

      {/* 3. Text Section */}
      <div className="flex-shrink-0 py-4 relative z-20">
        <TextSection 
          currentState={currentState}
          selectedAction={selectedAction}
        />
      </div>

      {/* 4. Actions Bar */}
      <div className="flex-shrink-0 pb-2 px-4 relative z-10">
        <ActionsBar 
          selectedAction={selectedAction}
          onActionSelect={onActionSelect}
          onNavigateToCreate={() => onTabChange('create')}
        />
      </div>
    </div>
  );
}

// 1. Ego States Carousel Component
interface EgoStatesCarouselProps {
  activeEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

function EgoStatesCarousel({ activeEgoState, onEgoStateChange }: EgoStatesCarouselProps) {
  return (
    <div className="relative overflow-hidden w-full flex justify-center items-center">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center space-x-2 px-4 animate-scroll-x">
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
          const isSelected = activeEgoState === state.id;
          const egoColor = getEgoColor(state.id);
          return (
            <div key={`${state.id}-${index}`} className="flex-shrink-0">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${egoColor.bg} border-2 flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                  isSelected ? 'border-white/60 scale-110 opacity-100' : 'border-white/20 opacity-50'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${egoColor.accent}80` : `0 0 10px ${egoColor.accent}40`
                }}
              >
                <span className="text-sm">{state.icon}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Orb Section Component
interface OrbSectionProps {
  onOrbTap: () => void;
  egoState: string;
}

function OrbSection({ onOrbTap, egoState }: OrbSectionProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center justify-center w-80 h-80">
        <Orb
          onTap={onOrbTap}
          afterglow={false}
          egoState={egoState}
          size={320}
          variant="webgl"
        />
      </div>
    </div>
  );
}

// 3. Text Section Component
interface TextSectionProps {
  currentState: any;
  selectedAction: any;
}

function TextSection({ currentState, selectedAction }: TextSectionProps) {
  return (
    <div className="text-center px-4">
      <h2 className="text-white text-xl font-light mb-2">
        {currentState.name} Mode
      </h2>
      <p className="text-white/70 text-sm mb-1">
        {selectedAction ? `${selectedAction.name} ready` : 'Select action & tap orb'}
      </p>
      <p className="text-white/50 text-xs">
        Choose session type
      </p>
    </div>
  );
}