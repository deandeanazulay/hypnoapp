import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { EGO_STATES } from '../../types/EgoState';
import PageShell from '../layout/PageShell';
import SettingsModal from '../modals/SettingsModal';
import EgoStatesModal from '../modals/EgoStatesModal';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user } = useGameState();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showEgoStates, setShowEgoStates] = React.useState(false);

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
  const currentState = EGO_STATES.find(state => state.id === selectedEgoState);

  const header = (
    <div className="bg-black/60 backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-light mb-2">Profile</h1>
            <p className="text-white/60 text-sm">Your transformation journey</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/10"
          >
            <Settings size={18} className="text-white" />
          </button>
        </div>
      </div>
      
      {/* Stats Overview - Single Row */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-teal-500/30 transition-all duration-300">
            <TrendingUp size={20} className="text-teal-400 mx-auto mb-1" />
            <div className="text-white text-xl font-semibold">{user.level}</div>
            <div className="text-white/60 text-xs">Level</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-orange-500/30 transition-all duration-300">
            <Calendar size={20} className="text-orange-400 mx-auto mb-1" />
            <div className="text-white text-xl font-semibold">{user.sessionStreak}</div>
            <div className="text-white/60 text-xs">Streak</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-purple-500/30 transition-all duration-300">
            <Target size={20} className="text-purple-400 mx-auto mb-1" />
            <div className="text-white text-xl font-semibold">{totalSessions}</div>
            <div className="text-white/60 text-xs">Sessions</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-yellow-500/30 transition-all duration-300">
            <Award size={20} className="text-yellow-400 mx-auto mb-1" />
            <div className="text-white text-xl font-semibold">{user.achievements.length}</div>
            <div className="text-white/60 text-xs">Awards</div>
          </div>
        </div>
      </div>
      
      {/* Level Progress */}
      <div className="px-4 pb-3">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-medium">Level Progress</h3>
            <span className="text-teal-400 font-medium text-sm">
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
      <div className="pb-2">
        <div className="px-4 mb-2">
          <h3 className="text-white font-medium text-sm">Current Ego State</h3>
          <p className="text-white/60 text-xs">Choose your inner guide</p>
        </div>
        <EgoStatesRow 
          selectedEgoState={selectedEgoState}
          onEgoStateChange={onEgoStateChange}
        />
      </div>
    </div>
  );

  const body = (
    <div className="bg-black relative px-4 py-4 h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20" />
      <div className="relative z-10 h-full">
        <div className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 backdrop-blur-md rounded-xl p-4 border border-white/20 h-full flex flex-col">
          <h3 className="text-white font-medium mb-3 flex-shrink-0">Usage Analytics</h3>
          
          {/* Most Used State Highlight */}
          {mostUsedState && (
            <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-xl p-3 mb-3 border border-white/30 flex-shrink-0 hover:scale-105 transition-all duration-300`}>
              <div className="flex items-center space-x-3">
                <span className="text-lg">{mostUsedState.icon}</span>
                <div>
                  <h4 className="text-white font-medium text-sm">Most Used: {mostUsedState.name}</h4>
                  <p className="text-white/70 text-xs">{getUsagePercentage(egoStateUsage[mostUsedState.id as keyof typeof egoStateUsage])}% of sessions</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Usage Breakdown */}
          <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
            {EGO_STATES.map((state) => {
              const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
              const percentage = getUsagePercentage(usage);
              
              return (
                <div key={state.id} className={`bg-gradient-to-br ${state.color} rounded-lg p-2 border border-white/20 flex flex-col justify-between h-full hover:scale-105 transition-all duration-300 hover:border-white/40`}>
                  <div className="flex flex-col items-center mb-1">
                    <span className="text-sm mb-1">{state.icon}</span>
                    <span className="text-white text-xs font-medium text-center leading-tight">{state.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center mb-1">
                    <span className="text-white/70 text-xs font-medium">{usage}</span>
                    <span className="text-white/60 text-xs">{percentage}%</span>
                  </div>
                  
                  <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full transition-all duration-500"
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
  );
  return (
    <>
      <PageShell
        header={header}
        body={body}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}