import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Wand2, Target, Brain, Heart } from 'lucide-react';
import PageShell from '../layout/PageShell';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';

interface CreateScreenProps {
  onProtocolCreate: (protocol: any) => void;
  onShowAuth: () => void;
}

interface Protocol {
  name: string;
  induction: string;
  deepener: string;
  goals: string[];
  metaphors: string[];
  duration: number;
}

export default function CreateScreen({ onProtocolCreate, onShowAuth }: CreateScreenProps) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useAppStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [protocol, setProtocol] = useState<Protocol>({
    name: '',
    induction: '',
    deepener: '',
    goals: [],
    metaphors: [],
    duration: 15
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    if (!protocol.name.trim()) {
      showToast({ type: 'warning', message: 'Please enter a protocol name' });
      return;
    }

    onProtocolCreate(protocol);
    showToast({ type: 'success', message: 'Protocol created successfully!' });
    
    // Reset wizard
    setCurrentStep(1);
    setProtocol({
      name: '',
      induction: '',
      deepener: '',
      goals: [],
      metaphors: [],
      duration: 15
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return protocol.name.trim().length > 0;
      case 2: return protocol.induction.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-teal-400 flex items-center justify-center mx-auto mb-4">
                <Wand2 size={24} className="text-black" />
              </div>
              <h2 className="text-white text-2xl font-light mb-2">Name Your Journey</h2>
              <p className="text-white/70">What transformation will this create?</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={protocol.name}
                onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Confidence Boost Session"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white text-lg placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Duration</label>
                  <select
                    value={protocol.duration}
                    onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400/50 transition-all"
                  >
                    <option value={5} className="bg-black">5 minutes</option>
                    <option value={10} className="bg-black">10 minutes</option>
                    <option value={15} className="bg-black">15 minutes</option>
                    <option value={20} className="bg-black">20 minutes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center mx-auto mb-4">
                <Target size={24} className="text-black" />
              </div>
              <h2 className="text-white text-2xl font-light mb-2">Design the Induction</h2>
              <p className="text-white/70">How will you guide someone into trance?</p>
            </div>

            <div className="space-y-4">
              <textarea
                value={protocol.induction}
                onChange={(e) => setProtocol(prev => ({ ...prev, induction: e.target.value }))}
                placeholder="Describe your induction technique... e.g., 'Close your eyes and take three deep breaths...'"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/15 transition-all h-40 resize-none"
              />

              <div className="grid grid-cols-3 gap-2">
                {['Progressive Relaxation', 'Rapid Induction', 'Breath Focus'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setProtocol(prev => ({ 
                      ...prev, 
                      induction: `${template} technique: ${prev.induction || 'Begin your session...'}`
                    }))}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-4">
                <Heart size={24} className="text-black" />
              </div>
              <h2 className="text-white text-2xl font-light mb-2">Set Your Goals</h2>
              <p className="text-white/70">What specific changes will this create?</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['Stress Relief', 'Confidence', 'Focus', 'Creativity', 'Sleep', 'Healing'].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      const newGoals = protocol.goals.includes(goal)
                        ? protocol.goals.filter(g => g !== goal)
                        : [...protocol.goals, goal];
                      setProtocol(prev => ({ ...prev, goals: newGoals }));
                    }}
                    className={`px-4 py-3 rounded-xl border transition-all hover:scale-105 ${
                      protocol.goals.includes(goal)
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>

              <textarea
                value={protocol.deepener}
                onChange={(e) => setProtocol(prev => ({ ...prev, deepener: e.target.value }))}
                placeholder="Optional: Add any specific deepening technique or metaphors..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-rose-400/50 focus:bg-white/15 transition-all h-32 resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageShell
      body={
        <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-center p-6">
            {/* Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      step === currentStep
                        ? 'border-purple-400 bg-purple-400/20 text-purple-400'
                        : step < currentStep
                        ? 'border-teal-400 bg-teal-400/20 text-teal-400'
                        : 'border-white/30 text-white/50'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        step < currentStep ? 'bg-teal-400' : 'bg-white/30'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <GlassCard variant="premium" className="max-w-2xl mx-auto p-8">
              {renderStep()}
            </GlassCard>

            {/* Navigation */}
            <div className="flex justify-between items-center max-w-2xl mx-auto mt-8">
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                disabled={currentStep === 1}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </div>
              </GlassButton>

              <div className="text-white/60 text-sm">
                Step {currentStep} of 3
              </div>

              {currentStep < 3 ? (
                <GlassButton
                  onClick={handleNext}
                  variant="primary"
                  disabled={!canProceed()}
                >
                  <div className="flex items-center space-x-2">
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </div>
                </GlassButton>
              ) : (
                <GlassButton
                  onClick={handleComplete}
                  variant="primary"
                >
                  <div className="flex items-center space-x-2">
                    <Wand2 size={16} />
                    <span>Create</span>
                  </div>
                </GlassButton>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}