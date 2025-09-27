import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Target, Clock, Zap, BarChart3, Settings, Sparkles, Brain, ArrowRight, Calendar } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../../utils/apiErrorHandler';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (goals: any, roadmap: any) => void;
}

interface OnboardingData {
  goals: string[];
  customGoal?: string;
  timeline: '1-year' | '5-year';
  frequency: '1x-daily' | '2x-daily';
  currentState: string;
  obstacles: string[];
  sessionLength: '5-min' | '10-min' | '15-min' | '20-min';
  ambientPrefs: 'voice-only' | 'voice-music' | 'text-only';
  successMetrics: string[];
}

const GOAL_OPTIONS = [
  { id: 'stress-relief', name: 'Stress Relief', icon: '🧘', description: 'Find calm in chaos' },
  { id: 'confidence', name: 'Confidence', icon: '💪', description: 'Unshakeable self-belief' },
  { id: 'sleep', name: 'Better Sleep', icon: '🌙', description: 'Deep, restful nights' },
  { id: 'focus', name: 'Mental Focus', icon: '🎯', description: 'Laser concentration' },
  { id: 'habits', name: 'Break Bad Habits', icon: '🔄', description: 'Transform patterns' },
  { id: 'creativity', name: 'Unleash Creativity', icon: '🎨', description: 'Artistic flow' },
  { id: 'healing', name: 'Emotional Healing', icon: '💚', description: 'Process and release' },
  { id: 'performance', name: 'Peak Performance', icon: '⚡', description: 'Excel in your field' }
];

const OBSTACLE_OPTIONS = [
  'Lack of time', 'Inconsistent schedule', 'High stress levels', 'Self-doubt', 
  'Negative thought patterns', 'Past trauma', 'Fear of change', 'Perfectionism',
  'Overwhelm', 'Lack of support', 'Physical tension', 'Racing mind'
];

const SUCCESS_METRICS = [
  'Feeling more calm and centered', 'Sleeping better at night', 'Increased confidence',
  'Better focus at work', 'Improved relationships', 'Less anxiety',
  'More energy throughout the day', 'Greater self-awareness', 'Emotional stability',
  'Breaking unhealthy patterns', 'Achieving personal goals', 'Overall life satisfaction'
];

