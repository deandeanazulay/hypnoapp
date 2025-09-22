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
  const { userState } = useGameState();
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
    if (!userState.stats.lastSessionDate) return null;
    
    const lastSession = new Date(userState.stats.lastSessionDate);
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

  const lastSessionText = getLastSessionText();

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        {userState.stats.lastSessionDate && (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/10 via-black to-orange-950/10" />
        )}
      </div>

      {/* Main Layout - Perfect vertical distribution */}
      <div className="relative z-50 flex-1 flex flex-col justify-between pb-20">
        
        {/* Top Section - Header */}
        <div className="flex-shrink-0 pt-12 pb-4 px-6">
          <div className="text-center">
            <h1 className="text-white text-2xl font-light mb-2">{getGreeting()}</h1>
            {lastSessionText && (
              <p className="text-teal-400/80 text-sm mb-2">{lastSessionText}</p>
            )}
            <div className="flex items-center justify-center space-x-4 text-white/60 text-sm">
              <div className="flex items-center space-x-1">
                <Target size={14} />
                <span>Level {userState.level}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={14} />
                <span>{userState.stats.streakDays}d streak</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{userState.completedSessions} sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ego States Row */}
        <div className="flex-shrink-0 pb-4">
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
                afterglow={userState.stats.lastSessionDate !== null}
                egoState={selectedEgoState}
                size={280}
                enhanced={true}
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
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
          />
        </div>
      </div>

      {/* Achievement notifications */}
      {userState.achievements.length > 0 && (
        <div className="absolute top-20 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-20">
          {userState.achievements[userState.achievements.length - 1]}
        </div>
      )}
    </div>
  );
}