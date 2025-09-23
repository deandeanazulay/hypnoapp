import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight, Zap, Crown, Star, Sparkles, Play } from 'lucide-react';
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
    <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
      <div>
        <h1 className="text-[var(--ink-1)] text-xl font-bold mb-1 text-shadow-premium">
          Profile
        </h1>
        <p className="text-[var(--ink-dim)] text-xs font-medium uppercase tracking-wide">Your transformation journey</p>
      </div>
      <button
        onClick={() => setShowSettings(true)} 
        className="group w-10 h-10 rounded-xl card-premium hover:scale-110 transition-all duration-300 flex items-center justify-center opacity-80 hover:opacity-100"
        style={{ minHeight: '44px', minWidth: '44px' }}
      >
        <Settings size={16} className="text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );

  const body = (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      <div className="max-w-[1200px] max-h-[88vh] h-full w-full scale-to-fit">
        {/* Background gradient */}
        <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/30 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
          </div>

          {/* Content Grid */}
          <div className="relative z-10 h-full grid grid-rows-[auto,auto,1fr,auto] gap-3 px-4 pb-4">
            
            {/* Row 1: Stats - Reduced height */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: TrendingUp, value: user.level, label: 'LEVEL', color: 'teal', delay: 0 },
                { icon: Calendar, value: user.sessionStreak, label: 'STREAK', color: 'orange', delay: 50 },
                { icon: Target, value: Object.values(user.egoStateUsage).reduce((sum, count) => sum + count, 0), label: 'SESSIONS', color: 'purple', delay: 100 },
                { icon: Award, value: user.achievements.length, label: 'AWARDS', color: 'yellow', delay: 150 }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`card-premium hover:scale-105 transition-all duration-500 p-3 text-center cursor-pointer group animate-stagger-in opacity-80 hover:opacity-100`}
                    style={{ 
                      animationDelay: `${stat.delay}ms`,
                      willChange: 'transform, opacity'
                    }}
                  >
                    <div className="mb-1 p-1 rounded-lg bg-white/10 w-fit mx-auto group-hover:bg-white/20 transition-colors duration-300">
                      <IconComponent size={12} className={`text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    <div className="text-[var(--ink-1)] font-semibold font-mono mb-0.5 text-shadow-premium" style={{ fontSize: 'clamp(16px, 2.2vw, 20px)' }}>
                      {stat.value}
                    </div>
                    <div className="text-[var(--ink-dim)] uppercase tracking-wider" style={{ fontSize: '11px' }}>
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Row 2: XP Progress - Slim */}
            <div className="card-premium px-4 py-3 animate-stagger-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--ink-2)] font-medium text-xs">Level Progress</h3>
                <div className="flex items-center space-x-2">
                  <Sparkles size={12} className="text-[var(--xp)] animate-pulse" />
                  <span className="text-[var(--xp)] font-bold text-xs font-mono">
                    {animatedXP}/100 XP
                  </span>
                </div>
              </div>
              
              <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.07)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ 
                    width: `${animatedXP}%`,
                    background: 'var(--xp)',
                    boxShadow: 'var(--glow)',
                    willChange: 'width'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
                </div>
              </div>
              
              <p className="text-[var(--ink-dim)] text-xs mt-1">
                Next level in {100 - currentXP} XP • Keep going!
              </p>
            </div>

            {/* Row 3: Ego State Card - Centerpiece */}
            <div 
              onClick={openEgoModal}
              className="relative cursor-pointer group animate-stagger-in"
              style={{ 
                animationDelay: '250ms',
                willChange: 'transform'
              }}
            >
              {/* Aurora background */}
              <div className="absolute inset-0 card-ego-aurora opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              
              <div className="relative card-premium p-4 border-2 border-white/12 hover:border-white/25 transition-all duration-500 hover:scale-[1.02]" 
                   style={{ boxShadow: 'var(--shadow-card)' }}
                   onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 230, 195, 0.25)'}
                   onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Animated Orb */}
                    <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${currentState.color} flex items-center justify-center border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 group-hover:scale-110 flex-shrink-0 shadow-xl`}
                         style={{ willChange: 'transform' }}>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent group-hover:animate-spin-slow" />
                      <span className="text-lg group-hover:scale-110 transition-transform duration-300 relative z-10">{currentState.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--ink-1)] font-bold text-sm mb-1 text-shadow-premium">Current Ego State</h3>
                      <p className="text-violet-300 text-base font-bold">{currentState.name}</p>
                      <p className="text-[var(--ink-dim)] text-xs mb-2 truncate">{currentState.role}</p>
                      
                      {/* Active traits pills */}
                      <div className="flex space-x-2">
                        {currentState.usedFor.slice(0, 2).map((trait, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-white/10 border border-white/10 text-white/80 rounded-full font-medium"
                            style={{ fontSize: '11px' }}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border border-violet-400/50 text-violet-200 font-bold text-xs hover:from-violet-400/40 hover:to-fuchsia-400/40 hover:border-violet-300/60 transition-all duration-300 hover:scale-105"
                      style={{ minHeight: '32px' }}
                    >
                      Change
                    </button>
                    <ChevronRight size={16} className="text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Premium & Activity - Support Cards */}
            <div className="grid grid-cols-2 gap-3 min-h-0">
              
              {/* Premium Card */}
              <div className="group cursor-pointer relative overflow-hidden flex flex-col justify-between animate-stagger-in bg-black/40 border border-yellow-400/30 rounded-2xl p-3 hover:scale-[1.02] transition-all duration-500" style={{ animationDelay: '300ms', boxShadow: 'var(--shadow-card)' }}>
                
                {/* Shimmer line */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent animate-pulse" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/40 to-yellow-500/30 border border-amber-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Crown size={14} className="text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <h3 className="text-[var(--ink-1)] font-bold text-sm text-shadow-premium">Go Premium</h3>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] rounded-full border border-amber-500/40 font-bold uppercase">
                          Exclusive
                        </span>
                      </div>
                      <p className="text-amber-400/80 text-[10px] font-medium">Unlock Everything</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center text-[var(--ink-2)] text-[10px]">
                      <Zap size={10} className="text-amber-400 mr-2 opacity-80" />
                      <span>Unlimited Sessions</span>
                    </div>
                    <div className="flex items-center text-[var(--ink-2)] text-[10px]">
                      <Star size={10} className="text-amber-400 mr-2 opacity-80" />
                      <span>Premium Voices</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <button
                    onClick={() => handleUpgrade('pro')}
                    className="btn-shimmer w-full px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-lg text-black font-semibold text-[10px] hover:scale-105 transition-all duration-300"
                    style={{ minHeight: '32px' }}
                  >
                    <span className="relative z-10">UNLOCK EVERYTHING</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity - Timeline */}
              <div className="card-premium p-3 flex flex-col animate-stagger-in" style={{ animationDelay: '350ms', background: 'rgba(255, 255, 255, 0.04)' }}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <TrendingUp size={12} className="text-emerald-400 opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--ink-1)] font-bold text-sm mb-0.5 text-shadow-premium">Recent Activity</h3>
                    <p className="text-emerald-400/80 text-[10px] font-medium">Your Progress</p>
                  </div>
                </div>
                
                <div className="space-y-2 flex-1 overflow-hidden relative">
                  {getRecentActivity().length > 0 ? (
                    getRecentActivity().map((activity, index) => (
                      <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-300 hover:scale-105 ${activity.isCallToAction ? 'bg-emerald-500/10 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/20' : 'bg-white/5 border-white/10'}`}
                           style={{ minHeight: '32px' }}>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-[var(--ink-1)] text-[10px] font-medium truncate">{activity.action}</div>
                            {activity.xp && (
                              <div className="text-emerald-400 text-[9px] font-bold flex-shrink-0">+{activity.xp}</div>
                            )}
                          </div>
                          <div className="text-emerald-400 text-[9px] font-medium truncate">{activity.name}</div>
                          {activity.timeAgo && (
                            <div className="text-[var(--ink-dim)] text-[8px]">{activity.timeAgo}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 cursor-pointer hover:bg-emerald-500/10 rounded-lg transition-colors duration-300" style={{ minHeight: '44px' }}>
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-1">
                        <Play size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-emerald-400 text-[10px] font-bold mb-0.5">Start your journey</p>
                      <p className="text-[var(--ink-dim)] text-[9px]">Try a Focus Session</p>
                    </div>
                  )}
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
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}