export default function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedGoal, setRefinedGoal] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { showToast } = useAppStore();
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    timeline: '1-year',
    frequency: '1x-daily',
    currentState: '',
    obstacles: [],
    sessionLength: '15-min',
    ambientPrefs: 'voice-only',
    successMetrics: []
  });

  const totalSteps = 6;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleRefineGoals();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.goals.length > 0 || data.customGoal;
      case 2: return true; // Timeline always has default
      case 3: return true; // Frequency always has default
      case 4: return data.currentState.trim().length > 0;
      case 5: return data.obstacles.length > 0;
      case 6: return data.successMetrics.length > 0;
      default: return false;
    }
  };

  const handleRefineGoals = async () => {
    setIsRefining(true);
    
    try {
      // Prepare goal refinement request
      const goalContext = {
        selectedGoals: data.goals,
        customGoal: data.customGoal,
        timeline: data.timeline,
        frequency: data.frequency,
        currentState: data.currentState,
        obstacles: data.obstacles,
        sessionPrefs: {
          length: data.sessionLength,
          ambient: data.ambientPrefs
        },
        successMetrics: data.successMetrics
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        // Fallback for missing API
        const mockRefinedGoal = {
          mainGoal: data.customGoal || data.goals[0] || 'Personal Transformation',
          reasoning: 'Based on your responses, this goal will create meaningful change.',
          timeline: data.timeline,
          approach: 'Progressive archetypal hypnosis',
          estimatedSessions: data.timeline === '1-year' ? 365 : 1825
        };
        setRefinedGoal(mockRefinedGoal);
        setIsRefining(false);
        return;
      }

      const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      
      const response = await safeFetch(
        `${baseUrl}/functions/v1/chatgpt-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            message: `Refine and optimize this transformation goal based on the user's onboarding responses: ${JSON.stringify(goalContext)}`,
            knowledgeBase: {
              task: 'goal_refinement',
              userResponses: goalContext
            },
            conversationHistory: []
          })
        },
        {
          operation: 'Goal Refinement',
          additionalContext: {
            goals: data.goals,
            timeline: data.timeline
          }
        }
      );

      const result = await response.json();
      
      // Parse AI response into structured goal
      const aiRefinedGoal = {
        mainGoal: data.customGoal || data.goals[0] || 'Personal Transformation',
        reasoning: result.response || 'AI will help optimize your transformation journey.',
        timeline: data.timeline,
        approach: 'Progressive archetypal hypnosis',
        estimatedSessions: (data.timeline === '1-year' ? 365 : 1825) * (data.frequency === '2x-daily' ? 2 : 1)
      };
      
      setRefinedGoal(aiRefinedGoal);
      
    } catch (error: any) {
      console.error('Goal refinement error:', error);
      
      // Fallback goal refinement
      const fallbackGoal = {
        mainGoal: data.customGoal || data.goals[0] || 'Personal Transformation',
        reasoning: 'Your selected goals will create meaningful transformation through consistent practice.',
        timeline: data.timeline,
        approach: 'Progressive archetypal hypnosis',
        estimatedSessions: (data.timeline === '1-year' ? 365 : 1825) * (data.frequency === '2x-daily' ? 2 : 1)
      };
      setRefinedGoal(fallbackGoal);
      
      showToast({
        type: 'warning',
        message: 'Using offline goal refinement'
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleApproveGoal = () => {
    setShowPaywall(true);
  };

  const handleEditGoal = () => {
    setRefinedGoal(null);
    setCurrentStep(1); // Go back to goal selection
  };

  const handlePremiumUpgrade = () => {
    // TODO: Integrate with Stripe
    console.log('Premium upgrade triggered');
    
    // For now, simulate premium unlock and generate roadmap
    const mockRoadmap = generateMockRoadmap(refinedGoal, data);
    
    setShowPaywall(false);
    onComplete(refinedGoal, mockRoadmap);
  };

  const handleSkipPremium = () => {
    // Generate basic roadmap without premium features
    const basicRoadmap = generateBasicRoadmap(refinedGoal, data);
    
    setShowPaywall(false);
    onComplete(refinedGoal, basicRoadmap);
  };

  const generateMockRoadmap = (goal: any, onboardingData: OnboardingData) => {
    const baseSessions = onboardingData.timeline === '1-year' ? 365 : 1825;
    const frequencyMultiplier = onboardingData.frequency === '2x-daily' ? 2 : 1;
    const estimatedSessions = baseSessions * frequencyMultiplier;
    
    return {
      stages: [
        {
          id: 'foundation',
          name: 'Foundation',
          level: 1,
          milestones: [
            { id: 'first-session', name: 'First Transformation', unlocked: true },
            { id: 'week-streak', name: '7-Day Momentum', unlocked: false },
            { id: 'depth-master', name: 'Trance Depth Mastery', unlocked: false }
          ]
        },
        {
          id: 'development',
          name: 'Development', 
          level: 5,
          milestones: [
            { id: 'ego-explorer', name: 'Ego State Explorer', unlocked: false },
            { id: 'custom-protocols', name: 'Protocol Creator', unlocked: false }
          ]
        },
        {
          id: 'mastery',
          name: 'Mastery',
          level: 10,
          milestones: [
            { id: 'advanced-phenomena', name: 'Advanced Phenomena', unlocked: false },
            { id: 'teaching-others', name: 'Guide Others', unlocked: false }
          ]
        }
      ],
      isPremium: true,
      generatedAt: new Date().toISOString(),
      estimatedSessions: estimatedSessions
    };
  };

  const generateBasicRoadmap = (goal: any, onboardingData: OnboardingData) => {
    const baseSessions = onboardingData.timeline === '1-year' ? 365 : 1825;
    const frequencyMultiplier = onboardingData.frequency === '2x-daily' ? 2 : 1;
    const estimatedSessions = baseSessions * frequencyMultiplier;
    
    return {
      stages: [
        {
          id: 'foundation',
          name: 'Foundation',
          level: 1,
          milestones: [
            { id: 'first-session', name: 'First Transformation', unlocked: true },
            { id: 'week-streak', name: '7-Day Momentum', unlocked: false }
          ]
        }
      ],
      isPremium: false,
      generatedAt: new Date().toISOString(),
      estimatedSessions: estimatedSessions
    };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">What do you want to transform?</h2>
              <p className="text-white/70 text-sm">Select all areas that resonate with you</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => {
                    const newGoals = data.goals.includes(goal.id)
                      ? data.goals.filter(g => g !== goal.id)
                      : [...data.goals, goal.id];
                    updateData({ goals: newGoals });
                  }}
                  className={`p-4 rounded-xl border transition-all hover:scale-105 text-left ${
                    data.goals.includes(goal.id)
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">{goal.icon}</div>
                  <div className="text-sm font-medium mb-1">{goal.name}</div>
                  <div className="text-xs opacity-70">{goal.description}</div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Or describe your own goal:</label>
              <input
                type="text"
                value={data.customGoal || ''}
                onChange={(e) => updateData({ customGoal: e.target.value })}
                placeholder="e.g., Overcome public speaking anxiety"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">What's your timeline?</h2>
              <p className="text-white/70 text-sm">How long do you want to focus on this transformation?</p>
            </div>

            <div className="space-y-3">
              {[
                { id: '1-year', name: '1 Year Focus', description: 'Intensive transformation with faster results' },
                { id: '5-year', name: '5+ Year Journey', description: 'Gradual, sustainable life-long change' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData({ timeline: option.id as any })}
                  className={`w-full p-4 rounded-xl border transition-all hover:scale-105 text-left ${
                    data.timeline === option.id
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} />
                    <div>
                      <div className="font-medium mb-1">{option.name}</div>
                      <div className="text-sm opacity-70">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">How often will you practice?</h2>
              <p className="text-white/70 text-sm">Consistency is key to transformation</p>
            </div>

            <div className="space-y-3">
              {[
                { id: '1x-daily', name: 'Once Daily', description: 'Sustainable and effective for most people' },
                { id: '2x-daily', name: 'Twice Daily', description: 'Accelerated results for dedicated practitioners' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData({ frequency: option.id as any })}
                  className={`w-full p-4 rounded-xl border transition-all hover:scale-105 text-left ${
                    data.frequency === option.id
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Zap size={20} />
                    <div>
                      <div className="font-medium mb-1">{option.name}</div>
                      <div className="text-sm opacity-70">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">How do you feel right now?</h2>
              <p className="text-white/70 text-sm">Help us understand your starting point</p>
            </div>

            <div>
              <textarea
                value={data.currentState}
                onChange={(e) => updateData({ currentState: e.target.value })}
                placeholder="Describe how you're feeling today... your energy, stress levels, confidence, any challenges you're facing..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 h-32 resize-none"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-3">What obstacles do you face? (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {OBSTACLE_OPTIONS.map(obstacle => (
                  <button
                    key={obstacle}
                    onClick={() => {
                      const newObstacles = data.obstacles.includes(obstacle)
                        ? data.obstacles.filter(o => o !== obstacle)
                        : [...data.obstacles, obstacle];
                      updateData({ obstacles: newObstacles });
                    }}
                    className={`p-2 rounded-lg border transition-all hover:scale-105 text-sm ${
                      data.obstacles.includes(obstacle)
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {obstacle}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">Session preferences</h2>
              <p className="text-white/70 text-sm">Optimize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-3">Session Length</label>
                <div className="grid grid-cols-4 gap-2">
                  {['5-min', '10-min', '15-min', '20-min'].map(length => (
                    <button
                      key={length}
                      onClick={() => updateData({ sessionLength: length as any })}
                      className={`p-3 rounded-lg border transition-all hover:scale-105 text-center ${
                        data.sessionLength === length
                          ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Clock size={16} className="mx-auto mb-1" />
                      <div className="text-sm font-medium">{length}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-3">Audio Preference</label>
                <div className="space-y-2">
                  {[
                    { id: 'voice-only', name: 'Voice Only', description: 'Clear guidance without distractions' },
                    { id: 'voice-music', name: 'Voice + Ambient', description: 'Guidance with background soundscapes' },
                    { id: 'text-only', name: 'Text Only', description: 'Silent practice with visual cues' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => updateData({ ambientPrefs: option.id as any })}
                      className={`w-full p-3 rounded-lg border transition-all hover:scale-105 text-left ${
                        data.ambientPrefs === option.id
                          ? 'bg-green-500/20 border-green-500/40 text-green-400'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium mb-1">{option.name}</div>
                      <div className="text-sm opacity-70">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-white text-xl font-light mb-2">How will you measure success?</h2>
              <p className="text-white/70 text-sm">Select the changes you want to notice</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SUCCESS_METRICS.map(metric => (
                <button
                  key={metric}
                  onClick={() => {
                    const newMetrics = data.successMetrics.includes(metric)
                      ? data.successMetrics.filter(m => m !== metric)
                      : [...data.successMetrics, metric];
                    updateData({ successMetrics: newMetrics });
                  }}
                  className={`p-3 rounded-lg border transition-all hover:scale-105 text-sm text-left ${
                    data.successMetrics.includes(metric)
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Goal refinement screen
  if (refinedGoal && !showPaywall) {
    return (
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Your Refined Goal"
        className="max-w-2xl"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={handleEditGoal}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300"
            >
              Edit Goal
            </button>
            <button
              onClick={handleApproveGoal}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-bold hover:scale-105 transition-transform duration-200"
            >
              Approve & Continue
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <Brain size={24} className="text-teal-400" />
              <h3 className="text-white font-semibold text-lg">AI-Refined Transformation Goal</h3>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-bold text-xl mb-3">{refinedGoal.mainGoal}</h4>
              <p className="text-white/80 text-sm leading-relaxed">{refinedGoal.reasoning}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <Calendar size={20} className="text-purple-400 mx-auto mb-2" />
              <div className="text-white font-medium">{refinedGoal.timeline === '1-year' ? '1 Year' : '5+ Years'}</div>
              <div className="text-white/60 text-sm">Timeline</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <Target size={20} className="text-orange-400 mx-auto mb-2" />
              <div className="text-white font-medium">{refinedGoal.estimatedSessions}</div>
              <div className="text-white/60 text-sm">Est. Sessions</div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Premium paywall screen
  if (showPaywall) {
    return (
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Unlock Your Full Journey"
        className="max-w-2xl"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={handleSkipPremium}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300"
            >
              Continue with Basic
            </button>
            <button
              onClick={handlePremiumUpgrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg text-black font-bold hover:scale-105 transition-transform duration-200"
            >
              Upgrade to Premium
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
              <Sparkles size={32} className="text-yellow-400" />
            </div>
            <h3 className="text-white text-xl font-light mb-2">Unlock AI-Powered Journey Mapping</h3>
            <p className="text-white/70">Get a personalized roadmap with milestones, daily tasks, and advanced features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Basic (Free)</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>• 3 basic milestones</li>
                <li>• 1 session per day</li>
                <li>• Basic protocols</li>
                <li>• Simple progress tracking</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
              <h4 className="text-white font-medium mb-3">Premium</h4>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• AI-generated roadmap</li>
                <li>• Unlimited sessions</li>
                <li>• Advanced protocols</li>
                <li>• Daily personalized tasks</li>
                <li>• Progress analytics</li>
                <li>• All ego states unlocked</li>
              </ul>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Main onboarding wizard
  return (
    <ModalShell
      isOpen={isOpen && !refinedGoal}
      onClose={onClose}
      title="Design Your Journey"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-1 rounded-full transition-all duration-300 ${
                  i + 1 <= currentStep ? 'bg-teal-400' : 'bg-white/20'
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
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isRefining}
              className="px-6 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            >
              {isRefining ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>AI Refining...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{currentStep === totalSteps ? 'Generate Journey' : 'Next'}</span>
                  <ChevronRight size={16} />
                </div>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
            <span className="text-white/60 text-sm">Step {currentStep} of {totalSteps}</span>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </ModalShell>
  );
}