import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import WebGLOrb from './WebGLOrb';
import InductionPlayer from './InductionPlayer';
import DeepeningInterface from './DeepeningInterface';
import AIVoiceSystem from './AIVoiceSystem';

interface WizardViewProps {
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 'prep' | 'breathing-intro' | 'box-breathing' | 'induction' | 'deepening' | 'integration';

export default function WizardView({ onComplete, onCancel }: WizardViewProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('prep');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
  const [breathCount, setBreathCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<any>(null);

  // Focus management
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Box breathing cycle (4-4-4-4)
  useEffect(() => {
    if (currentStep === 'box-breathing' && isPlaying) {
      const phases: Array<{ phase: typeof breathPhase; duration: number }> = [
        { phase: 'inhale', duration: 4000 },
        { phase: 'hold', duration: 4000 },
        { phase: 'exhale', duration: 4000 },
        { phase: 'rest', duration: 4000 }
      ];

      let phaseIndex = 0;
      let cycleCount = 0;

      const runCycle = () => {
        const currentPhase = phases[phaseIndex];
        setBreathPhase(currentPhase.phase);

        // Update orb state
        if (orbRef.current) {
          orbRef.current.updateState({
            breathing: currentPhase.phase,
            depth: 1 + (cycleCount * 0.3)
          });
        }

        setTimeout(() => {
          phaseIndex = (phaseIndex + 1) % phases.length;
          
          if (phaseIndex === 0) {
            cycleCount++;
            setBreathCount(cycleCount);
            
            if (cycleCount >= 3) {
              setIsPlaying(false);
              setCurrentStep('induction');
              return;
            }
          }
          
          if (isPlaying) runCycle();
        }, currentPhase.duration);
      };

      runCycle();
    }
  }, [currentStep, isPlaying]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const startBoxBreathing = () => {
    setCurrentStep('box-breathing');
    setIsPlaying(true);
    setBreathCount(0);
  };

  const handleInductionComplete = () => {
    setCurrentStep('deepening');
  };

  const handleDeepeningComplete = () => {
    setCurrentStep('integration');
  };

  // Full-screen modes (induction, deepening)
  if (currentStep === 'induction') {
    return (
      <InductionPlayer 
        onComplete={handleInductionComplete}
        onCancel={onCancel}
      />
    );
  }

  if (currentStep === 'deepening') {
    return (
      <DeepeningInterface 
        onComplete={handleDeepeningComplete}
        onCancel={onCancel}
      />
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'prep':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-6">Choose Your Journey</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Select your path to transformation and deeper states.
            </p>
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-4 mb-8">
              <p className="text-amber-200 text-sm">
                ⚠️ Seated only. Not while driving, in water, or standing. Stop if dizzy.
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              {/* Quick Box Breathing */}
              <button
                onClick={() => setCurrentStep('breathing-intro')}
                className="w-full px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                🫁 Box Breathing (2 min)
              </button>
              
              {/* Full Induction */}
              <button
                onClick={() => setCurrentStep('induction')}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                🌀 Full Induction (10 min)
              </button>
              
              {/* Deep Work */}
              <button
                onClick={() => setCurrentStep('deepening')}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
              >
                🧠 Deep Work (15 min)
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        );

      case 'breathing-intro':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-6">Box Breathing</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Follow the orb's rhythm: Inhale 4 → Hold 4 → Exhale 4 → Rest 4
            </p>
            <button
              onClick={startBoxBreathing}
              className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
            >
              Start Box Breathing
            </button>
          </div>
        );

      case 'box-breathing':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-4">Box Breathing</h2>
            <p className="text-teal-400 text-lg mb-8 capitalize">
              {breathPhase === 'rest' ? 'Rest' : breathPhase}
            </p>
            <div className="text-white/60 text-sm mb-4">
              Cycle {breathCount} of 3
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setIsPlaying(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300"
              >
                Pause
              </button>
              <button
                onClick={() => setCurrentStep('induction')}
                className="px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full text-black font-medium transition-all duration-300"
              >
                Go Deeper
              </button>
            </div>
          </div>
        );

      case 'integration':
        return (
          <div className="text-center">
            <h2 className="text-white text-2xl font-light mb-6">Session Complete</h2>
            <p className="text-teal-400 text-lg mb-8">
              Level +1 • Streak +1 • Afterglow activated
            </p>
            <button
              onClick={onComplete}
              className="px-8 py-4 bg-gradient-to-r from-green-400 to-teal-400 rounded-full text-black font-semibold text-lg hover:scale-105 transition-transform duration-200"
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
    <div className="fixed inset-0 z-100">
      {/* Backdrop - z-100 */}
      <div 
        className="absolute inset-0 bg-black/55 backdrop-blur-sm z-100"
        onClick={handleBackdropClick}
      />
      
      {/* Panel Container - z-110 */}
      <div className="relative z-110 flex items-center justify-center min-h-screen p-6">
        <div 
          ref={panelRef}
          className="bg-black/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md w-full relative"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button - z-120 */}
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-120"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Orb inside panel - z-115 */}
          {currentStep === 'box-breathing' && (
            <div className="mb-8 z-115 relative">
              <WebGLOrb 
                ref={orbRef}
                onTap={() => {}}
                className="pointer-events-none"
                breathPhase={breathPhase}
                size={200}
              />
            </div>
          )}

          {/* Panel content - z-120 */}
          <div className="relative z-120">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* AI Voice System - active during breathing and deeper work */}
      {(currentStep === 'box-breathing' || currentStep === 'induction' || currentStep === 'deepening') && (
        <AIVoiceSystem 
          isActive={true}
          sessionType="unified"
          onStateChange={(state) => {
            if (orbRef.current) {
              orbRef.current.updateState(state);
            }
          }}
          orbRef={orbRef}
        />
      )}
    </div>
  );
}