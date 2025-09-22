import React, { useState } from 'react';
import { User, Settings, Trophy, Target, Zap, Heart, Shield, Sparkles } from 'lucide-react';
import { useGameState } from '../GameStateManager';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  selectedEgoState,
  onEgoStateChange
}) => {
  const { userState: user } = useGameState();
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'settings'>('stats');

  const egoStates = [
    { id: 'guardian', name: 'Guardian', icon: Shield, color: 'from-blue-500 to-cyan-500' },
    { id: 'explorer', name: 'Explorer', icon: Target, color: 'from-green-500 to-emerald-500' },
    { id: 'creator', name: 'Creator', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
    { id: 'healer', name: 'Healer', icon: Heart, color: 'from-rose-500 to-red-500' }
  ];

  const achievements = [
    { id: 1, name: 'First Steps', description: 'Complete your first session', unlocked: true },
    { id: 2, name: 'Energy Master', description: 'Reach 100 energy', unlocked: user.energy >= 100 },
    { id: 3, name: 'Level Up', description: 'Reach level 5', unlocked: user.level >= 5 },
    { id: 4, name: 'Explorer', description: 'Try all ego states', unlocked: false }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Profile</h1>
              <p className="text-sm text-gray-300">Level {user.level} • {user.experience} XP</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 px-4 py-2">
          <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
            {[
              { id: 'stats', label: 'Stats', icon: Trophy },
              { id: 'achievements', label: 'Achievements', icon: Target },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Current Stats */}
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Current Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{user.hp}</div>
                    <div className="text-sm text-gray-400">Health</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{user.energy}</div>
                    <div className="text-sm text-gray-400">Energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{user.level}</div>
                    <div className="text-sm text-gray-400">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{user.experience}</div>
                    <div className="text-sm text-gray-400">Experience</div>
                  </div>
                </div>
              </div>

              {/* Ego State Selection */}
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Active Ego State</h3>
                <div className="grid grid-cols-2 gap-2">
                  {egoStates.map((state) => (
                    <button
                      key={state.id}
                      onClick={() => onEgoStateChange(state.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedEgoState === state.id
                          ? 'border-white bg-white/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className={`w-8 h-8 mx-auto mb-2 bg-gradient-to-r ${state.color} rounded-full flex items-center justify-center`}>
                        <state.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm font-medium">{state.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Achievements</h3>
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-black/20 rounded-xl p-4 border-l-4 ${
                    achievement.unlocked
                      ? 'border-yellow-400'
                      : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.unlocked
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        achievement.unlocked ? 'text-white' : 'text-gray-400'
                      }`}>
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <div className="bg-black/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sound Effects</span>
                  <button className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notifications</span>
                  <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-save Progress</span>
                  <button className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;