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
        <div className="flex-shrink-0 pt-6 pb-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-light mb-2">Profile</h1>
              <p className="text-white/60 text-sm">Your transformation journey</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
              <Settings size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <TrendingUp size={24} className="text-teal-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.level}</div>
              <div className="text-white/60 text-sm">Level</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Calendar size={24} className="text-orange-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-sm">Streak</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Target size={24} className="text-purple-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-sm">Sessions</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Award size={24} className="text-yellow-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-sm">Awards</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-sm">Level Progress</h3>
              <span className="text-teal-400 text-sm font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-sm">
              Next level in {100 - (user.experience % 100)} XP
            </p>
          </div>
        </div>

        {/* Ego State Selection */}
        <div className="flex-shrink-0 mb-4">
          <div className="px-6 mb-3">
            <h3 className="text-white font-medium mb-1 text-sm">Current Ego State</h3>
            <p className="text-white/60 text-sm">Choose your inner guide</p>
          </div>
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Ego State Usage Analytics */}
        <div className="flex-1 overflow-hidden px-6 min-h-0 pb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 h-full overflow-hidden flex flex-col">
            <h3 className="text-white font-medium mb-4 text-sm flex-shrink-0">Usage Analytics</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-lg p-3 mb-4 border border-white/20 flex-shrink-0`}>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{mostUsedState.icon}</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">Most Used: {mostUsedState.name}</h4>
                    <p className="text-white/70 text-sm">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Breakdown */}
            <div className="grid grid-cols-3 gap-3 overflow-hidden flex-1 min-h-0">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className="bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm">{state.icon}</span>
                      <span className="text-white text-sm font-medium truncate">{state.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70 text-sm">{usage} sessions</span>
                      <span className="text-white/60 text-sm">{percentage}%</span>
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