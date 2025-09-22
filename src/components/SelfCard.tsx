import React from 'react';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useGameState } from './GameStateManager';

export default function SelfCard() {
  const { user } = useGameState();

  return (
    <div className="mx-6 mb-6">
      <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        {/* Animated background glow */}
        <div className={`absolute inset-0 bg-gradient-to-br animate-pulse ${
          user.currentState === 'transcendent' ? 'from-purple-500/20 via-teal-500/15 to-orange-500/20' :
          user.currentState === 'deep' ? 'from-teal-500/15 via-blue-500/10 to-purple-500/15' :
          user.currentState === 'focused' ? 'from-orange-500/15 via-amber-500/10 to-red-500/15' :
          user.currentState === 'stressed' ? 'from-red-500/20 via-orange-500/15 to-yellow-500/20' :
          'from-teal-500/10 via-purple-500/10 to-orange-500/10'
        }`} />
        
        {/* Content centered without orb */}
        <div className="relative flex flex-col items-center">
          <h2 className="text-white text-2xl font-semibold mb-2 tracking-wide">SELF</h2>
          <p className="text-white/60 text-sm mb-6">
            Level {user.level} • {user.experience % 100}/100 XP
          </p>
          
          {/* Action buttons */}
          <div className="flex space-x-8">
            <button className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200">
              <Heart size={24} />
            </button>
            <button className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200">
              <MessageCircle size={24} />
            </button>
            <button className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200">
              <Bookmark size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}