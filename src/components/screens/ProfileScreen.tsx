import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../state/appStore';
import PageShell from '../layout/PageShell';
import SettingsModal from '../modals/SettingsModal';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user } = useGameState();
  const { activeEgoState, openEgoModal } = useAppStore();
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
    return mostUsedId ? getEgoState(mostUsedId as any) : null;
  };

  const mostUsedState = getMostUsedEgoState();
  const currentState = getEgoState(activeEgoState);

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
      
      {/* Current Ego State */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentState.color} flex items-center justify-center`}>
              <span className="text-sm">{currentState.icon}</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Current Ego State</div>
              <div className="text-white/70 text-xs">{currentState.name}</div>
            </div>
          </div>
          <button onClick={openEgoModal} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-300">
            Change
          </button>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="bg-black relative px-4 py-4 h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20" />
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          
          {/* Premium Features Card */}
          <div className="glass-card-premium bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Premium Features</h3>
                <p className="text-purple-400 text-sm">Unlock your potential</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔓</span>
                  <span className="text-white/80 text-sm">Unlimited Sessions</span>
                </div>
                <span className="text-orange-400 text-xs font-medium px-2 py-1 bg-orange-500/20 rounded-full">PRO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="text-white/80 text-sm">Custom Protocols</span>
                </div>
                <span className="text-purple-400 text-xs font-medium px-2 py-1 bg-purple-500/20 rounded-full">PREMIUM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎵</span>
                  <span className="text-white/80 text-sm">Premium Voices</span>
                </div>
                <span className="text-teal-400 text-xs font-medium px-2 py-1 bg-teal-500/20 rounded-full">ACTIVE</span>
              </div>
            </div>
            
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200">
              Upgrade Plan
            </button>
          </div>

          {/* Recent Activity & Achievements */}
          <div className="glass-card-premium bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-6 hover:border-teal-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
                  <p className="text-teal-400 text-sm">Your transformation journey</p>
                </div>
              </div>
              <button 
                onClick={openEgoModal}
                className="px-3 py-2 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-colors"
              >
                View Analytics
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🌿</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Healer Session</div>
                  <div className="text-white/60 text-xs">2 hours ago • 15 minutes</div>
                </div>
                <div className="text-green-400 text-xs font-medium">+25 XP</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🛡️</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Guardian Session</div>
                  <div className="text-white/60 text-xs">Yesterday • 10 minutes</div>
                </div>
                <div className="text-blue-400 text-xs font-medium">+20 XP</div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🏆</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Achievement Unlocked</div>
                  <div className="text-white/60 text-xs">3 days ago • "First Steps"</div>
                </div>
                <div className="text-yellow-400 text-xs font-medium">BADGE</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
          {/* Quick Actions */}
          <div className="glass-card-premium bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-6 hover:border-orange-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Quick Actions</h3>
                <p className="text-orange-400 text-sm">Personalize your experience</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔧</span>
                  <span className="text-white text-sm">Settings & Preferences</span>
                </div>
                <span className="text-white/40">→</span>
              </button>
              
              <button 
                onClick={openEgoModal}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎭</span>
                  <span className="text-white text-sm">Explore Ego States</span>
                </div>
                <span className="text-white/40">→</span>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📚</span>
                  <span className="text-white text-sm">Export Progress</span>
                </div>
                <span className="text-white/40">→</span>
              </button>
            </div>
          </div>
                <span className="text-white/60">This Week</span>
          {/* Personalized Insights */}
          <div className="glass-card-premium bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-6 hover:border-indigo-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Personalized Insights</h3>
                <p className="text-indigo-400 text-sm">AI-powered recommendations</p>
              </div>
            </div>
                <span className="text-teal-400 font-medium">3 sessions • 45 min total</span>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-lg border border-indigo-500/20">
                <div className="flex items-start space-x-3 mb-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">Optimal Session Time</h4>
                    <p className="text-white/70 text-xs">Based on your activity patterns</p>
                  </div>
                </div>
                <p className="text-indigo-400 text-sm font-medium ml-8">Best time: 7:00 PM - 9:00 PM</p>
              </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500/5 to-teal-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-start space-x-3 mb-2">
                  <span className="text-lg">📈</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">Progress Streak</h4>
                    <p className="text-white/70 text-xs">You're on track for level 2!</p>
                  </div>
                </div>
                <p className="text-green-400 text-sm font-medium ml-8">45 XP to next level</p>
              </div>
            </div>
              <div className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-lg border border-purple-500/20">
                <div className="flex items-start space-x-3 mb-2">
                  <span className="text-lg">✨</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">Recommended Ego State</h4>
                    <p className="text-white/70 text-xs">Try Explorer for creativity boost</p>
                  </div>
                </div>
                <button className="ml-8 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors">
                  Switch Now
                </button>
              </div>
            </div>
          </div>
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
        selectedEgoState={activeEgoState}
        onEgoStateChange={onEgoStateChange}
      />
    </>
  );
}