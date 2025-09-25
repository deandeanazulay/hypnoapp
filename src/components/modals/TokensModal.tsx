import React, { useState } from 'react';
import { Coins, Gift, Zap, Plus, ShoppingBag, Star } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';

export default function TokensModal() {
  const { modals, closeModal } = useAppStore();
  const { user } = useGameState();
  const [tokenPackages, setTokenPackages] = useState<any[]>([]);
  const [tokenUses, setTokenUses] = useState<any[]>([]);

  const handlePurchaseTokens = (packageInfo: any) => {
    // TODO: Integrate with Stripe for token purchases
    console.log('Purchase tokens:', packageInfo);
  };

  return (
    <ModalShell
      isOpen={modals.tokens}
      onClose={() => closeModal('tokens')}
      title="Libero Tokens"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <Coins size={20} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">{user?.tokens || 0} Tokens</h3>
              <p className="text-white/70 text-sm">Your current balance</p>
            </div>
          </div>
          
          {(user?.tokens || 0) < 10 && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mt-3">
              <p className="text-amber-300 text-sm font-medium">
                ⚠️ Low balance - Consider getting more tokens for premium features
              </p>
            </div>
          )}
        </div>

        {/* Token Uses */}
        {tokenUses.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <Gift size={16} className="text-teal-400" />
              <span>What You Can Do</span>
            </h4>
            <div className="space-y-3">
              {tokenUses.map((use, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {use.icon}
                    <span className="text-white/80 text-sm">{use.action}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Coins size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 font-medium text-sm">{use.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token Packages */}
        {tokenPackages.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-white font-medium">Get More Tokens</h4>
            <div className="grid grid-cols-2 gap-3">
              {tokenPackages.map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => handlePurchaseTokens(pkg)}
                  className={`relative bg-gradient-to-br rounded-xl p-4 border transition-all duration-300 hover:scale-105 hover:border-white/30 ${
                    pkg.popular 
                      ? 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40 ring-2 ring-yellow-500/30'
                      : 'from-white/5 to-gray-500/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full text-black text-xs font-bold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Coins size={24} className="text-yellow-400 mr-2" />
                      <span className="text-white font-bold text-lg">{pkg.amount}</span>
                      {pkg.bonus > 0 && (
                        <span className="text-green-400 text-sm ml-1">+{pkg.bonus}</span>
                      )}
                    </div>
                    <div className="text-white/80 font-semibold mb-1">{pkg.price}</div>
                    {pkg.bonus > 0 && (
                      <div className="text-green-400 text-xs font-medium">
                        Bonus: {pkg.bonus} tokens
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
              <Coins size={24} className="text-yellow-400" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Token Packages Coming Soon</h3>
            <p className="text-white/70 text-sm">Token purchasing will be available in a future update</p>
          </div>
        )}

        {/* Earning Tokens */}
        <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Star size={16} className="text-green-400" />
            <span>Earn Free Tokens</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Complete daily session</span>
              <span className="text-green-400 font-medium">+2 tokens</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">7-day streak</span>
              <span className="text-green-400 font-medium">+10 tokens</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Level up</span>
              <span className="text-green-400 font-medium">+5 tokens</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Share the app</span>
              <span className="text-green-400 font-medium">+15 tokens</span>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}