import React from 'react';
import { Settings, Award, TrendingUp, Calendar, Target, ChevronRight, Zap, Crown, Star, Sparkles, Play, Eye, Brain, Compass, Shield, Heart, BookOpen, Lock, ArrowRight, Flame, Moon, Sun, Infinity } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore, getEgoState } from '../../state/appStore';
import { useUIStore } from '../../state/uiStore';
import { paymentService } from '../../lib/stripe';
import PageShell from '../layout/PageShell';
import SettingsModal from '../modals/SettingsModal';
import WebGLOrb from '../WebGLOrb';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user } = useGameState();
  const { user: authUser, signOut } = useAuth();
  const { activeEgoState, openEgoModal } = useAppStore();
  const { showToast } = useUIStore();
  const [showSettings, setShowSettings] = React.useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<'free' | 'active' | 'cancelled' | 'past_due'>('free');
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  const currentState = getEgoState(activeEgoState);

  // Load subscription status
  React.useEffect(() => {
    if (authUser) {
      paymentService.getSubscriptionStatus().then(setSubscriptionStatus);
    }
  }, [authUser]);

  // Get transformation insights
  const getTopArchetype = () => {
    const maxUsage = Math.max(...Object.values(user.egoStateUsage));
    const topId = Object.entries(user.egoStateUsage).find(([_, count]) => count === maxUsage)?.[0];
    return topId ? getEgoState(topId as any) : null;
  };

  const getTotalSessions = () => {
    return Object.values(user.egoStateUsage).reduce((sum, count) => sum + count, 0);
  };

  const getBreakthroughMoments = () => {
    const moments = [];
    
    if (user.sessionStreak >= 7) {
      moments.push({ title: `${user.sessionStreak}-Day Consistency`, icon: '🔥', desc: 'Daily transformation habit' });
    }
    
    if (user.level >= 5) {
      moments.push({ title: `Level ${user.level} Mastery`, icon: '⭐', desc: 'Consciousness evolution' });
    }
    
    const totalSessions = getTotalSessions();
    if (totalSessions >= 10) {
      moments.push({ title: `${totalSessions} Sessions Completed`, icon: '🎯', desc: 'Deep inner work' });
    }
    
    if (user.achievements.length > 0) {
      moments.push({ title: user.achievements[user.achievements.length - 1], icon: '🏆', desc: 'Recent achievement' });
    }
    
    return moments;
  };

  const getPersonaEvolution = () => {
    const sessions = Object.entries(user.egoStateUsage)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, count]) => ({ state: getEgoState(id as any), count }));
    
    return sessions;
  };

  const getIntentionMessage = () => {
    const messages: { [key: string]: string } = {
      guardian: "Stand in your power",
      rebel: "Break what limits you",
      healer: "Tend to your inner garden",
      explorer: "Expand your horizons",
      mystic: "Connect to source",
      sage: "Share your truth",
      child: "Embrace wonder",
      performer: "Shine your light",
      shadow: "Integrate your darkness",
      builder: "Ground visions into reality",
      seeker: "Expand awareness",
      lover: "Open your heart",
      trickster: "Break rigid patterns",
      warrior: "Show courage",
      visionary: "See beyond the veil"
    };
    return messages[activeEgoState] || "Stand in your power";
  };

  const getDailyIntention = () => {
    const intentions = [
      `Today you are ${currentState.name} — ${currentState.role}. ${getIntentionMessage()}.`
    ];
    
    const stateIntentions: { [key: string]: string } = {
      guardian: "Stand in your power",
      rebel: "Break what limits you",
      healer: "Tend to your inner garden",
      explorer: "Expand your horizons",
      mystic: "Connect to source",
      sage: "Share your truth",
      child: "Embrace wonder",
      performer: "Shine your light",
      shadow: "Integrate your darkness",
      builder: "Ground visions into reality",
      seeker: "Expand awareness",
      lover: "Open your heart",
      trickster: "Break rigid patterns",
      warrior: "Show courage",
      visionary: "See beyond the veil"
    };
    
    return `Today you are ${currentState.name} — ${currentState.role}. ${stateIntentions[activeEgoState] || "Stand in your power"}.`;
  };

  const handleUpgrade = async () => {
    if (!authUser) {
      showToast({
        type: 'error',
        message: 'Please sign in to upgrade to premium',
        duration: 4000
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      const { url } = await paymentService.createCheckoutSession('mystic-subscription');
      window.location.href = url;
    } catch (error: any) {
      console.error('Payment error:', error);
      showToast({
        type: 'error',
        message: error.message || 'Failed to start checkout. Please try again.',
        duration: 5000
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast({
        type: 'error',
        message: 'Failed to sign out. Please try again.',
        duration: 4000
      });
    } else {
      showToast({
        type: 'success',
        message: 'Successfully signed out',
        duration: 3000
      });
    }
  };

  const topArchetype = getTopArchetype();
  const breakthroughMoments = getBreakthroughMoments();
  const personaEvolution = getPersonaEvolution();

  const header = (
    <div className="flex-shrink-0 px-4 pt-2 pb-2 flex items-center justify-between">
      <div>
        <h1 className="text-[var(--ink-1)] text-lg font-bold mb-1 text-shadow-premium">
          Mirror of the Mind
        </h1>
        <p className="text-[var(--ink-dim)] text-xs font-medium uppercase tracking-wide">Your transformation journey</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowSettings(true)} 
          className="group w-10 h-10 rounded-xl card-premium hover:scale-110 transition-all duration-300 flex items-center justify-center opacity-80 hover:opacity-100"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Settings size={16} className="text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
        {authUser && (
          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/40 text-red-400 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ minHeight: '36px' }}
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  const body = (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full w-full">
        {/* Background gradient */}
        <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/30 relative">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
          </div>

          {/* Content Grid */}
          <div className="relative z-10 h-full flex flex-col gap-3 p-4 overflow-y-auto">
            
            {/* Row 1: Ego State Showcase */}
            <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/30 flex-shrink-0" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center space-x-4">
                {/* Living Orb */}
                <div className="flex-shrink-0 hidden sm:block">
                  <WebGLOrb
                    onTap={() => {}}
                    size={80}
                    egoState={activeEgoState}
                    afterglow={true}
                    className="cursor-pointer hover:scale-110 transition-transform duration-300"
                  />
                </div>
                
                {/* Current State Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center space-x-3 sm:hidden">
                    <WebGLOrb
                      onTap={() => {}}
                      size={50}
                      egoState={activeEgoState}
                      afterglow={true}
                      className="cursor-pointer hover:scale-110 transition-transform duration-300"
                    />
                    <div>
                      <h2 className="text-white font-bold text-base">Current Archetype</h2>
                      <h3 className="text-purple-300 font-semibold text-lg">{currentState.name}</h3>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block">
                    <h2 className="text-white font-bold text-lg mb-1">Current Archetype</h2>
                    <h3 className="text-purple-300 font-semibold text-xl mb-2">{currentState.name}</h3>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-3 leading-relaxed">
                    {getDailyIntention()}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={openEgoModal}
                      className="px-3 py-2 bg-purple-500/30 border border-purple-400/50 text-purple-200 rounded-lg text-xs font-medium hover:bg-purple-500/40 transition-all duration-300 hover:scale-105"
                    >
                      Switch State
                    </button>
                    <button className="px-3 py-2 bg-white/10 border border-white/20 text-white/80 rounded-lg text-xs font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105">
                      Reflect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-3 flex-1 min-h-0">
              
              {/* Transformation Dashboard */}
              <div className="space-y-3">
                
                {/* Energy Map */}
                <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                      <Brain size={16} className="text-teal-400" />
                    </div>
                    <h3 className="text-white font-semibold">Energy Map</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {personaEvolution.slice(0, 3).map((item, index) => (
                      <div key={item.state.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.state.icon}</span>
                        <span className="text-white/90 text-sm font-medium">{item.state.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${(item.count / Math.max(...personaEvolution.map(p => p.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-teal-400 text-xs font-semibold">{item.count}</span>
                      </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Breakthrough Moments */}
                <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/30 flex items-center justify-center">
                      <Award size={16} className="text-yellow-400" />
                    </div>
                    <h3 className="text-white font-semibold">Breakthrough Moments</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {breakthroughMoments.slice(0, 3).map((moment, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-lg flex-shrink-0">{moment.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm">{moment.title}</div>
                          <div className="text-white/60 text-xs">{moment.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Persona Evolution Section */}
              <div className="space-y-3">
                
                {/* Persona Evolution */}
                <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/30 flex items-center justify-center">
                      <Compass size={16} className="text-violet-400" />
                    </div>
                    <h3 className="text-white font-semibold">Persona Evolution</h3>
                  </div>
                  
                  {topArchetype && (
                    <div className="mb-4 p-3 bg-violet-500/20 rounded-lg border border-violet-500/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">{topArchetype.icon}</span>
                        <div>
                          <div className="text-violet-300 font-semibold">Your Core Archetype</div>
                          <div className="text-white font-medium">{topArchetype.name}</div>
                        </div>
                      </div>
                      <p className="text-violet-200/80 text-sm">{topArchetype.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-white/80 text-sm">
                      🌱 Began with: <span className="text-white font-medium">Guardian</span>
                    </div>
                    <div className="text-white/80 text-sm">
                      🔄 Currently mastering: <span className="text-white font-medium">{currentState.name}</span>
                    </div>
                    <div className="text-white/80 text-sm">
                      ✨ Next to unlock: <span className="text-violet-400 font-medium">
                        {subscriptionStatus === 'active' ? 'All Unlocked!' : 'Mystic, Shadow, Sage'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Premium Growth Pathway */}
                {subscriptionStatus !== 'active' && (
                  <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                        <Crown size={16} className="text-amber-400" />
                      </div>
                      <h3 className="text-white font-semibold">Unlock Your Potential</h3>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-3 text-sm">
                        <Lock size={14} className="text-amber-400 flex-shrink-0" />
                        <span className="text-white/80">6 Premium Archetypes</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Infinity size={14} className="text-amber-400 flex-shrink-0" />
                        <span className="text-white/80">Unlimited Sessions</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Brain size={14} className="text-amber-400 flex-shrink-0" />
                        <span className="text-white/80">Deep Transformation Quests</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleUpgrade}
                      disabled={isProcessingPayment}
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Crown size={16} />
                          <span>Unlock Everything</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Subconscious Journal Preview */}
                <div className="card-premium p-4 animate-stagger-in bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20" style={{ animationDelay: '600ms' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                      <BookOpen size={16} className="text-emerald-400" />
                    </div>
                    <h3 className="text-white font-semibold">Recent Insights</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="text-emerald-300 text-sm font-medium mb-1">Yesterday • Guardian Session</div>
                      <p className="text-white/80 text-sm italic">"I realized I've been protecting others more than myself..."</p>
                    </div>
                    
                    <button className="w-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all duration-300 hover:scale-105">
                      View Full Journal
                    </button>
                  </div>
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
      />
    </>
  );
}