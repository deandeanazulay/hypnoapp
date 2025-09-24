import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Clock, Zap, Target, Sparkles, Edit3, Crown, Infinity, Music, Star, Lock, Play, Eye, Waves, Book, Wind } from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import { paymentService } from '../../lib/stripe';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import Orb from '../Orb';

interface CustomProtocol {
  id: string;
  name: string;
  induction: string;
  deepener: string;
  goals: string[];
  metaphors: string[];
  duration: number;
}

interface CreateScreenProps {
  onProtocolCreate: (protocol: CustomProtocol) => void;
  onShowAuth: () => void;
}

type WizardStep = 'name' | 'duration' | 'induction' | 'deepener' | 'finalize';

export default function CreateScreen({ onProtocolCreate, onShowAuth }: CreateScreenProps) {
  const { user, canAccess } = useGameState();
  const { showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { addCustomAction } = useProtocolStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [protocol, setProtocol] = useState<Partial<CustomProtocol>>({
    name: '',
    induction: '',
    deepener: '',
    goals: [],
    metaphors: [],
    duration: 15
  });

  // Orb state that reacts to user choices
  const [orbState, setOrbState] = useState({
    energy: 0.3,
    color: 'guardian',
    animation: 'pulse',
    intensity: 1.0
  });

  const stepOrder: WizardStep[] = ['name', 'duration', 'induction', 'deepener', 'finalize'];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  // Suggested names based on archetypes
  const nameSuggestions = [
    'Confidence Surge', 'Dream Voyage', 'Power Reclaim', 'Inner Sanctuary',
    'Focus Lock', 'Stress Melt', 'Creative Flow', 'Energy Boost',
    'Mind Palace', 'Soul Reset', 'Courage Rise', 'Peace Deep'
  ];

  const inductionOptions = [
    { 
      id: 'progressive-relaxation', 
      name: 'Progressive Relaxation', 
      description: 'Gentle wave of calm flowing through your body',
      iconData: { type: 'Waves', props: { size: 24, className: 'text-teal-400' } },
      color: 'from-teal-500/20 to-cyan-500/20',
      preview: 'Starting from the top of your head, feel tension melting away...',
      orbEffect: { color: 'teal', animation: 'wave' }
    },
    { 
      id: 'rapid-induction', 
      name: 'Rapid Induction', 
      description: 'Lightning-fast entry into deep trance',
      iconData: { type: 'Zap', props: { size: 24, className: 'text-yellow-400' } },
      color: 'from-yellow-500/20 to-orange-500/20',
      preview: 'Sleep now... and as your eyes close, you drop deep...',
      orbEffect: { color: 'yellow', animation: 'flare' }
    },
    { 
      id: 'eye-fixation', 
      name: 'Eye Fixation', 
      description: 'Hypnotic gaze into the orb\'s depths',
      iconData: { type: 'Eye', props: { size: 24, className: 'text-purple-400' } },
      color: 'from-purple-500/20 to-indigo-500/20',
      preview: 'Focus on the orb... deeper and deeper... letting go...',
      orbEffect: { color: 'purple', animation: 'spiral' }
    },
    { 
      id: 'breath-work', 
      name: 'Breath Work', 
      description: 'Rhythmic breathing into transcendence',
      iconData: { type: 'Wind', props: { size: 24, className: 'text-green-400' } },
      color: 'from-green-500/20 to-emerald-500/20',
      preview: 'With each breath, you sink deeper into yourself...',
      orbEffect: { color: 'green', animation: 'pulse' }
    }
  ];

  const deepenerOptions = [
    { 
      id: 'staircase', 
      name: 'Spiral Staircase', 
      description: 'Classic descent into deeper consciousness',
      icon: '🌀',
      color: 'from-blue-500/20 to-purple-500/20',
      free: true
    },
    { 
      id: 'elevator', 
      name: 'Cosmic Elevator', 
      description: 'Smooth descent through dimensions',
      icon: '🛗',
      color: 'from-indigo-500/20 to-blue-500/20',
      free: true
    },
    { 
      id: 'archetype-guardian', 
      name: 'Guardian\'s Shield', 
      description: 'Protected descent with your inner guardian',
      icon: '🛡️',
      color: 'from-blue-600/20 to-cyan-600/20',
      free: false,
      premium: true
    },
    { 
      id: 'archetype-mystic', 
      name: 'Mystic\'s Portal', 
      description: 'Transcendent passage through sacred geometry',
      icon: '✨',
      color: 'from-purple-600/20 to-pink-600/20',
      free: false,
      premium: true
    },
    { 
      id: 'archetype-healer', 
      name: 'Healer\'s Garden', 
      description: 'Gentle descent through healing light',
      icon: '🌿',
      color: 'from-green-600/20 to-teal-600/20',
      free: false,
      premium: true
    }
  ];

  // Helper function to render Lucide icons from serializable data
  const renderIcon = (iconData: { type: string; props: Record<string, any> }) => {
    const iconComponents: { [key: string]: React.ComponentType<any> } = {
      Waves,
      Zap,
      Eye,
      Wind
    };
    
    const IconComponent = iconComponents[iconData.type];
    if (!IconComponent) {
      return <Target {...iconData.props} />;
    }
    
    return <IconComponent {...iconData.props} />;
  };

  // Update orb based on current choices
  useEffect(() => {
    let newOrbState = { ...orbState };
    
    // Duration affects energy/intensity
    newOrbState.energy = Math.min(0.3 + (protocol.duration || 15) * 0.02, 1.0);
    newOrbState.intensity = 0.8 + (protocol.duration || 15) * 0.01;
    
    // Induction affects color and animation
    const selectedInduction = inductionOptions.find(opt => opt.id === protocol.induction);
    if (selectedInduction) {
      // Map color names to actual ego state IDs
      const colorToEgoState: { [key: string]: string } = {
        'teal': 'guardian',
        'yellow': 'explorer', 
        'purple': 'mystic',
        'green': 'healer'
      };
      newOrbState.color = colorToEgoState[selectedInduction.orbEffect.color] || 'guardian';
      newOrbState.animation = selectedInduction.orbEffect.animation;
    }
    
    setOrbState(newOrbState);
  }, [protocol.duration, protocol.induction, protocol.deepener]);

  const canCreateCustom = canAccess('custom_outlines');

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsProcessingPayment(true);
      const { url } = await paymentService.createCheckoutSession('mystic-subscription');
      window.location.href = url;
    } catch (error: any) {
      console.error('Payment error:', error);
      showToast({
        type: 'error',
        message: error.message || 'Failed to start checkout. Please try again.',
        duration: 5000
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentStepIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(stepOrder[currentStepIndex - 1]);
    }
  };

  const handleFinalize = () => {
    if (!canCreateCustom) {
      showToast({
        type: 'warning',
        message: 'Upgrade to Pro to save custom journeys',
        duration: 4000
      });
      return;
    }

    if (protocol.name && protocol.induction) {
      const newProtocol: CustomProtocol = {
        id: 'custom-' + Date.now(),
        name: protocol.name,
        induction: protocol.induction,
        deepener: protocol.deepener || 'staircase',
        goals: [],
        metaphors: [],
        duration: protocol.duration || 15
      };
      
      onProtocolCreate(newProtocol);
      
      // Add to actions bar
      const selectedInduction = inductionOptions.find(opt => opt.id === protocol.induction);
      addCustomAction({
        name: protocol.name,
        iconData: selectedInduction?.iconData || { type: 'Target', props: { size: 16, className: 'text-cyan-400' } },
        color: selectedInduction?.color || 'from-cyan-500/20 to-blue-500/20',
        description: `Custom: ${protocol.name}`,
        induction: protocol.induction,
        deepener: protocol.deepener || 'staircase',
        duration: protocol.duration || 15
      });
      
      showToast({
        type: 'success',
        message: `"${protocol.name}" created and added to your actions!`,
        duration: 3000
      });
      
      // Reset wizard
      setProtocol({
        name: '',
        induction: '',
        deepener: '',
        goals: [],
        metaphors: [],
        duration: 15
      });
      setCurrentStep('name');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-light mb-3">Name Your Journey</h2>
              <p className="text-white/70 text-sm">Every transformation begins with intention</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={protocol.name}
                  onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Transformation Journey"
                  className="w-full bg-gradient-to-r from-black/40 to-black/20 border-2 border-white/20 focus:border-teal-400/60 rounded-2xl px-6 py-4 text-white text-lg font-medium placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-400/20 to-purple-400/20 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
              </div>
              
              <div className="space-y-2">
                <p className="text-white/60 text-sm text-center">Need inspiration?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {nameSuggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setProtocol(prev => ({ ...prev, name: suggestion }))}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm transition-all duration-300 hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-light mb-3">How Deep Today?</h2>
              <p className="text-white/70 text-sm">Choose your journey length</p>
            </div>
            
            <div className="space-y-6">
              {/* Duration Display */}
              <div className="text-center">
                <div className="text-6xl font-light text-teal-400 mb-2">{protocol.duration}m</div>
                <p className="text-white/60 text-sm">
                  {protocol.duration <= 5 ? 'Quick Reset' :
                   protocol.duration <= 15 ? 'Balanced Journey' :
                   protocol.duration <= 25 ? 'Deep Dive' : 'Master Level'}
                </p>
              </div>
              
              {/* Duration Slider */}
              <div className="px-4">
                <input
                  type="range"
                  min="5"
                  max="45"
                  value={protocol.duration}
                  onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider-teal"
                />
                <div className="flex justify-between text-white/40 text-xs mt-2">
                  <span>5m</span>
                  <span>Quick</span>
                  <span>Balanced</span>
                  <span>Deep</span>
                  <span>45m</span>
                </div>
              </div>
              
              {/* Quick Picks */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { duration: 5, label: 'Quick Boost', desc: 'Energy reset' },
                  { duration: 15, label: 'Balanced', desc: 'Perfect flow' },
                  { duration: 30, label: 'Deep Dive', desc: 'Full immersion' }
                ].map((option) => (
                  <button
                    key={option.duration}
                    onClick={() => setProtocol(prev => ({ ...prev, duration: option.duration }))}
                    className={`p-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                      protocol.duration === option.duration
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:border-white/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs opacity-70">{option.desc}</div>
                      <div className="text-xs font-bold mt-1">{option.duration}m</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'induction':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-light mb-3">Choose Your Gateway</h2>
              <p className="text-white/70 text-sm">Each method unlocks a different doorway into your subconscious</p>
            </div>
            
            <div className="space-y-4">
              {inductionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setProtocol(prev => ({ ...prev, induction: option.id }))}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-br ${option.color} border transition-all duration-300 hover:scale-[1.02] text-left ${
                    protocol.induction === option.id
                      ? 'border-white/40 ring-2 ring-teal-400/30 shadow-2xl shadow-teal-400/20'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 rounded-xl bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
                      {renderIcon(option.iconData)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">{option.name}</h3>
                      <p className="text-white/80 text-sm mb-3 leading-relaxed">{option.description}</p>
                      <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                        <p className="text-white/70 text-sm italic">"{option.preview}"</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'deepener':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-light mb-3">Go Deeper</h2>
              <p className="text-white/70 text-sm">Add a booster that amplifies transformation</p>
            </div>
            
            <div className="space-y-4">
              {/* Free Deepeners */}
              <div className="space-y-3">
                <h3 className="text-white/80 text-sm font-medium">Free Deepeners</h3>
                {deepenerOptions.filter(opt => opt.free).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProtocol(prev => ({ ...prev, deepener: option.id }))}
                    className={`w-full p-4 rounded-xl bg-gradient-to-br ${option.color} border transition-all duration-300 hover:scale-[1.02] ${
                      protocol.deepener === option.id
                        ? 'border-white/40 ring-2 ring-blue-400/30'
                        : 'border-white/20 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="text-left">
                        <div className="text-white font-semibold">{option.name}</div>
                        <div className="text-white/70 text-sm">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Premium Wall - Tempting Golden Portal */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 border-2 border-amber-500/40 p-6">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-slide-slow" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center animate-pulse">
                      <Crown size={24} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-amber-400 font-bold text-lg">Pro Deepeners</h3>
                      <p className="text-white/80 text-sm">Unlock master-level transformation</p>
                    </div>
                  </div>

                  {/* Premium Features Showcase */}
                  <div className="space-y-3 mb-6">
                    {deepenerOptions.filter(opt => opt.premium).map((option) => (
                      <div key={option.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-amber-500/30">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl opacity-60">{option.icon}</span>
                          <div>
                            <div className="text-white font-medium text-sm">{option.name}</div>
                            <div className="text-white/60 text-xs">{option.description}</div>
                          </div>
                        </div>
                        <Lock size={16} className="text-amber-400" />
                      </div>
                    ))}
                  </div>

                  {/* Pro Benefits */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-xl p-4 border border-amber-500/30 mb-6">
                    <h4 className="text-amber-300 font-semibold mb-3">Pro users don't just journey—they architect realities</h4>
                    <div className="space-y-2 text-sm text-white/80">
                      <div className="flex items-center space-x-2">
                        <Music size={14} className="text-amber-400" />
                        <span>Add custom music layers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <span>Unlock archetype journeys</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Infinity size={14} className="text-amber-400" />
                        <span>Unlimited saves</span>
                      </div>
                    </div>
                  </div>

                  {/* Urgency & Social Proof */}
                  <div className="text-center mb-4">
                    <p className="text-amber-300/80 text-sm mb-2">⚡ 3,214 Pro journeys created today</p>
                    <p className="text-white/60 text-xs">Don't be left out of the transformation</p>
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={handleUpgrade}
                    disabled={isProcessingPayment}
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl shadow-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? 'Processing...' : 'Command Your Mind → Upgrade to Pro'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'finalize':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-light mb-3">Your Journey Awaits</h2>
              <p className="text-white/70 text-sm">Step inside, or unlock Pro to design unlimited experiences</p>
            </div>
            
            {/* Journey Preview */}
            <div className="bg-gradient-to-br from-teal-500/10 to-purple-500/10 rounded-2xl p-6 border border-teal-500/30">
              <h3 className="text-white font-semibold text-lg mb-4">"{protocol.name}"</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Duration</span>
                  <span className="text-teal-400 font-medium">{protocol.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Induction</span>
                  <span className="text-teal-400 font-medium">
                    {inductionOptions.find(opt => opt.id === protocol.induction)?.name || 'Selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Deepener</span>
                  <span className="text-teal-400 font-medium">
                    {deepenerOptions.find(opt => opt.id === protocol.deepener)?.name || 'Classic Staircase'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {canCreateCustom && user ? (
                <button
                  onClick={handleFinalize}
                  className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl text-black font-bold text-lg transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-teal-500/20 flex items-center justify-center space-x-3"
                >
                  <Save size={20} />
                  <span>Create Journey</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30 text-center">
                    <Crown size={32} className="text-amber-400 mx-auto mb-3" />
                    <div className="text-amber-400 font-semibold mb-2">Unlock Full Control</div>
                    <p className="text-white/80 text-sm mb-4">Save unlimited custom journeys and access master deepeners</p>
                    <button
                      onClick={handleUpgrade}
                      disabled={isProcessingPayment}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg text-black font-bold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                    >
                      {isProcessingPayment ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      showToast({
                        type: 'info',
                        message: 'Try one of our pre-made journeys instead',
                        duration: 3000
                      });
                    }}
                    className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white/80 hover:bg-white/20 transition-all duration-300"
                  >
                    Browse Templates Instead
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'name': return 'Name';
      case 'duration': return 'Duration';
      case 'induction': return 'Gateway';
      case 'deepener': return 'Deepener';
      case 'finalize': return 'Finalize';
      default: return '';
    }
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 'name': return protocol.name && protocol.name.trim().length > 0;
      case 'duration': return protocol.duration && protocol.duration >= 5;
      case 'induction': return protocol.induction;
      case 'deepener': return true; // Optional step
      case 'finalize': return true;
      default: return false;
    }
  };

  return (
    <div className="h-full bg-black relative overflow-hidden flex flex-col">
      {/* Cosmic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-teal-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header with Progress */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-light mb-1">Create Journey</h1>
            <p className="text-white/60 text-sm">Design your personalized transformation</p>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-white/60 text-sm">Step {currentStepIndex + 1}/5</span>
            <div className="text-teal-400 text-sm font-medium">{getStepTitle()}</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content with Orb */}
      <div className="flex-1 min-h-0 relative z-10 flex flex-col lg:flex-row">
        
        {/* Left Side - Form Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
          {renderStepContent()}
        </div>

        {/* Right Side - Reactive Orb (Desktop) */}
        {/* Right Side - Preview Panel (Desktop) */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:items-center lg:justify-center lg:px-6 lg:py-8">
          <div className="text-center mb-6">
            <h3 className="text-white font-medium text-lg mb-2">Journey Preview</h3>
            <p className="text-white/60 text-sm">Your custom transformation</p>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-60 h-60 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 border border-teal-500/30 flex items-center justify-center animate-pulse">
              <div className="text-center">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-teal-400 font-medium text-sm">Creating...</div>
              </div>
            </div>
          <div className="flex items-center justify-center">
            <Orb
              onTap={() => {}}
              egoState={orbState.color}
              size={240}
              variant="webgl"
              className="opacity-60"
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-white/70 text-sm">
              {protocol.name || 'Unnamed Journey'}
            </p>
            <p className="text-white/50 text-xs">
              {protocol.duration}m • {protocol.induction ? inductionOptions.find(opt => opt.id === protocol.induction)?.name : 'No gateway selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-black/95 to-transparent backdrop-blur-sm relative z-10">
        <div className="flex space-x-3">
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          
          {currentStep !== 'finalize' ? (
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-black font-bold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => {
                // Create the protocol and navigate to home
                const previewProtocol: CustomProtocol = {
                  id: 'custom-' + Date.now(),
                  name: protocol.name || 'Custom Journey',
                  induction: protocol.induction || 'progressive-relaxation',
                  deepener: protocol.deepener || 'staircase',
                  goals: [],
                  metaphors: [],
                  duration: protocol.duration || 15
                };
                
                // Create and navigate to home
                onProtocolCreate(previewProtocol);
                
                // Reset the form
                setProtocol({
                  name: '',
                  induction: '',
                  deepener: '',
                  goals: [],
                  metaphors: [],
                  duration: 15
                });
                setCurrentStep('name');
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-black font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <Play size={16} />
              <span>Create Journey</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Custom Styles */}
      <style jsx>{`
        .slider-teal::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #14b8a6, #06b6d4);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
        }
        
        .slider-teal::-webkit-slider-track {
          background: linear-gradient(to right, #14b8a6 0%, #14b8a6 var(--value), rgba(255,255,255,0.2) var(--value), rgba(255,255,255,0.2) 100%);
          height: 12px;
          border-radius: 6px;
        }
        
        @keyframes slide-slow {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-slide-slow {
          animation: slide-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}