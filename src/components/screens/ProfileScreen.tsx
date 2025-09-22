import React from 'react';
import { User, Settings, Award, TrendingUp, Calendar, Target } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { EGO_STATES } from '../../types/EgoState';
import EgoStatesRow from '../EgoStatesRow';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
        <div className="flex-shrink-0 pt-4 pb-2 px-4">
  const { user } = useGameState();

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
    <div className="h-full bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-6 pb-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-light mb-1">Profile</h1>
              <p className="text-white/60 text-xs">Your transformation journey</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
              <Settings size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-4 mb-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 text-center">
              <TrendingUp size={16} className="text-teal-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.level}</div>
              <div className="text-white/60 text-xs">Level</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 text-center">
              <Calendar size={16} className="text-orange-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-xs">Streak</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 text-center">
              <Target size={16} className="text-purple-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-xs">Sessions</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 text-center">
              <Award size={16} className="text-yellow-400 mx-auto mb-1" />
              <div className="text-white text-lg font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-xs">Awards</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-shrink-0 px-4 mb-3">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-xs">Level Progress</h3>
              <span className="text-teal-400 text-sm font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs">
              Next level in {100 - (user.experience % 100)} XP
            </p>
          </div>
        </div>

        {/* Ego State Selection */}
        <div className="flex-shrink-0 mb-2">
          <div className="px-4 mb-2">
            <h3 className="text-white font-medium mb-1 text-xs">Current Ego State</h3>
            <p className="text-white/60 text-xs">Choose your inner guide</p>
          </div>
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Ego State Usage Analytics */}
        <div className="flex-1 overflow-hidden px-4 min-h-0 pb-2">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 h-full overflow-hidden flex flex-col">
            <h3 className="text-white font-medium mb-2 text-xs flex-shrink-0">Usage Analytics</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-lg p-2 mb-2 border border-white/20 flex-shrink-0`}>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{mostUsedState.icon}</span>
                  <div>
                    <h4 className="text-white font-medium text-xs">Most Used: {mostUsedState.name}</h4>
                    <p className="text-white/70 text-xs">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Breakdown */}
            <div className="grid grid-cols-5 gap-1 overflow-hidden flex-1 min-h-0">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className="bg-white/5 rounded-md p-1 border border-white/10 flex flex-col justify-between min-h-0">
                    <div className="flex flex-col items-center mb-1">
                      <span className="text-sm">{state.icon}</span>
                      <span className="text-white text-xs font-medium truncate text-center">{state.name}</span>
                    </div>
                    
                    <div className="flex flex-col items-center mb-1">
                      <span className="text-white/70 text-xs">{usage}</span>
                      <span className="text-white/60 text-xs">{percentage}%</span>
                    </div>
                    
                    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${state.color.replace('from-', 'from-').replace('to-', 'to-')} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}