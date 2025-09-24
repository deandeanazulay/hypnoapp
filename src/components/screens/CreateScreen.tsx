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
      case 2: return protocol.induction.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="">
            <div className="text-center">
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
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center mx-auto mb-4">
                <Target size={24} className="text-black" />
              </div>
              <h2 className="text-white text-2xl font-light mb-2">Choose Your Method</h2>
              <p className="text-white/70">How should Libero guide the journey?</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'progressive',
                  name: 'Progressive Relaxation',
                  description: 'Gentle, body-based induction perfect for beginners',
                  color: 'from-teal-500/20 to-cyan-500/20'
                },
                {
                  id: 'rapid',
                  name: 'Rapid (Elman)',
                  description: 'Quick, direct induction for experienced users',
                  color: 'from-yellow-500/20 to-orange-500/20'
                },
                {
                  id: 'breath',
                  name: 'Breath Work',
                  description: 'Breathing-focused technique for mindfulness',
                  color: 'from-green-500/20 to-teal-500/20'
                },
                {
                  id: 'visualization',
                  name: 'Visualization',
                  description: 'Image-based induction using mental imagery',
                  color: 'from-purple-500/20 to-blue-500/20'
                }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setProtocol(prev => ({ ...prev, induction: method.id }))}
                  className={`w-full p-4 rounded-xl bg-gradient-to-br ${method.color} border transition-all duration-200 hover:scale-105 text-left ${
                    protocol.induction === method.id 
                      ? 'border-white/40 ring-2 ring-teal-400/30' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <h4 className="text-white font-semibold text-base mb-1">{method.name}</h4>
                  <p className="text-white/70 text-sm">{method.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
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
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            <div className="px-4 space-y-6">
              
              {/* Top Progress Indicator */}
              <div className="flex justify-center pt-6">
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

              {/* Main Content Card */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                {renderStep()}
              </div>

              {/* Bottom Navigation */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                {/* Step Indicator */}
                <div className="text-center mb-4">
                  <div className="text-white/60 text-sm mb-2">Step {currentStep} of 3</div>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-1 rounded-full transition-all duration-300 ${
                          step <= currentStep ? 'bg-teal-400' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                      currentStep === 1 ? 'invisible' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </div>
                  </button>

                  {currentStep < 3 ? (
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <div className="flex items-center space-x-2">
                        <span>Next</span>
                        <ArrowRight size={16} />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 flex items-center space-x-2"
                    >
                      <Wand2 size={16} />
                      <span>Create</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}