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
  const { activeEgoState, openModal } = useAppStore();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const currentState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  const handleActionSelect = (action: any) => {
    onActionSelect(action);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  return (
    <div 
      className="h-full relative overflow-hidden flex flex-col"
      onMouseMove={handleMouseMove}
      style={{ background: '#000' }}
    >
      {/* Cosmic Space Background */}
      <div className="absolute inset-0">
        {/* Black Hole Event Horizon */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Static Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Static gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/10 to-teal-950/10" />
          
          {/* Static accent dots */}
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
      </div>

      {/* Main Layout - Perfect vertical distribution */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Simplified Ego States Row */}
        <div className="flex-shrink-0 py-1">
          <div className="relative overflow-hidden w-full flex justify-center items-center py-2">
            <div className="flex items-center space-x-2 px-4 animate-scroll-x">
              {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
                const isSelected = activeEgoState === state.id;
                const egoColor = getEgoColor(state.id);
                return (
                  <div key={`${state.id}-${index}`} className="flex-shrink-0">
                    <button
                      onClick={() => useAppStore.getState().setActiveEgoState(state.id)}
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
        </div>

        {/* Center Section - Orb Supreme */}
        <div className="flex-1 flex items-center justify-center min-h-0 relative z-20 px-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center max-w-none">
              {/* Orb Container - Sacred Space */}
              <div 
                className="relative z-30 flex items-center justify-center" 
                style={{ 
                  width: window.innerWidth < 768 ? '450px' : '540px',
                  height: window.innerWidth < 768 ? '450px' : '540px'
                }}
              >
                <Orb
                  onTap={onOrbTap}
                  afterglow={false}
                  egoState={activeEgoState}
                  size={window.innerWidth < 768 ? 450 : 540}
                  variant="webgl"
                />
              </div>
                
              {/* Session configuration display - always visible */}
              <div className="mt-3 text-center relative z-20 bg-black/40 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 shadow-lg">
                <p className="text-teal-400 text-sm font-medium">
                  {currentState.name} Mode
                </p>
                {selectedAction && (
                  <p className="text-orange-400 text-sm font-medium">
                    {selectedAction.name} ready
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  {selectedAction ? 'Tap orb to begin' : 'Select action & tap orb'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Actions Bar */}
        <div className="flex-shrink-0 pb-2 px-4">
          <div className="text-center mb-2">
            <p className="text-white/50 text-xs font-medium">Choose session type</p>
          </div>
          <ActionsBar 
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
            onNavigateToCreate={() => onTabChange('create')}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40%); }
        }
        .animate-scroll-x {
          animation: scroll-x 30s linear infinite;
        }
        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}