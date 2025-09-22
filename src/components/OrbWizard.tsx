import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import ConnectedOrb from './ConnectedOrb';
import { useGameState } from './GameStateManager';

interface OrbWizardProps {
  onComplete: (mode: 'induction' | 'deepening') => void;
  onCancel: () => void;
}

type WizardStep = 'prep' | 'induction' | 'deepening' | 'integration' | 'exit';

interface SessionData {
  step: WizardStep;
  duration: number;
  result: {
    installed?: string[];
    muted?: string[];
    anchors?: string[];
    microMission?: string;
  };
}

export default function OrbWizard({ onComplete, onCancel }: OrbWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('prep');
  const [sessionStart] = useState(Date.now());
  const [stepTimer, setStepTimer] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0);
  const { updateUserState } = useGameState();
  const [sessionData, setSessionData] = useState<SessionData>({
    step: 'prep',
    duration: 0,
    result: {}
  });

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 240); // 8 second cycle
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Step timer
  useEffect(() => {
    if (currentStep === 'induction' || currentStep === 'integration') {
      const interval = setInterval(() => {
        setStepTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Auto-progress from induction
  useEffect(() => {
    if (currentStep === 'induction' && stepTimer >= 30) {
      handleNext();
    }
  }, [currentStep, stepTimer]);

  const handleNext = () => {
    const steps: WizardStep[] = ['prep', 'induction', 'deepening', 'integration', 'exit'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setStepTimer(0);
      
      // Update session data
      setSessionData(prev => ({
        ...prev,
        step: steps[currentIndex + 1],
        duration: Date.now() - sessionStart
      }));
    }
  };

  const handleComplete = () => {
    // Save final session data
    const finalData = {
      ...sessionData,
      duration: Date.now() - sessionStart,
      result: {
        installed: ['Confidence'],
        muted: ['Fear: Rejection'],
        anchors: ['Breath → Shoulders Drop'],
        microMission: 'Stand tall. Whisper "I move first."'
      }
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('lastSession', JSON.stringify(finalData));
    
    onComplete('unified');
  };

  const breathScale = 1 + Math.sin(breathPhase * 0.026) * 0.15; // 8 second cycle
  const breathOpacity = 0.6 + Math.sin(breathPhase * 0.026) * 0.3;

  const renderStep = () => {
    switch (currentStep) {
      case 'prep':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-6">Ready to begin your journey?</h2>
            <p className="text-white/80 text-lg mb-4 leading-relaxed">
              Choose your path to transformation.
            </p>
            <p className="text-white/80 text-lg mb-12 leading-relaxed">
              I'll guide you every step of the way.
            </p>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                Begin
              </button>
              <button
                onClick={onCancel}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case 'induction':
        return (
          <div className="text-center">
            {/* Breathing Orb */}
            <ConnectedOrb 
              onTap={() => {}}
              size={280}
              showHint={false}
            />

            <div className="mb-8">
              <p className="text-white/60 text-sm mb-2">Follow the glow</p>
              <p className="text-white text-xl font-light">Follow the breathing rhythm</p>
            </div>

            <div className="text-teal-400 text-sm">
              {Math.max(0, 30 - stepTimer)}s remaining
            </div>
          </div>
        );

      case 'deepening':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-8">AI-Guided Journey</h2>
            <p className="text-white/80 text-lg mb-12">I'll guide you through breathing, deepening, and transformation work.</p>
            
            <div className="mb-8">
              <div className="w-full p-6 bg-gradient-to-br from-teal-500/20 via-purple-500/20 to-orange-500/20 rounded-2xl border border-white/10">
                <h3 className="text-white text-xl font-semibold mb-2">🤖 Complete AI Experience</h3>
                <p className="text-white/70 text-sm">Breathing induction → Voice interaction → Belief work → Integration</p>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => onComplete('unified')}
                className="px-8 py-4 bg-gradient-to-r from-teal-400 to-purple-400 rounded-full text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                Begin Journey
              </button>
              <button onClick={onCancel} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300">
                Cancel
              </button>
            </div>
          </div>
        );

      case 'integration':
        const missionProgress = Math.min(stepTimer / 60, 1);
        const circumference = 2 * Math.PI * 80;
        const strokeDashoffset = circumference - (missionProgress * circumference);

        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-6">Micro-mission</h2>
            
            {/* Timer Ring */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 176 176">
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  fill="none"
                  stroke="url(#missionGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="missionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-3xl font-light">
                  {Math.max(0, 60 - stepTimer)}
                </div>
              </div>
            </div>

            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Stand tall. Whisper "I move first."
            </p>

            {stepTimer >= 60 && (
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-teal-400 rounded-full text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                Complete
              </button>
            )}
          </div>
        );

      case 'exit':
        return (
          <div className="text-center">
            {/* Success orb */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 animate-pulse blur-xl" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400/80 via-teal-400/80 to-blue-400/80 flex items-center justify-center">
                <Check size={48} className="text-black" />
              </div>
            </div>

            <h2 className="text-white text-2xl font-light mb-4">Session saved</h2>
            <p className="text-teal-400 text-lg mb-2">Confidence on</p>
            <p className="text-orange-400 text-lg mb-8">Fear tuned down</p>

            <button
              onClick={handleComplete}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300"
            >
              Return Home
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)'
        }}
      />
      
      {/* Close button */}
      {currentStep === 'prep' && (
        <button
          onClick={onCancel}
          className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}