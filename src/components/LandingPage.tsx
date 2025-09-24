import React from 'react';
import Orb from './Orb';

interface LandingPageProps {
  onEnterApp: () => void;
  onShowAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onShowAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">✦</span>
          </div>
          <span className="text-white text-lg font-semibold">Libero</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onShowAuth}
            className="text-gray-300 hover:text-white transition-colors text-sm px-3 py-1"
          >
            Try Free
          </button>
          <button 
            onClick={onEnterApp}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-violet-600 transition-all text-sm font-medium"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-8 text-center">
        {/* Orb */}
        <div className="mb-6">
          <Orb 
            egoState="sage"
            size={{ mobile: 810, desktop: 1170 }}
            energy={0.7}
            depth={3}
            breathing="rest"
            isActive={true}
          />
        </div>

        {/* Title and Tagline */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 mb-4">
            Libero
          </h1>
          <h2 className="text-xl sm:text-2xl text-gray-300 mb-6 font-light">
            The Hypnotist That Frees Minds
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform limiting beliefs through archetypal hypnosis. Channel ancient wisdom. 
            Unlock your authentic power.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button 
            onClick={onEnterApp}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-8 py-3 rounded-xl hover:from-cyan-600 hover:to-violet-600 transition-all font-medium text-lg shadow-lg"
          >
            Begin Your Journey
          </button>
          <button 
            onClick={onShowAuth}
            className="border border-gray-600 text-gray-300 px-8 py-3 rounded-xl hover:border-gray-500 hover:text-white transition-all font-medium text-lg"
          >
            Try Free Session
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
          <div>
            <div className="text-2xl font-bold text-cyan-400">15+</div>
            <div className="text-sm text-gray-400">Ego States</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-violet-400">100k+</div>
            <div className="text-sm text-gray-400">Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-400">92%</div>
            <div className="text-sm text-gray-400">Breakthrough Rate</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;