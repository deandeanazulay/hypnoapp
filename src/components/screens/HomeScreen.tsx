import React from 'react';
import StoriesRow from '../StoriesRow';
import WebGLOrb from '../WebGLOrb';
import EnhancedActionsBar from '../EnhancedActionsBar';
import NavigationTabs from '../NavigationTabs';
import { useGameState } from '../GameStateManager';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
  onOrbTap: () => void;
  onActionSelect: (action: any) => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
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
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        {user.lastSessionTime && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/10 via-black to-orange-950/10" />
        )}
      </div>

      {/* Main Layout - 4 sections */}
      <div className="relative z-10 flex-1 flex flex-col pb-20">
        
        {/* 1. States Row */}
        <div className="flex-shrink-0 pt-4 pb-2">
          <StoriesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* 2. Orb Component (with built-in text) */}
        <div className="flex-1 flex justify-center items-center py-8">
          <WebGLOrb 
            onTap={handleOrbTap}
            egoState={selectedEgoState}
            afterglow={user.lastSessionTime !== null}
            size={Math.min(window.innerWidth * 0.6, 240)}
            selectedGoal={selectedAction}
          />
        </div>

        {/* 3. Actions Bar */}
        <div className="flex-shrink-0 px-4 pb-4">
          <EnhancedActionsBar 
            selectedEgoState={selectedEgoState}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
          />
        </div>
      </div>

      {/* 4. Bottom Tab Bar */}
      <div className="flex-shrink-0">
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
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