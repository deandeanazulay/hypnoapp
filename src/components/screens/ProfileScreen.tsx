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
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-12 pb-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-light mb-1">Profile</h1>
              <p className="text-white/60 text-sm">Your transformation journey</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <TrendingUp size={24} className="text-teal-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.level}</div>
              <div className="text-white/60 text-xs">Level</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Calendar size={24} className="text-orange-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-xs">Day Streak</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Target size={24} className="text-purple-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-xs">Sessions</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <Award size={24} className="text-yellow-400 mx-auto mb-2" />
              <div className="text-white text-xl font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-xs">Achievements</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Level Progress</h3>
              <span className="text-teal-400 text-sm font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-2">
              Next level in {100 - (user.experience % 100)} XP
            </p>
          </div>
        </div>

        {/* Ego State Selection */}
        <div className="flex-shrink-0 mb-6">
          <div className="px-6 mb-4">
            <h3 className="text-white font-medium mb-2">Current Ego State</h3>
            <p className="text-white/60 text-sm">Choose your inner guide for sessions</p>
          </div>
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Ego State Usage Analytics */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-medium mb-4">Ego State Usage</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-xl p-3 mb-4 border border-white/20`}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{mostUsedState.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">Most Used: {mostUsedState.name}</h4>
                    <p className="text-white/70 text-sm">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Breakdown */}
            <div className="space-y-3">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{state.icon}</span>
                      <div>
                        <span className="text-white text-sm font-medium">{state.name}</span>
                        <div className="text-white/50 text-xs">{usage} sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${state.color.replace('from-', 'from-').replace('to-', 'to-')} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-xs w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Achievements */}
          {user.achievements.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <h3 className="text-white font-medium mb-3">Recent Achievements</h3>
              <div className="space-y-2">
                {user.achievements.slice(-3).map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
                    <Award size={16} className="text-amber-400" />
                    <span className="text-white text-sm">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Preview */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-medium mb-3">Quick Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Voice Guidance</span>
                <div className="w-10 h-6 bg-teal-500/20 rounded-full border border-teal-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-teal-400 rounded-full ml-auto" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Session Reminders</span>
                <div className="w-10 h-6 bg-white/10 rounded-full border border-white/20 flex items-center px-1">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Afterglow Effects</span>
                <div className="w-10 h-6 bg-orange-500/20 rounded-full border border-orange-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-orange-400 rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}