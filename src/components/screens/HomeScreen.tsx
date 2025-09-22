import React from 'react';
import { Settings } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import EgoStatesRow from '../EgoStatesRow';
import EnhancedWebGLOrb from '../EnhancedWebGLOrb';
import EnhancedActionsBar from '../EnhancedActionsBar';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (state: string) => void;
  onOrbTap: () => void;
  onActionSelect: (action: any) => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function HomeScreen({
  selectedEgoState,
  onEgoStateChange,
  onOrbTap,
  onActionSelect,
  activeTab,
  onTabChange
}: HomeScreenProps) {
  const { userState: user } = useGameState();

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
          <div>
            <div className="text-xs font-medium text-white">Level {user?.level || 1}</div>
            <div className="text-xs text-purple-200">{user?.energy || 100}/100 Energy</div>
          </div>
        </div>
        <button className="rounded-full bg-white/10 p-2 backdrop-blur-sm">
          <Settings className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-col items-center justify-center px-4 pb-20">
        {/* Ego States Row */}
        <div className="mb-4">
          <EgoStatesRow
            selectedState={selectedEgoState}
            onStateChange={onEgoStateChange}
          />
        </div>

        {/* Central Orb */}
        <div className="mb-6">
          <EnhancedWebGLOrb
            size={220}
            egoState={selectedEgoState}
            onTap={onOrbTap}
          />
        </div>

        {/* Actions Bar */}
        <div className="w-full max-w-sm">
          <EnhancedActionsBar
            selectedEgoState={selectedEgoState}
            selectedAction={null}
            onActionSelect={onActionSelect}
          />
        </div>
      </div>
    </div>
  );
}