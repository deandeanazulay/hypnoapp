import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight, Zap, Crown, Star, Sparkles, Lock, Play } from 'lucide-react';
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
  const [animatedXP, setAnimatedXP] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const currentState = getEgoState(activeEgoState);
  const currentXP = user.experience % 100;

  // Animate XP counter on load
  React.useEffect(() => {
    setIsLoaded(true);
    const timer = setTimeout(() => {
      let start = 0;
      const increment = currentXP / 30; // 30 frames for smooth animation
      const counter = setInterval(() => {
        start += increment;
        if (start >= currentXP) {
          setAnimatedXP(currentXP);
          clearInterval(counter);
        } else {
          setAnimatedXP(Math.floor(start));
        }
      }, 16); // 60fps
    }, 500); // Delay start
    
    return () => clearTimeout(timer);
  }, [currentXP]);

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
        action: 'Completed',
        timeAgo: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`,
        xp: 25,
        icon: '⭐'
      });
    }

    if (user.achievements.length > 0) {
      const recentAchievement = user.achievements[user.achievements.length - 1];
      activities.push({
        action: 'Achievement Unlocked',
        name: 'Achievement Unlocked',
        description: recentAchievement,
        timeAgo: '2 days ago',
        icon: '🏆'
      });
    }

    // Add call to action if empty
    if (activities.length === 0) {
      activities.push({
        action: 'Start your journey',
        name: 'Try a Focus Session',
        timeAgo: '',
        icon: '🚀',
        isCallToAction: true
      });
    }

    return activities.slice(0, 2);
  };

  const header = (
    <div className="bg-gradient-to-br from-black via-indigo-950/30 to-purple-950/30 backdrop-blur-xl border-b border-white/5">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/90 bg-clip-text">
              Profile
            </h1>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wide">Your transformation journey</p>
          </div>
          <button
            onClick={() => setShowSettings(true)} 
            className="group w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 hover:border-white/30 transition-all duration-300 hover:scale-110 shadow-lg shadow-black/20"
          >
            <Settings size={16} className="text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/30 relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full p-3 flex flex-col justify-between overflow-hidden">
        
        {/* Row 1: Hero Stats - Smaller & Animated */}
        <div className={`grid grid-cols-4 gap-2 flex-shrink-0 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="group glass-card-premium bg-gradient-to-br from-teal-500/15 to-cyan-500/10 border-teal-500/20 hover:border-teal-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/20 p-4 text-center cursor-pointer">
            <div className="mb-1 p-1 rounded-lg bg-teal-500/20 w-fit mx-auto group-hover:bg-teal-500/30 transition-colors duration-300">
              <TrendingUp size={14} className="text-teal-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-lg font-bold font-mono mb-0.5 group-hover:text-teal-200 transition-colors duration-300">
              {user.level}
            </div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">LEVEL</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-orange-500/15 to-amber-500/10 border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 p-4 text-center cursor-pointer">
            <div className="mb-1 p-1 rounded-lg bg-orange-500/20 w-fit mx-auto group-hover:bg-orange-500/30 transition-colors duration-300">
              <Calendar size={14} className="text-orange-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-lg font-bold font-mono mb-0.5 group-hover:text-orange-200 transition-colors duration-300">
              {user.sessionStreak}
            </div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">STREAK</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-purple-500/15 to-indigo-500/10 border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 p-4 text-center cursor-pointer">
            <div className="mb-1 p-1 rounded-lg bg-purple-500/20 w-fit mx-auto group-hover:bg-purple-500/30 transition-colors duration-300">
              <Target size={14} className="text-purple-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-lg font-bold font-mono mb-0.5 group-hover:text-purple-200 transition-colors duration-300">
              {Object.values(user.egoStateUsage).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">SESSIONS</div>
          </div>
          
          <div className="group glass-card-premium bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 p-4 text-center cursor-pointer">
            <div className="mb-1 p-1 rounded-lg bg-yellow-500/20 w-fit mx-auto group-hover:bg-yellow-500/30 transition-colors duration-300">
              <Award size={14} className="text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-white text-lg font-bold font-mono mb-0.5 group-hover:text-yellow-200 transition-colors duration-300">
              {user.achievements.length}
            </div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">AWARDS</div>
          </div>
        </div>
        
        {/* Row 2: XP Progress - Slimmer with Animation */}
        <div className={`glass-card-premium bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-700 p-3 flex-shrink-0 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-xs">Level Progress</h3>
            <div className="flex items-center space-x-2">
              <Sparkles size={12} className="text-teal-400 animate-pulse" />
              <span className="text-teal-400 font-bold text-[10px] font-mono">
                {animatedXP}/100 XP
              </span>
            </div>
          </div>
          
          <div className="relative w-full h-1.5 bg-gradient-to-r from-white/10 to-white/5 rounded-full overflow-hidden border border-white/20 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full transition-all duration-2000 ease-out relative overflow-hidden shadow-lg"
              style={{ width: `${animatedXP}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
          </div>
          
          <p className="text-white/40 text-[10px] mt-1 font-medium">
            Next level in {100 - currentXP} XP • Keep going!
          </p>
        </div>

        {/* Row 3: Ego State Card - Hero Centerpiece */}
        <div 
          onClick={openEgoModal}
          className={`group glass-card-premium bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-fuchsia-500/10 border-2 border-violet-500/30 hover:border-violet-400/60 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-violet-500/30 p-4 cursor-pointer flex-shrink-0 relative overflow-hidden animate-gradient-x ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ 
            backgroundSize: '200% 200%',
            animation: 'gradient-x 6s ease infinite',
            transitionDelay: '0.2s'
          }}
        >
          {/* Animated orb aura */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Animated Orb */}
              <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${currentState.color} flex items-center justify-center border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 group-hover:scale-110 flex-shrink-0 shadow-xl group-hover:animate-pulse`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent group-hover:animate-spin-slow" />
                <span className="text-xl group-hover:scale-110 transition-transform duration-300 relative z-10">{currentState.icon}</span>
                {/* Orb glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 blur-lg scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">Current Ego State</h3>
                <p className="text-violet-300 text-lg font-bold">{currentState.name}</p>
                <p className="text-white/50 text-xs mb-2 truncate">{currentState.role}</p>
                
                {/* Active traits pills */}
                <div className="flex space-x-2">
                  {currentState.usedFor.slice(0, 2).map((trait, index) => (
                    <span key={index} className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] rounded-full border border-violet-500/30 font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border border-violet-400/50 text-violet-200 font-bold text-xs hover:from-violet-400/40 hover:to-fuchsia-400/40 hover:border-violet-300/60 transition-all duration-300 hover:scale-105 shadow-lg shadow-violet-500/20">
                Change
              </button>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Row 4: Premium & Activity - Support Cards */}
        <div className={`grid grid-cols-2 gap-3 flex-1 min-h-0 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.3s' }}>
          
          {/* Premium Card - More Exclusive */}
          <div className="group glass-card-premium bg-gradient-to-br from-black via-gray-900/50 to-black border-2 border-amber-500/40 hover:border-amber-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/40 p-3 cursor-pointer relative overflow-hidden flex flex-col justify-between">
            
            {/* Shimmer Animation */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/40 to-yellow-500/30 border border-amber-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Crown size={16} className="text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-bold text-sm">Go Premium</h3>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] rounded-full border border-amber-500/40 font-bold uppercase">
                      Exclusive
                    </span>
                  </div>
                  <p className="text-amber-400/80 text-[10px] font-medium">Unlock Everything</p>
                </div>
              </div>
              
              <div className="space-y-1 mb-3 flex-1">
                <div className="flex items-center text-white/70 text-[10px]">
                  <Zap size={10} className="text-amber-400 mr-2" />
                  <span>Unlimited Sessions</span>
                </div>
                <div className="flex items-center text-white/70 text-[10px]">
                  <Star size={10} className="text-amber-400 mr-2" />
                  <span>Premium Voices</span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10">
              <button
                onClick={() => handleUpgrade('pro')}
                className="w-full px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg text-black font-bold text-[10px] hover:from-amber-300 hover:to-yellow-300 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/40 relative overflow-hidden"
              >
                <span className="relative z-10">UNLOCK EVERYTHING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
              </button>
            </div>
          </div>

          {/* Recent Activity - Timeline Style */}
          <div className="group glass-card-premium bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 p-3 flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm mb-0.5">Recent Activity</h3>
                <p className="text-emerald-400/80 text-[10px] font-medium">Your Progress</p>
              </div>
            </div>
            
            <div className="space-y-2 flex-1 overflow-hidden relative">
              {getRecentActivity().length > 0 ? (
                getRecentActivity().map((activity, index) => (
                  <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-300 hover:scale-105 ${activity.isCallToAction ? 'bg-emerald-500/10 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-white text-[10px] font-medium truncate">{activity.action}</div>
                        {activity.xp && (
                          <div className="text-emerald-400 text-[9px] font-bold flex-shrink-0">+{activity.xp}</div>
                        )}
                      </div>
                      <div className="text-emerald-400 text-[9px] font-medium truncate">{activity.name}</div>
                      {activity.timeAgo && (
                        <div className="text-white/40 text-[8px]">{activity.timeAgo}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 cursor-pointer hover:bg-emerald-500/10 rounded-lg transition-colors duration-300">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-2">
                    <Play size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 text-[10px] font-bold mb-1">Start your journey</p>
                  <p className="text-white/40 text-[9px]">Try a Focus Session</p>
                </div>
              )}
              
              {/* Subtle timeline line */}
              {getRecentActivity().length > 1 && (
                <div className="absolute left-5 top-8 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-white/40 text-xs">Complete your first session!</p>
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
    </>
  );
}