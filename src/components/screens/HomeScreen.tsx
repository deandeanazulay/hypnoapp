import React from 'react';
import { useGameState } from '../GameStateManager';
import { EgoStatesRow } from '../EgoStatesRow';
import { EnhancedActionsBar } from '../EnhancedActionsBar';
import { EnhancedWebGLOrb } from '../EnhancedWebGLOrb';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (state: string) => void;
  onOrbTap: () => void;
  onActionSelect: (action: any) => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedEgoState,
  onEgoStateChange,
  onOrbTap,
  onActionSelect,
  activeTab,
  onTabChange
}) => {
  const { user, updateUserState } = useGameState();

  const handleOrbTap = () => {
    // Update last session time
    updateUserState({
      stats: {
        ...user.stats,
        lastSessionDate: new Date().toISOString()
      }
    });
    onOrbTap();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getLastSessionText = () => {
    if (!user.stats.lastSessionDate) {
      return 'Welcome! Ready for your first session?';
    }
    
    const lastSession = new Date(user.stats.lastSessionDate);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Welcome back! Just finished a session.';
    if (diffHours < 24) return `Welcome back! Last session was ${diffHours} hours ago.`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Welcome back! Last session was ${diffDays} days ago.`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-12 pb-6">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-gray-400 text-sm">
            {getLastSessionText()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Orb */}
        <div className="mb-8">
          <EnhancedWebGLOrb
            egoState={selectedEgoState}
            isActive={true}
            onTap={handleOrbTap}
            size={200}
          />
        </div>

        {/* Ego States */}
        <div className="w-full mb-8">
          <EgoStatesRow
            selectedState={selectedEgoState}
            onStateChange={onEgoStateChange}
          />
        </div>

        {/* Actions Bar */}
        <div className="w-full">
          <EnhancedActionsBar
            selectedEgoState={selectedEgoState}
            onActionSelect={onActionSelect}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="flex-shrink-0 px-6 pb-6">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Level {user.level}</span>
          <span>{user.experience} XP</span>
          <span>Sessions: {user.stats.totalSessions}</span>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;