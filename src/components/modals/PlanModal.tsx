import React from 'react';
import { Crown, Check, Zap, Users, Brain, Mic, Star, X } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';

export default function PlanModal() {
  const { modals, closeModal } = useAppStore();
  const { user } = useGameState();

  const features = {
    free: [
      '1 session per day',
      'Basic ego states (5)',
      'Quick protocols',
      'Progress tracking'
    ],
    premium: [
      'Unlimited sessions',
      'All ego states (15+)',
      'AI voice guidance',
      'Custom protocols',
      'Advanced analytics',
      'Priority support',
      'Exclusive content',
      'Session recording'
    ]
  };

  const handleUpgrade = () => {
    // TODO: Integrate with Stripe checkout
    console.log('Upgrade to premium');
  };

  return (
    <ModalShell
      isOpen={modals.plan}
      onClose={() => closeModal('plan')}
      title="Libero Plans"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Current Plan Status */}
        <div className={`rounded-xl p-4 border ${
          user?.plan === 'free' 
            ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20'
            : 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            {user?.plan === 'free' ? (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Star size={16} className="text-blue-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <Crown size={16} className="text-yellow-400" />
              </div>
            )}
            <div>
              <h3 className="text-white font-semibold">
                {user?.plan === 'free' ? 'Free Plan' : 'Premium Plan'}
              </h3>
              <p className="text-white/70 text-sm">
                {user?.plan === 'free' 
                  ? `${Math.max(0, 1 - (user?.daily_sessions_used || 0))} sessions remaining today`
                  : 'Unlimited access to all features'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Free Plan */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
                <Star size={20} className="text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Free</h3>
              <p className="text-white/70 text-sm">Perfect for getting started</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm">
                  <Check size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
            
            {user?.plan === 'free' && (
              <div className="text-center">
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 font-medium text-sm">
                  Current Plan
                </div>
              </div>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-6 border border-yellow-500/20 relative overflow-hidden">
            {/* Premium Badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full border-2 border-black flex items-center justify-center">
              <Crown size={12} className="text-black" />
            </div>
            
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mx-auto mb-3">
                <Crown size={20} className="text-yellow-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Premium</h3>
              <p className="text-white/70 text-sm">Unlimited transformation</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {features.premium.map((feature, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm">
                  <Check size={16} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
            
            {user?.plan === 'free' ? (
              <button
                onClick={handleUpgrade}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-yellow-400/25"
              >
                Upgrade Now
              </button>
            ) : (
              <div className="text-center">
                <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 font-medium text-sm">
                  Current Plan
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Brain size={16} className="text-teal-400" />
            <span>Why Upgrade?</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-white/80">No daily session limits</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mic size={14} className="text-green-400" />
              <span className="text-white/80">AI voice conversations</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users size={14} className="text-purple-400" />
              <span className="text-white/80">Exclusive ego states</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain size={14} className="text-blue-400" />
              <span className="text-white/80">Advanced analytics</span>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}