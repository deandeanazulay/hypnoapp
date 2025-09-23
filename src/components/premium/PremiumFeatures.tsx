import React from 'react';
import { Crown, Zap, Sparkles, Shield, HeadphonesIcon, Infinity } from 'lucide-react';

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  tier: 'pro' | 'premium' | 'ultimate';
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: 'unlimited-sessions',
    name: 'Unlimited Sessions',
    description: 'Access to unlimited daily hypnosis sessions',
    icon: <Infinity size={20} className="text-teal-400" />,
    available: false,
    tier: 'pro'
  },
  {
    id: 'premium-voices',
    name: 'Premium AI Voices',
    description: 'High-quality, natural-sounding voice guides',
    icon: <HeadphonesIcon size={20} className="text-purple-400" />,
    available: false,
    tier: 'pro'
  },
  {
    id: 'custom-protocols',
    name: 'Custom Protocols',
    description: 'Create and save your own hypnosis journeys',
    icon: <Sparkles size={20} className="text-yellow-400" />,
    available: false,
    tier: 'premium'
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights into your transformation',
    icon: <Zap size={20} className="text-orange-400" />,
    available: false,
    tier: 'premium'
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: '24/7 premium customer support',
    icon: <Shield size={20} className="text-green-400" />,
    available: false,
    tier: 'ultimate'
  }
];

interface PremiumFeaturesProps {
  currentTier: 'free' | 'pro' | 'premium' | 'ultimate';
  onUpgrade: (tier: string) => void;
}

export default function PremiumFeatures({ currentTier = 'free', onUpgrade }: PremiumFeaturesProps) {
  const getFeatureStatus = (feature: PremiumFeature) => {
    const tierLevels = { free: 0, pro: 1, premium: 2, ultimate: 3 };
    const currentLevel = tierLevels[currentTier];
    const requiredLevel = tierLevels[feature.tier];
    
    return currentLevel >= requiredLevel;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'premium': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'ultimate': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <Crown size={24} className="text-yellow-400" />
        <h3 className="text-white font-semibold text-xl">Premium Features</h3>
      </div>
      
      <div className="space-y-3">
        {premiumFeatures.map((feature) => {
          const isAvailable = getFeatureStatus(feature);
          const tierColor = getTierColor(feature.tier);
          
          return (
            <div
              key={feature.id}
              className={`glass-card p-4 bg-gradient-to-br ${tierColor} transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-medium">{feature.name}</h4>
                    {isAvailable ? (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-medium">
                        {feature.tier.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mb-3">{feature.description}</p>
                  
                  {!isAvailable && (
                    <button
                      onClick={() => onUpgrade(feature.tier)}
                      className="glass-button text-xs py-2 px-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold rounded-lg hover:scale-105 transition-transform duration-200"
                    >
                      Upgrade to {feature.tier.charAt(0).toUpperCase() + feature.tier.slice(1)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}