import React from 'react';
import { TrendingUp, Calendar, Target, Award, Crown, Zap, Coins } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../state/appStore';
import { paymentService } from '../../lib/stripe';

export default function GlobalHUD() {
  const { user } = useGameState();
  const { activeEgoState } = useAppStore();
  const currentState = getEgoState(activeEgoState);
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<'free' | 'active' | 'cancelled' | 'past_due'>('free');
  const currentXP = user.experience % 100;

  React.useEffect(() => {
    paymentService.getSubscriptionStatus().then(setSubscriptionStatus);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          
          {/* Left Section - User Stats */}
          <div className="flex items-center space-x-4">
            
            {/* Current Ego State - Compact */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentState.color} flex items-center justify-center border border-white/30 shadow-lg`}>
                <span className="text-sm">{currentState.icon}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-semibold text-sm">{currentState.name}</div>
                <div className="text-white/60 text-xs">{currentState.role.split(',')[0]}</div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/20" />
            
            {/* Core Stats */}
            <div className="flex items-center space-x-6">
              
              {/* Level */}
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-teal-400" />
                <div className="text-center">
                  <div className="text-white font-bold text-sm">L{user.level}</div>
                  <div className="text-white/60 text-xs">Level</div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="hidden md:flex items-center space-x-2 min-w-[120px]">
                <Zap size={16} className="text-orange-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400 font-semibold text-xs">{currentXP}/100 XP</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${currentXP}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-amber-400" />
                <div className="text-center">
                  <div className="text-white font-bold text-sm">{user.sessionStreak}d</div>
                  <div className="text-white/60 text-xs">Streak</div>
                </div>
              </div>

              {/* Sessions */}
              <div className="hidden sm:flex items-center space-x-2">
                <Target size={16} className="text-purple-400" />
                <div className="text-center">
                  <div className="text-white font-bold text-sm">{Object.values(user.egoStateUsage).reduce((sum, count) => sum + count, 0)}</div>
                  <div className="text-white/60 text-xs">Sessions</div>
                </div>
              </div>

              {/* Awards */}
              <div className="hidden lg:flex items-center space-x-2">
                <Award size={16} className="text-yellow-400" />
                <div className="text-center">
                  <div className="text-white font-bold text-sm">{user.achievements.length}</div>
                  <div className="text-white/60 text-xs">Awards</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Premium Status & Tokens */}
          <div className="flex items-center space-x-4">
            
            {/* Tokens */}
            <div className="flex items-center space-x-2">
              <Coins size={16} className="text-yellow-400" />
              <div className="text-center">
                <div className="text-white font-bold text-sm">{user.tokens}</div>
                <div className="text-white/60 text-xs">Tokens</div>
              </div>
            </div>

            {/* Premium Status */}
            <div className="flex items-center space-x-2">
              <Crown size={16} className={subscriptionStatus === 'active' ? 'text-teal-400' : 'text-white/40'} />
              <div className="text-center">
                <div className={`font-bold text-sm ${subscriptionStatus === 'active' ? 'text-teal-400' : 'text-white/60'}`}>
                  {subscriptionStatus === 'active' ? 'PRO' : 'FREE'}
                </div>
                <div className="text-white/60 text-xs">Plan</div>
              </div>
            </div>

            {/* Daily Sessions Counter */}
            {subscriptionStatus !== 'active' && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${user.dailySessionsUsed >= 1 ? 'bg-red-400' : 'bg-green-400'}`} />
                <div className="text-center">
                  <div className="text-white font-bold text-sm">{Math.max(0, 1 - user.dailySessionsUsed)}</div>
                  <div className="text-white/60 text-xs">Left</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile XP Bar - Only show on small screens */}
        <div className="md:hidden mt-2">
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-orange-400" />
            <div className="flex-1">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentXP}%` }}
                />
              </div>
            </div>
            <span className="text-orange-400 font-semibold text-xs">{currentXP}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}