import React from 'react';
import { Brain, Star, Shield, Heart } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onShowAuth: () => void;
}

export default function LandingPage({ onEnterApp, onShowAuth }: LandingPageProps) {
  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/20" />
        
        {/* Stars */}
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-20 animate-pulse"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg px-6">
        {/* Logo/Orb */}
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 opacity-20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 flex items-center justify-center">
            <Brain size={32} className="text-black" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-light text-white mb-4 bg-gradient-to-br from-white to-teal-200 bg-clip-text text-transparent">
          Libero
        </h1>
        
        <p className="text-xl text-white/80 font-light mb-2">
          The Hypnotist That Frees Minds
        </p>
        
        <p className="text-white/60 mb-8 leading-relaxed">
          Transform your consciousness through personalized hypnosis guided by archetypal ego states
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Shield size={20} className="text-teal-400 mx-auto mb-2" />
            <div className="text-white/80 text-sm font-medium">15 Ego States</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Star size={20} className="text-purple-400 mx-auto mb-2" />
            <div className="text-white/80 text-sm font-medium">AI Guidance</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Brain size={20} className="text-orange-400 mx-auto mb-2" />
            <div className="text-white/80 text-sm font-medium">Custom Protocols</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Heart size={20} className="text-rose-400 mx-auto mb-2" />
            <div className="text-white/80 text-sm font-medium">Voice Sessions</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onEnterApp}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-2xl shadow-teal-400/25"
          >
            Enter with Libero
          </button>
          
          <button
            onClick={onShowAuth}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
          >
            Sign In / Create Account
          </button>
        </div>

        {/* Tagline */}
        <p className="text-white/40 text-sm mt-6">
          🌌 Dissolve trance • Restore choice • Unlock freedom
        </p>
      </div>
    </div>
  );
}