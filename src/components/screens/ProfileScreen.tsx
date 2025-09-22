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
        <div className="flex-shrink-0 pt-1 pb-0.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-lg font-light mb-0.5">Profile</h1>
              <p className="text-white/60 text-xs">Your transformation journey</p>
            </div>
            <button className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
              <Settings size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-4 mb-0.5">
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10 text-center">
              <TrendingUp size={16} className="text-teal-400 mx-auto mb-0.5" />
              <div className="text-white text-sm font-semibold">{user.level}</div>
              <div className="text-white/60 text-xs">Level</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10 text-center">
              <Calendar size={16} className="text-orange-400 mx-auto mb-0.5" />
              <div className="text-white text-sm font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-xs">Streak</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10 text-center">
              <Target size={16} className="text-purple-400 mx-auto mb-0.5" />
              <div className="text-white text-sm font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-xs">Sessions</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10 text-center">
              <Award size={16} className="text-yellow-400 mx-auto mb-0.5" />
              <div className="text-white text-sm font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-xs">Awards</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-shrink-0 px-4 mb-0.5">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-medium text-xs">Level Progress</h3>
              <span className="text-teal-400 text-xs font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-0.5">
              Next level in {100 - (user.experience % 100)} XP
            </p>
          </div>
        </div>

        {/* Ego State Selection */}
        <div className="flex-shrink-0 mb-0.5">
          <div className="px-4 mb-1">
            <h3 className="text-white font-medium mb-0.5 text-xs">Current Ego State</h3>
            <p className="text-white/60 text-xs">Choose your inner guide</p>
          </div>
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Ego State Usage Analytics */}
        <div className="flex-1 overflow-hidden px-4 min-h-0">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10 h-full overflow-hidden flex flex-col">
            <h3 className="text-white font-medium mb-2 text-xs flex-shrink-0">Usage Analytics</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-lg p-2 mb-2 border border-white/20 flex-shrink-0`}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{mostUsedState.icon}</span>
                  <div>
                    <h4 className="text-white font-medium text-xs">Most Used: {mostUsedState.name}</h4>
                    <p className="text-white/70 text-xs">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Breakdown */}
            <div className="grid grid-cols-2 gap-1 overflow-y-auto flex-1 min-h-0">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className="bg-white/5 rounded-lg p-1 border border-white/10">
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-sm">{state.icon}</span>
                      <span className="text-white text-xs font-medium truncate">{state.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/50 text-xs">{usage}</span>
                      <span className="text-white/60 text-xs">{percentage}%</span>
                    </div>
                    
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
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
    </div>
  );
}