import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Wand2, Target, Brain, Heart, Clock, Plus, Sparkles } from 'lucide-react';
import PageShell from '../layout/PageShell';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import { supabase } from '../../lib/supabase';

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

  const handleComplete = async () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    if (!protocol.name.trim()) {
      showToast({ type: 'warning', message: 'Please enter a protocol name' });
      return;
    }

    try {
      // Save protocol to database
      const { user } = await supabase.auth.getUser();
      if (!user.user?.id) {
        showToast({ type: 'error', message: 'User not authenticated' });
        return;
      }

      const protocolData = {
        user_id: user.user.id,
        name: protocol.name,
        induction: protocol.induction,
        deepener: protocol.deepener,
        goals: protocol.goals,
        metaphors: protocol.metaphors,
        duration: protocol.duration
      };

      const { data, error } = await supabase
        .from('custom_protocols')
        .insert(protocolData)
        .select()
        .single();

      if (error) {
        console.error('[CREATE] Error saving protocol:', error);
        showToast({ type: 'error', message: 'Failed to save protocol' });
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[CREATE] Protocol saved successfully:', data);
      }
      
      // Call the callback with the saved protocol data
      onProtocolCreate(data);
      showToast({ type: 'success', message: 'Protocol created and saved!' });
    } catch (err) {
      console.error('[CREATE] Unexpected error saving protocol:', err);
      showToast({ type: 'error', message: 'Failed to create protocol' });
      return;
    }
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

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">

              <h2 className="text-white text-lg font-light mb-2">Name Your Journey</h2>
              <p className="text-white/70 text-sm">What transformation will this create?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Protocol Name</label>
                <input
                  type="text"
                  value={protocol.name}
                  onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Confidence Boost Session"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-3">Duration</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">5 min</span>
                    <span className="text-white font-bold text-lg">{protocol.duration} minutes</span>
                    <span className="text-white/60 text-sm">30 min</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={protocol.duration}
                      onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="glass-slider w-full"
                      style={{
                        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((protocol.duration - 5) / 25) * 100}%, rgba(255,255,255,0.2) ${((protocol.duration - 5) / 25) * 100}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    {/* Duration markers */}
                    <div className="flex justify-between mt-2 px-1">
                      {[5, 10, 15, 20, 25, 30].map((duration) => (
                        <div key={duration} className="flex flex-col items-center">
                          <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                            duration <= protocol.duration ? 'bg-teal-400' : 'bg-white/20'
                          }`} />
                          <span className={`text-xs mt-1 transition-all ${
                            duration === protocol.duration ? 'text-teal-400 font-medium' : 'text-white/40'
                          }`}>
                            {duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Duration Helper Text */}
                  <div className="text-center mt-2">
                    <p className="text-white/50 text-xs">
                      {protocol.duration <= 10 ? 'Perfect for quick sessions' :
                       protocol.duration <= 20 ? 'Ideal for deep work' :
                       'Extended transformation journey'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center mx-auto mb-3">
                <Target size={20} className="text-black" />
              </div>
              <h2 className="text-white text-lg font-light mb-2">Choose Your Method</h2>
              <p className="text-white/70 text-sm">How should Libero guide the journey?</p>
            </div>

            <div className="space-y-2">
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
                  className={`w-full p-3 rounded-xl bg-gradient-to-br ${method.color} border transition-all duration-200 hover:scale-105 text-left ${
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
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-3">
                <Heart size={20} className="text-black" />
              </div>
              <h2 className="text-white text-lg font-light mb-2">Set Your Goals</h2>
              <p className="text-white/70 text-sm">What specific changes will this create?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/80 text-sm mb-3">Select Goals</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Stress Relief', 'Confidence', 'Focus', 'Creativity', 'Sleep', 'Healing'].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => {
                        const newGoals = protocol.goals.includes(goal)
                          ? protocol.goals.filter(g => g !== goal)
                          : [...protocol.goals, goal];
                        setProtocol(prev => ({ ...prev, goals: newGoals }));
                      }}
                      className={`px-3 py-2 rounded-xl border transition-all hover:scale-105 text-sm font-medium ${
                        protocol.goals.includes(goal)
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Custom Notes (Optional)</label>
                <textarea
                  value={protocol.deepener}
                  onChange={(e) => setProtocol(prev => ({ ...prev, deepener: e.target.value }))}
                  placeholder="Add specific techniques, metaphors, or intentions..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-rose-400/50 focus:bg-white/15 transition-all h-20 resize-none text-sm"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <Wand2 size={32} className="text-purple-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to create protocols</h3>
                <button
                  onClick={onShowAuth}
                  className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '50px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
            <div className="px-4 space-y-4">
              
              {/* Create Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-purple-500/40 flex items-center justify-center">
                    <Wand2 size={20} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white text-xl font-light mb-1">Protocol Builder</h2>
                    <p className="text-white/70 text-sm">Create your custom transformation journey</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center">
                  <div className="flex items-center space-x-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          step === currentStep
                            ? 'border-purple-400 bg-purple-400/20 text-purple-400'
                            : step < currentStep
                            ? 'border-teal-400 bg-teal-400/20 text-teal-400'
                            : 'border-white/30 text-white/50'
                        }`}>
                          <span className="text-sm">{step}</span>
                        </div>
                        {step < 3 && (
                          <div className={`w-6 h-0.5 mx-2 ${
                            step < currentStep ? 'bg-teal-400' : 'bg-white/30'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Step Content */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                {renderStepContent()}
              </div>

              {/* Step Navigation */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-center mb-3">
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-6 h-1 rounded-full transition-all duration-300 ${
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
                      <span>Create Protocol</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Protocol Preview */}
              {protocol.name && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Brain size={16} className="text-teal-400" />
                    <span>Protocol Preview</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/10">
                      <span className="text-white/70">Name</span>
                      <span className="text-white font-medium">{protocol.name || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/10">
                      <span className="text-white/70">Duration</span>
                      <span className="text-white font-medium">{protocol.duration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/10">
                      <span className="text-white/70">Method</span>
                      <span className="text-white font-medium capitalize">{protocol.induction || 'Not selected'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/10">
                      <span className="text-white/70">Goals</span>
                      <span className="text-white font-medium">{protocol.goals.length > 0 ? protocol.goals.join(', ') : 'None selected'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
                <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                  <Sparkles size={16} className="text-teal-400" />
                  <span>Pro Tips</span>
                </h4>
                <ul className="space-y-1 text-white/80 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Start with shorter durations (5-10 min) for new protocols</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Progressive Relaxation works great for most goals</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Your protocol will appear in the actions bar after creation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}