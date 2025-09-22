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
  const [selectedAction, setSelectedAction] = React.useState<any>(null);

  const { canAccess } = useGameState();

  const handleOrbTap = () => {
    // Check if user can access sessions
    if (!canAccess('daily_session')) {
      // Show upgrade prompt or token spend option
      alert('Daily session limit reached. Upgrade to Pro for unlimited sessions!');
      return;
    }
    // Pass selected action to the session
    if (selectedAction) {
      onActionSelect(selectedAction);
    } else {
      onOrbTap();
    }
  };

  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
    // Visual feedback that action is selected
  };

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        {user.lastSessionTime && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/10 via-black to-orange-950/10" />
        )}
      </div>

      {/* Main Layout - Perfect flexbox distribution */}
      <div className="relative z-10 flex-1 flex flex-col justify-between min-h-0">
        
        {/* Top Section - Ego States */}
        <div className="flex-shrink-0 flex justify-center items-start pt-4">
          <StoriesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb (perfectly centered) */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-6 min-h-0">
          <div className="flex justify-center items-center">
            {/* Main WebGL Orb - responsive sizing */}
            <WebGLOrb 
              onTap={handleOrbTap}
              egoState={selectedEgoState}
              afterglow={user.lastSessionTime !== null}
              size={Math.min(window.innerWidth * 0.6, 240)}
              selectedGoal={selectedAction}
            />
          </div>

          
          {/* Tap to begin text */}
          <div className="flex justify-center items-center">
            {canAccess('daily_session') ? (
              <p className="text-white/60 text-sm text-center">
                Tap to begin with {EGO_STATES.find(s => s.id === selectedEgoState)?.name} Mode
                {selectedAction && (
                  <span className="text-teal-400"> • {selectedAction.name}</span>
                )}
              </p>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <p className="text-orange-400 text-sm">Daily limit reached</p>
                <p className="text-white/40 text-xs">Upgrade to Pro for unlimited sessions</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Action Bar */}
        <div className="flex-shrink-0 flex justify-center items-end pb-20">
          <EnhancedActionsBar 
            selectedEgoState={selectedEgoState}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
          />
        </div>
      </div>

      {/* Achievement notifications - positioned to not interfere */}
      {user.achievements.length > 0 && (
        <div className="absolute top-16 right-4 flex justify-center items-center bg-gradient-to-r from-amber-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-20">
          {user.achievements[user.achievements.length - 1]}
        </div>
      )}
    </div>
  );
}