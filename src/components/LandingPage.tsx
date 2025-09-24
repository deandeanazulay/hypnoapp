import React from 'react';
import { Orb } from './Orb';

interface LandingPageProps {
  onEnterApp: () => void;
  onShowAuth: () => void;
}

export default function LandingPage({ onEnterApp, onShowAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">✦</span>
          </div>
          <span className="text-xl font-bold">Libero</span>
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex space-x-3">
          <button 
            onClick={onShowAuth}
            className="px-4 py-2 text-white hover:text-cyan-400 transition-colors"
          >
            Try Free
          </button>
          <button 
            onClick={onEnterApp}
            className="px-6 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-4">
        {/* Orb */}
        <div className="mb-2 md:mb-4">
          <Orb
            egoState="sage"
            size={360}
            className="md:w-[520px] md:h-[520px]"
          />
        </div>

        {/* Title and Description */}
        <div className="text-center mb-4 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Libero
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-2">
            The Hypnotist That Frees Minds
          </p>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl">
            Transform limiting beliefs through archetypal hypnosis. Channel ancient wisdom.
            Unlock your authentic power.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-8">
          <button 
            onClick={onEnterApp}
            className="px-8 py-3 bg-cyan-400 text-black rounded-xl font-semibold hover:bg-cyan-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>▶</span> Experience Free
          </button>
          <button 
            onClick={onShowAuth}
            className="px-8 py-3 border border-gray-600 text-white rounded-xl font-semibold hover:border-cyan-400 transition-colors"
          >
            Unlock Everything
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 md:gap-8 text-center text-xs md:text-sm">
          <div>
            <div className="text-lg md:text-2xl font-bold text-cyan-400">50K+</div>
            <div className="text-gray-400">Transformations</div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold text-cyan-400">4.9★</div>
            <div className="text-gray-400">App Store Rating</div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold text-cyan-400">89%</div>
            <div className="text-gray-400">Report Breakthroughs</div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold text-cyan-400">15</div>
            <div className="text-gray-400">Archetypal Guides</div>
          </div>
        </div>
      </div>
    </div>
  );
}