import React, { useState } from 'react';
import { User, Settings, Award, TrendingUp, Calendar, Target } from 'lucide-react';
import { useGameState } from '../components/GameStateManager';
import { EGO_STATES } from '../types/EgoState';
import EgoStatesRow from '../components/EgoStatesRow';
import SettingsModal from '../components/SettingsModal';

interface ProfileProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function Profile({ selectedEgoState, onEgoStateChange }: ProfileProps) {
  const { user } = useGameState();
  const [showSettings, setShowSettings] = useState(false);

  // Mock data for ego state usage
  const egoStateUsage = {
    guardian: 15,
    rebel: 8,
    healer: 22,
    explorer: 12,
    mystic: 18,
    sage: 10,
    child: 14,
    performer: 9,
    shadow: 6
  };

  const totalSessions = Object.values(egoStateUsage).reduce((sum, count) => sum + count, 0);

  const getUsagePercentage = (count: number) => {
    return totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
  };

  const getMostUsedEgoState = () => {
    const maxUsage = Math.max(...Object.values(egoStateUsage));
    const mostUsedId = Object.entries(egoStateUsage).find(([_, count]) => count === maxUsage)?.[0];
    return EGO_STATES.find(state => state.id === mostUsedId);
  };

  const mostUsedState = getMostUsedEgoState();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-white text-xl font-light truncate">Profile</h1>
          <p className="text-white/60 text-xs truncate">Your transformation journey</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
        >
          <Settings size={16} className="text-white" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-3">
        <div className="flex flex-col h-full gap-3">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
              <TrendingUp size={20} className="text-teal-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.level}</div>
              <div className="text-white/60 text-xs">Level</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
              <Calendar size={20} className="text-orange-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-xs">Streak</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
              <Target size={20} className="text-purple-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-xs">Sessions</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
              <Award size={20} className="text-yellow-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-xs">Awards</div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium text-sm">Level Progress</h3>
              <span className="text-teal-400 text-xs font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
          </div>

          {/* Ego State Selection */}
          <div className="flex-shrink-0">
            <div className="mb-2">
              <h3 className="text-white font-medium text-sm mb-1">Current Ego State</h3>
              <p className="text-white/60 text-xs">Choose your inner guide</p>
            </div>
            <EgoStatesRow 
              selectedEgoState={selectedEgoState}
              onEgoStateChange={onEgoStateChange}
            />
          </div>

          {/* Ego State Usage - Scrollable */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex-1 min-h-0 overflow-hidden">
            <h3 className="text-white font-medium mb-3 text-sm">Usage Analytics</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-lg p-2 mb-3 border border-white/20`}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{mostUsedState.icon}</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">Most Used: {mostUsedState.name}</h4>
                    <p className="text-white/70 text-xs">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Breakdown - Scrollable */}
            <div className="space-y-2 overflow-y-auto max-h-32">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-sm">{state.icon}</span>
                      <div className="min-w-0">
                        <span className="text-white text-xs font-medium truncate block">{state.name}</span>
                        <div className="text-white/50 text-xs">{usage} sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${state.color.replace('from-', 'from-').replace('to-', 'to-')} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-xs w-6 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}