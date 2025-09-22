import React from 'react';
import StoriesRow from '../StoriesRow';
import WebGLOrb from '../WebGLOrb';
import EnhancedActionsBar from '../EnhancedActionsBar';
import { useGameState } from '../GameStateManager';
import { EGO_STATES } from '../../types/EgoState';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
  onOrbTap: () => void;
  onActionSelect: (action: any) => void;
}

export default function HomeScreen({ 
  selectedEgoState, 
  onEgoStateChange, 
  onOrbTap, 
  onActionSelect 
}: HomeScreenProps) {
  const { user } = useGameState();

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        {user.lastSessionTime && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/10 via-black to-orange-950/10" />
        )}
      </div>

      {/* Main Layout - Perfect vertical distribution */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Top Section - Ego States */}
        <div className="flex-shrink-0 pt-8 pb-4">
          <StoriesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb (perfectly centered) */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            {/* Main WebGL Orb - using the hypno portal orb */}
            <WebGLOrb 
              onTap={onOrbTap}
              egoState={selectedEgoState}
              afterglow={user.lastSessionTime !== null}
              size={280}
            />
            
            {/* Single tap to begin text */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Tap to begin with {EGO_STATES.find(s => s.id === selectedEgoState)?.name} Mode
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Actions Bar positioned above bottom nav */}
        <div className="flex-shrink-0 pb-20">
          <EnhancedActionsBar 
            selectedEgoState={selectedEgoState}
            onActionSelect={onActionSelect}
          />
        </div>
      </div>

      {/* Achievement notifications */}
      {user.achievements.length > 0 && (
        <div className="absolute top-20 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-20">
          {user.achievements[user.achievements.length - 1]}
        </div>
      )}
    </div>
  );
}