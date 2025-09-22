import React, { useState } from 'react';
import EgoStatesRow from '../EgoStatesRow';
import EnhancedActionsBar from '../EnhancedActionsBar';
import EnhancedWebGLOrb from '../EnhancedWebGLOrb';
import { useGameState } from '../GameStateManager';
import { Clock, Zap, Target } from 'lucide-react';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
  onOrbTap: () => void;
  onActionSelect: (action: any) => void;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export default function HomeScreen({ 
  selectedEgoState, 
  onEgoStateChange, 
  onOrbTap, 
  onActionSelect,
  activeTab,
  onTabChange 
}: HomeScreenProps) {
  const { user } = useGameState();
  const [selectedAction, setSelectedAction] = useState<any>(null);

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
    setSelectedAction(action);
    onActionSelect(action);
  };

  const handleOrbTap = () => {
    // Pass the selected action configuration to the session
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
      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Ego States Row */}
        <div className="flex-shrink-0 pt-2 sm:pt-4 pb-1">
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb (perfectly centered) */}
        <div className="flex-1 flex items-center justify-center py-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto px-2 sm:px-4">
            {/* Left Column - Desktop only */}
            <div className="hidden lg:block">
              {/* Future: Side content */}
            </div>
            
            {/* Center Column - Orb */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <EnhancedWebGLOrb
                onTap={onOrbTap}
                afterglow={user.lastSessionDate !== null}
                egoState={selectedEgoState}
                size={window.innerWidth < 768 ? Math.min(window.innerWidth * 0.5, 220) : 260}
                enhanced={true}
              />
                
                {/* Session configuration display - moved closer to orb */}
                <div className="mt-2 text-center">
                  <p className="text-teal-400 text-xs font-medium">
                    {selectedEgoState.charAt(0).toUpperCase() + selectedEgoState.slice(1)} Mode
                  </p>
                  {selectedAction && (
                    <p className="text-orange-400 text-xs mt-0.5">
                      {selectedAction.name} ready
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Desktop only */}
            <div className="hidden lg:block">
              {/* Future: Side content */}
            </div>
          </div>
        </div>

        {/* Bottom Section - Actions Bar */}
        <div className="flex-shrink-0 pb-4">
          <div className="text-center mb-3">
            <p className="text-white/40 text-xs">Choose your session type</p>
          </div>
          <EnhancedActionsBar 
            selectedEgoState={selectedEgoState}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
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