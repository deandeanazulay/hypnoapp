import React from 'react';
import { TrendingUp, Calendar, Target, Award, Crown, Zap, Coins } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { paymentService, STRIPE_PRODUCTS } from '../../lib/stripe';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';

interface GlobalHUDProps {
  onShowAuth: () => void;
}

export default function GlobalHUD({ onShowAuth }: GlobalHUDProps) {
  const { user } = useGameState();
  const { activeEgoState, openEgoModal, showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  const currentState = getEgoState(activeEgoState);
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<'free' | 'active' | 'cancelled' | 'past_due'>('free');
  const [showPricingModal, setShowPricingModal] = React.useState(false);
  const [showTokenShop, setShowTokenShop] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const currentXP = user.experience % 100;

  React.useEffect(() => {
    paymentService.getSubscriptionStatus().then(setSubscriptionStatus);
  }, []);

  const handleUpgrade = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      onShowAuth();
      showToast({
        type: 'warning',
        message: 'Please sign in to upgrade to premium',
        duration: 3000
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

  return (
    <>
      <div data-hud className="w-full bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          
          {/* Left Section - User Stats */}
          <div className="flex items-center space-x-4">
            
            {/* Current Ego State - Compact */}
            <button 
              onClick={openEgoModal}
              className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-all duration-300 hover:scale-105 cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentState.color} flex items-center justify-center border border-white/30 shadow-lg`}>
                <span className="text-sm">{currentState.icon}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-semibold text-sm group-hover:text-teal-400 transition-colors">{currentState.name}</div>
                <div className="text-white/60 text-xs">{currentState.role.split(',')[0]}</div>
              </div>
            </button>

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
                      className="h-full bg-gradient-to-r from-orange-400 to-teal-400 rounded-full transition-all duration-500 relative overflow-hidden"
                      style={{ width: `${currentXP}%` }}
                    >
                      {/* XP bar shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
                    </div>
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
            <button 
              onClick={() => setShowTokenShop(true)}
              className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-all duration-300 hover:scale-105 cursor-pointer group"
            >
              <Coins size={16} className="text-yellow-400" />
              <div className="text-center">
                <div className="text-white font-bold text-sm group-hover:text-yellow-400 transition-colors">{user.tokens}</div>
                <div className="text-white/60 text-xs">Tokens</div>
              </div>
            </button>

            {/* Premium Status */}
            <button 
              onClick={() => subscriptionStatus === 'free' ? setShowPricingModal(true) : null}
              className={`flex items-center space-x-2 transition-all duration-300 ${subscriptionStatus === 'free' ? 'hover:bg-white/10 rounded-lg px-2 py-1 hover:scale-105 cursor-pointer group' : 'cursor-default'}`}
            >
              <Crown size={16} className={subscriptionStatus === 'active' ? 'text-teal-400' : 'text-white/40'} />
              <div className="text-center">
                <div className={`font-bold text-sm ${subscriptionStatus === 'active' ? 'text-teal-400' : 'text-white/60 group-hover:text-teal-400'} transition-colors`}>
                  {subscriptionStatus === 'active' ? 'PRO' : 'FREE'}
                </div>
                <div className="text-white/60 text-xs">Plan</div>
              </div>
            </button>

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

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPricingModal(false)} />
          
          <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-light">Upgrade to Premium</h2>
              <button onClick={() => setShowPricingModal(false)} className="text-white/60 hover:text-white">
                ×
              </button>
            </div>

            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl p-6 border border-teal-500/30 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Crown size={24} className="text-teal-400" />
                <h3 className="text-white text-lg font-semibold">Mystic Plan</h3>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-white/90 text-sm">
                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>
                  Unlimited sessions
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>
                  All 15 archetypal guides
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>
                  Advanced orb experiences
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>
                  Custom protocol builder
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-teal-400 mb-1">$27<span className="text-lg">/month</span></div>
                <p className="text-white/80">Unlock your full potential</p>
              </div>
            </div>
            
            <button
              onClick={handleUpgrade}
              disabled={isProcessingPayment}
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      )}

      {/* Token Shop Modal */}
      {showTokenShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowTokenShop(false)} />
          
          <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-light">Token Shop</h2>
              <button onClick={() => setShowTokenShop(false)} className="text-white/60 hover:text-white">
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins size={20} className="text-yellow-400" />
                    <div>
                      <div className="text-white font-semibold">Token Boost Pack</div>
                      <div className="text-yellow-400/80 text-sm">100 tokens</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-yellow-400/20 border border-yellow-400/40 rounded-lg text-yellow-400 hover:bg-yellow-400/30 transition-all">
                    $2.99
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coins size={20} className="text-orange-400" />
                    <div>
                      <div className="text-white font-semibold">Token Mega Pack</div>
                      <div className="text-orange-400/80 text-sm">500 tokens</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-400/20 border border-orange-400/40 rounded-lg text-orange-400 hover:bg-orange-400/30 transition-all">
                    $9.99
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/70 text-sm text-center">
                Tokens can be used to unlock special features and customizations
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}