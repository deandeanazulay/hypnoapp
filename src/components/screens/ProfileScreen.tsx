import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight, Zap, Crown, Star, Sparkles } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../state/appStore';
import { useUIStore } from '../../state/uiStore';
import PageShell from '../layout/PageShell';
import SettingsModal from '../modals/SettingsModal';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user } = useGameState();
  const { activeEgoState, openEgoModal } = useAppStore();
  const { showToast } = useUIStore();
  const [showSettings, setShowSettings] = React.useState(false);

  const currentState = getEgoState(activeEgoState);

  // Handle upgrade plan action
  const handleUpgrade = (tier: string) => {
    showToast({
      type: 'info',
      message: `Upgrade to ${tier.toUpperCase()} plan coming soon! We'll notify you when available.`,
      duration: 4000
    });
  };

  // Get formatted recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    if (user.lastSessionDate) {
      const lastSessionDate = new Date(user.lastSessionDate);
      const hoursAgo = Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60));
      activities.push({
        name: `${getEgoState(activeEgoState).name} Session`,
        timeAgo: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`,
        xp: 25,
        icon: getEgoState(activeEgoState).icon
      });
    }

    if (user.achievements.length > 0) {
      const recentAchievement = user.achievements[user.achievements.length - 1];
      activities.push({
        name: 'Achievement Unlocked',
        description: recentAchievement,
        timeAgo: '2 days ago',
        icon: '🏆'
      });
    }

    return activities.slice(0, 2);
  };

  const header = (
    <div className="bg-gradient-to-br from-black via-indigo-950/30 to-purple-950/30 backdrop-blur-xl border-b border-white/5">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-3xl font-semibold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
              Profile
            </h1>
            <p className="text-white/60 text-sm font-medium">Your transformation journey</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)} 
            className="group w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 hover:border-white/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/20"
          >
            <Settings size={20} className="text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full p-4 flex flex-col gap-4">
        
        {/* Row 1: Stats Cards */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <div className="group glass-card-premium bg-gradient-to-br from-teal-500/15 to-cyan-500/10 border-teal-500/20 hover:border-teal-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/20 p-4 text-center cursor-pointer">
            <div className="mb-3 p-2 rounded-xl bg-teal-500/20 w-fit mx-auto group-hover:bg-teal-500/30 transition-colors duration-300">
              <TrendingUp size={20} className="text-teal-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-2xl font-bold font-mono mb-1 group-hover:text-teal-200 transition-colors duration-300">
              {user.level}
            </div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Level</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-orange-500/15 to-amber-500/10 border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 p-4 text-center cursor-pointer">
            <div className="mb-3 p-2 rounded-xl bg-orange-500/20 w-fit mx-auto group-hover:bg-orange-500/30 transition-colors duration-300">
              <Calendar size={20} className="text-orange-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-2xl font-bold font-mono mb-1 group-hover:text-orange-200 transition-colors duration-300">
              {user.sessionStreak}
            </div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Streak</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-purple-500/15 to-indigo-500/10 border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 p-4 text-center cursor-pointer">
            <div className="mb-3 p-2 rounded-xl bg-purple-500/20 w-fit mx-auto group-hover:bg-purple-500/30 transition-colors duration-300">
              <Target size={20} className="text-purple-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-2xl font-bold font-mono mb-1 group-hover:text-purple-200 transition-colors duration-300">
              {Object.values(user.egoStateUsage).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Sessions</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 p-4 text-center cursor-pointer">
            <div className="mb-3 p-2 rounded-xl bg-yellow-500/20 w-fit mx-auto group-hover:bg-yellow-500/30 transition-colors duration-300">
              <Award size={20} className="text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-2xl font-bold font-mono mb-1 group-hover:text-yellow-200 transition-colors duration-300">
              {user.achievements.length}
            </div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Awards</div>
          </div>
        </div>
        
        {/* Row 2: XP Progress Bar */}
        <div className="glass-card-premium bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-500 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-lg">Level Progress</h3>
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-teal-400 animate-pulse" />
              <span className="text-teal-400 font-bold text-sm font-mono">
                {user.experience % 100}/100 XP
              </span>
            </div>
          </div>
          
          <div className="relative w-full h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full overflow-hidden border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${(user.experience % 100)}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
          </div>
          
          <p className="text-white/50 text-xs mt-2 font-medium">
            Next level in {100 - (user.experience % 100)} XP • Keep going!
          </p>
        </div>

        {/* Row 3: Current Ego State */}
        <div 
          onClick={openEgoModal}
          className="group glass-card-premium bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border-violet-500/20 hover:border-violet-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/20 p-4 cursor-pointer flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentState.color} flex items-center justify-center border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-110`}>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{currentState.icon}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Current Ego State</h3>
                <p className="text-violet-400 text-base font-medium">{currentState.name}</p>
                <p className="text-white/50 text-sm">{currentState.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-400 font-semibold text-sm hover:from-violet-500/30 hover:to-fuchsia-500/30 hover:border-violet-400/50 transition-all duration-300 hover:scale-105">
                Change
              </button>
              <ChevronRight size={20} className="text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Row 4: Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          
          {/* Premium Upgrade Card */}
          <div className="group glass-card-premium bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/25 p-4 cursor-pointer relative overflow-hidden">
            
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent animate-shimmer" />
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Crown size={24} className="text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">Go Premium</h3>
                  <p className="text-amber-400 text-sm font-medium">Unlock Everything</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-white/80 text-sm">
                  <Zap size={12} className="text-amber-400 mr-2" />
                  <span>Unlimited Sessions</span>
                </div>
                <div className="flex items-center text-white/80 text-sm">
                  <Star size={12} className="text-amber-400 mr-2" />
                  <span>Premium Voices</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleUpgrade('pro')}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl text-black font-bold text-sm hover:from-amber-300 hover:to-yellow-300 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="group glass-card-premium bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-1">Recent Activity</h3>
                <p className="text-emerald-400 text-sm font-medium">Your Progress</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {getRecentActivity().length > 0 ? (
                getRecentActivity().map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{activity.name}</div>
                      <div className="text-white/50 text-xs">{activity.timeAgo}</div>
                    </div>
                    {activity.xp && (
                      <div className="text-emerald-400 text-xs font-bold">+{activity.xp} XP</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/40 text-sm">Complete your first session!</p>
                </div>
              )}
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

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}