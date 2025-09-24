import React from 'react'
import Orb from './Orb'

interface LandingPageProps {
  onEnterApp: () => void
  onShowAuth: () => void
}

export default function LandingPage({ onEnterApp, onShowAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">✦</span>
          </div>
          <span className="text-xl font-semibold">Libero</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onShowAuth}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Try Free
          </button>
          <button 
            onClick={onEnterApp}
            className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content - Single Screen Layout */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-6">
        {/* Orb - Centered and 1.5x bigger */}
        <div className="mb-2">
          <Orb 
            egoState="sage"
            size={360}
            className="w-[360px] h-[360px] md:w-[520px] md:h-[520px]"
          />
        </div>

        {/* Title and Description */}
        <div className="text-center space-y-3 mb-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Libero
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium">
            The Hypnotist That Frees Minds
          </p>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl">
            Transform limiting beliefs through archetypal hypnosis. Channel ancient wisdom. Unlock your authentic power.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <button 
            onClick={onEnterApp}
            className="bg-cyan-500 hover:bg-cyan-400 px-8 py-3 rounded-full font-medium transition-colors flex items-center space-x-2"
          >
            <span>▶</span>
            <span>Experience Free</span>
            <span>›</span>
          </button>
          <button 
            onClick={onShowAuth}
            className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-full font-medium transition-colors border border-gray-600"
          >
            Unlock Everything
          </button>
        </div>

        {/* Feature Stats - Compact */}
        <div className="grid grid-cols-4 gap-6 md:gap-12 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400">50K+</div>
            <div className="text-xs md:text-sm text-gray-400">Transformations</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400">4.9★</div>
            <div className="text-xs md:text-sm text-gray-400">App Store Rating</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400">89%</div>
            <div className="text-xs md:text-sm text-gray-400">Report Breakthroughs</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400">15</div>
            <div className="text-xs md:text-sm text-gray-400">Archetypal Guides</div>
          </div>
        </div>
      </div>
    </div>
  )
}