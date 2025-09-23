import React, { useState } from 'react';
import EgoStatesRow from '../EgoStatesRow';
import ActionsBar from '../ActionsBar';
import WebGLOrb from '../WebGLOrb';
import { useGameState } from '../GameStateManager';
import { Clock, Zap, Target } from 'lucide-react';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
  onOrbTap: () => void;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  selectedAction: any;
  onActionSelect: (action: any) => void;
}

export default function HomeScreen({ 
  selectedEgoState, 
  onEgoStateChange, 
  onOrbTap, 
  activeTab,
  onTabChange,
  selectedAction,
  onActionSelect
}: HomeScreenProps) {
  const { user } = useGameState();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format last session time
  const getLastSessionText = () => {
    if (!user.lastSessionDate) return null;
    
    const lastSession = new Date(user.lastSessionDate);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Last session: Just now';
    if (diffInHours < 24) return `Last session: ${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Last session: Yesterday';
    if (diffInDays < 7) return `Last session: ${diffInDays}d ago`;
    
    return 'Last session: Over a week ago';
  };

  const handleActionSelect = (action: any) => {
    onActionSelect(action);
  };

  const handleOrbTap = () => {
    // Start session with selected action (if any) and ego state
    onOrbTap();
  };
  const lastSessionText = getLastSessionText();

  return (
    <div className="h-full bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        {user.lastSessionDate && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/10 via-black to-orange-950/10" />
        )}
      </div>

      {/* Main Layout - Perfect vertical distribution */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Ego States Row */}
        <div className="flex-shrink-0 pt-1 pb-1">
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb Supreme (god of the app - never cut off) */}
        <div className="flex-1 flex items-center justify-center min-h-0 relative z-20 px-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center max-w-none">
              {/* Orb Container - Sacred Space */}
              <div 
                className="relative z-30 p-6" 
                style={{ 
                  minHeight: Math.max(320, window.innerHeight * 0.4),
                  minWidth: Math.max(320, window.innerWidth * 0.6),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <WebGLOrb
                  onTap={onOrbTap}
                  afterglow={user.lastSessionDate !== null}
                  egoState={selectedEgoState}
                  size={Math.min(
                    Math.max(240, window.innerWidth * 0.45), 
                    Math.max(280, window.innerHeight * 0.35),
                    320
                  )}
                />
              </div>
                
              {/* Session configuration display - always visible */}
              <div className="mt-4 text-center relative z-20 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-teal-400 text-sm font-medium">
                  {selectedEgoState.charAt(0).toUpperCase() + selectedEgoState.slice(1)} Mode
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
        <div className="flex-shrink-0 pb-2">
          <div className="text-center mb-2">
            <p className="text-white/40 text-xs">Choose session type</p>
          </div>
          <ActionsBar 
            selectedEgoState={selectedEgoState}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
            onNavigateToCreate={() => onTabChange('create')}
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