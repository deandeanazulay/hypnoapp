// Beginner-Friendly Hypnotherapy Guide Component
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Heart, Shield, Star, Clock, HelpCircle } from 'lucide-react';
import { PROTOCOL_CATEGORIES, getRecommendedProtocols } from '../data/protocols';
import ModalShell from './layout/ModalShell';

interface BeginnerGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onProtocolSelect?: (protocol: any) => void;
}

export default function BeginnerGuide({ isOpen, onClose, onProtocolSelect }: BeginnerGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userNeeds, setUserNeeds] = useState<string[]>([]);

  const steps = [
    {
      title: 'Welcome to Hypnotherapy',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
              <Heart size={24} className="text-teal-400" />
            </div>
            <h3 className="text-white text-xl font-medium mb-3">You're in Safe Hands</h3>
          </div>
          
          <div className="space-y-3 text-white/80 text-sm leading-relaxed">
            <p>Hypnotherapy is a natural, safe state of focused relaxation where your mind becomes more open to positive suggestions.</p>
            <p>You remain in complete control throughout the entire process. You can open your eyes, move, or stop the session at any time.</p>
            <p>Think of it as a guided meditation with a specific purpose - helping you make positive changes in your life.</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
            <h4 className="text-white font-medium mb-2">What You'll Experience:</h4>
            <ul className="space-y-1 text-white/80 text-sm">
              <li>• Deep relaxation and calm</li>
              <li>• Gentle guidance and positive suggestions</li>
              <li>• A sense of peace and well-being</li>
              <li>• Natural awakening feeling refreshed</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'What Would You Like to Work On?',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-medium mb-2">Choose Your Focus Areas</h3>
            <p className="text-white/70 text-sm">Select all that apply to you right now</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'stress', name: 'Stress & Anxiety', icon: '🧘' },
              { id: 'sleep', name: 'Better Sleep', icon: '🌙' },
              { id: 'confidence', name: 'More Confidence', icon: '💪' },
              { id: 'habits', name: 'Change Habits', icon: '🔄' },
              { id: 'pain', name: 'Manage Pain', icon: '🩹' },
              { id: 'fears', name: 'Overcome Fears', icon: '🦋' },
              { id: 'performance', name: 'Improve Performance', icon: '🎯' },
              { id: 'emotions', name: 'Emotional Healing', icon: '💚' }
            ].map(need => (
              <button
                key={need.id}
                onClick={() => {
                  const newNeeds = userNeeds.includes(need.id)
                    ? userNeeds.filter(n => n !== need.id)
                    : [...userNeeds, need.id];
                  setUserNeeds(newNeeds);
                }}
                className={`p-4 rounded-xl border transition-all hover:scale-105 text-left ${
                  userNeeds.includes(need.id)
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-2">{need.icon}</div>
                <div className="text-sm font-medium">{need.name}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Your Recommended Protocols',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-medium mb-2">Perfect Starting Points</h3>
            <p className="text-white/70 text-sm">Based on your selections, here are the best protocols to begin with</p>
          </div>

          <div className="space-y-3">
            {getRecommendedProtocols().slice(0, 3).map(protocol => (
              <button
                key={protocol.id}
                onClick={() => onProtocolSelect?.(protocol)}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/20 hover:border-white/30 transition-all hover:scale-105 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{protocol.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-white/60" />
                    <span className="text-white/60 text-sm">{protocol.duration}m</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3">{protocol.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-400 rounded-full">
                    {protocol.difficulty}
                  </span>
                  <ChevronRight size={16} className="text-white/40" />
                </div>
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <h4 className="text-white font-medium mb-2">💡 Pro Tip</h4>
            <p className="text-white/80 text-sm">Start with one protocol and use it for a week before trying others. Consistency is more important than variety when building new neural pathways.</p>
          </div>
        </div>
      )
    },
    {
      title: 'Preparation & What to Expect',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <BookOpen size={24} className="text-purple-400" />
            </div>
            <h3 className="text-white text-xl font-medium">You're Ready to Begin!</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Shield size={16} className="text-blue-400" />
                <span>Before Each Session</span>
              </h4>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• Find a quiet, comfortable space</li>
                <li>• Turn off notifications and distractions</li>
                <li>• Set a clear intention for the session</li>
                <li>• Trust the process and be patient with yourself</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Star size={16} className="text-green-400" />
                <span>During the Session</span>
              </h4>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• Follow the guided instructions</li>
                <li>• Don't worry about doing it "perfectly"</li>
                <li>• Let your mind wander if it wants to</li>
                <li>• Trust that positive changes are happening</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Heart size={16} className="text-purple-400" />
                <span>After the Session</span>
              </h4>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• Take a few minutes to integrate the experience</li>
                <li>• Drink water and move gently</li>
                <li>• Notice any shifts in how you feel</li>
                <li>• Be patient - changes often happen gradually</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 2) {
      return userNeeds.length > 0;
    }
    return true;
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Hypnotherapy Guide for Beginners"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-1 rounded-full transition-all duration-300 ${
                  index + 1 <= currentStep ? 'bg-teal-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </div>
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  <span>Next</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200"
              >
                Start Your Journey
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
            <span className="text-white/60 text-sm">Step {currentStep} of {steps.length}</span>
          </div>
        </div>

        {/* Step Content */}
        <div>
          <h2 className="text-white text-2xl font-light mb-6 text-center">{currentStepData.title}</h2>
          {currentStepData.content}
        </div>
      </div>
    </ModalShell>
  );
}