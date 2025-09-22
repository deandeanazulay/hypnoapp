import React from 'react';
import { User, Settings, Award, TrendingUp, Calendar, Target, X, CreditCard, Moon, Sun, Shield, Info } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { EGO_STATES } from '../../types/EgoState';
import EgoStatesRow from '../EgoStatesRow';
import SettingsModal from '../SettingsModal';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user } = useGameState();
  const [showSettings, setShowSettings] = React.useState(false);

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
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-6 pb-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-light mb-2">Profile</h1>
              <p className="text-white/60 text-lg">Your transformation journey</p>
            </div>
            <button onClick={() => setShowSettings(true)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/10">
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Overview - Single Row */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-teal-500/30 transition-all duration-300">
              <TrendingUp size={24} className="text-teal-400 mx-auto mb-2" />
              <div className="text-white text-2xl font-semibold">{user.level}</div>
              <div className="text-white/60 text-sm">Level</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-orange-500/30 transition-all duration-300">
              <Calendar size={24} className="text-orange-400 mx-auto mb-2" />
              <div className="text-white text-2xl font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-sm">Streak</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-purple-500/30 transition-all duration-300">
              <Target size={24} className="text-purple-400 mx-auto mb-2" />
              <div className="text-white text-2xl font-semibold">{totalSessions}</div>
              <div className="text-white/60 text-sm">Sessions</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-yellow-500/30 transition-all duration-300">
              <Award size={24} className="text-yellow-400 mx-auto mb-2" />
              <div className="text-white text-2xl font-semibold">{user.achievements.length}</div>
              <div className="text-white/60 text-sm">Awards</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-lg">Level Progress</h3>
              <span className="text-teal-400 text-lg font-medium">
                {user.experience % 100}/100 XP
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
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
            <h3 className="text-white font-medium mb-2 text-lg">Current Ego State</h3>
            <p className="text-white/60 text-sm">Choose your inner guide</p>
          </div>
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Ego State Usage Analytics */}
        <div className="flex-1 overflow-hidden px-6 min-h-0 pb-4">
          <div className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 backdrop-blur-md rounded-xl p-4 border border-white/20 h-full overflow-hidden flex flex-col">
            <h3 className="text-white font-medium mb-4 text-lg flex-shrink-0">Usage Analytics</h3>
            
            {/* Most Used State Highlight */}
            {mostUsedState && (
              <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-xl p-3 mb-4 border border-white/30 flex-shrink-0 hover:scale-105 transition-all duration-300`}>
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
            <div className="grid grid-cols-5 gap-2 overflow-hidden flex-1 min-h-0">
              {EGO_STATES.map((state) => {
                const usage = egoStateUsage[state.id as keyof typeof egoStateUsage] || 0;
                const percentage = getUsagePercentage(usage);
                
                return (
                  <div key={state.id} className={`bg-gradient-to-br ${state.color} rounded-lg p-2 border border-white/20 flex flex-col justify-between min-h-0 hover:scale-105 transition-all duration-300 hover:border-white/40`}>
                    <div className="flex flex-col items-center mb-2">
                      <span className="text-base mb-1">{state.icon}</span>
                      <span className="text-white text-xs font-medium truncate text-center leading-tight">{state.name}</span>
                    </div>
                    
                    <div className="flex flex-col items-center mb-2">
                      <span className="text-white/70 text-sm font-medium">{usage}</span>
                      <span className="text-white/60 text-xs">{percentage}%</span>
                    </div>
                    
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4 max-h-[80vh] overflow-auto shadow-2xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-light">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-white/60 hover:text-white transition-colors hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Account */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-white/20 hover:border-blue-500/30 transition-all duration-300">
                <h3 className="text-white font-medium mb-3 flex items-center text-lg">
                  <User size={20} className="mr-3 text-blue-400" />
                  Account
                </h3>
                <p className="text-white/70 text-sm mb-3">Manage your profile and preferences</p>
                <button className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg text-blue-400 font-medium transition-all duration-300 hover:scale-105">
                  Edit Profile
                </button>
              </div>

              {/* Theme */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/20 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-white font-medium mb-3 flex items-center text-lg">
                  <Moon size={20} className="mr-3 text-purple-400" />
                  Theme
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Dark Mode</span>
                  <div className="w-12 h-6 bg-purple-500/20 rounded-full border border-purple-500/40 flex items-center px-1">
                    <div className="w-4 h-4 bg-purple-400 rounded-full ml-auto transition-all duration-300" />
                  </div>
                </div>
              {/* Subscription */}
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-white/20 hover:border-green-500/30 transition-all duration-300">
                <h3 className="text-white font-medium mb-3 flex items-center text-lg">
                  <CreditCard size={20} className="mr-3 text-green-400" />
                  Subscription
                </h3>
                <p className="text-white/70 text-sm mb-3">Current plan: {user.plan === 'free' ? 'Free' : 'Pro'}</p>
                <button className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-green-400 font-medium transition-all duration-300 hover:scale-105">
                  {user.plan === 'free' ? 'Upgrade to Pro' : 'Manage Subscription'}
                </button>
              </div>
              </div>
              {/* About & Privacy */}
              <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-xl p-4 border border-white/20 hover:border-gray-500/30 transition-all duration-300">
                <h3 className="text-white font-medium mb-3 flex items-center text-lg">
                  <Info size={20} className="mr-3 text-gray-400" />
                  About & Privacy
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 text-sm">
                    Privacy Policy
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 text-sm">
                    Terms of Service
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 text-sm">
                    About Hypno Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}