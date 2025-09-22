import React from 'react';
import EgoStatesRow from '../EgoStatesRow';
import EnhancedWebGLOrb from '../EnhancedWebGLOrb';
import EnhancedActionsBar from '../EnhancedActionsBar';
import { useGameState } from '../GameStateManager';

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
      <div className="relative z-10 flex-1 flex flex-col justify-between pb-20">
        
        {/* Top Section - Ego States */}
        <div className="flex-shrink-0 pt-8 pb-4">
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb (perfectly centered) */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto px-4">
            {/* Left Column - Desktop only */}
            <div className="hidden lg:block">
              {/* Future: Side content */}
            </div>
            
            {/* Center Column - Orb */}
            <div className="flex items-center justify-center">
              <EnhancedWebGLOrb 
                onTap={onOrbTap}
                egoState={selectedEgoState}
                afterglow={user.lastSessionTime !== null}
                level={user.level}
              />
            </div>
            
            {/* Right Column - Desktop only */}
            <div className="hidden lg:block">
              {/* Future: Side content */}
            </div>
          </div>
        </div>

        {/* Bottom Section - Actions Bar */}
        <div className="flex-shrink-0 pb-4">
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