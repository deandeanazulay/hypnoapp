import React, { useState, useEffect } from 'react';
import { Star, Lock, Play, Gift, Target, Calendar, Zap, Trophy, ArrowRight, CheckCircle } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
import OnboardingWizard from '../journey/OnboardingWizard';
import JourneyPath from '../journey/JourneyPath';
import DailyTasks from '../journey/DailyTasks';

interface JourneyMapScreenProps {
  onProtocolSelect: (protocol: any) => void;
}

export default function JourneyMapScreen({ onProtocolSelect }: JourneyMapScreenProps) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useAppStore();
  const { user } = useGameState();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [journeyData, setJourneyData] = useState<any>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has journey data or goals set
      const hasJourneyData = localStorage.getItem('libero-journey-data');
      const hasGoals = localStorage.getItem('libero-user-goals');
      setHasCompletedOnboarding(!!hasJourneyData && !!hasGoals);
      
      if (hasGoals) {
        setUserGoals(JSON.parse(hasGoals));
      }
      if (hasJourneyData) {
        setJourneyData(JSON.parse(hasJourneyData));
      }
    }
  }, [isAuthenticated, user]);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (goals: any, roadmap: any) => {
    setUserGoals(goals);
    setJourneyData(roadmap);
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    
    // Save to localStorage
    localStorage.setItem('libero-user-goals', JSON.stringify(goals));
    localStorage.setItem('libero-journey-data', JSON.stringify(roadmap));
    
    showToast({
      type: 'success',
      message: 'Your personalized journey map has been created!'
    });
  };

  const handleResetJourney = () => {
    localStorage.removeItem('libero-journey-data');
    localStorage.removeItem('libero-user-goals');
    setHasCompletedOnboarding(false);
    setUserGoals(null);
    setJourneyData(null);
    showToast({
      type: 'info',
      message: 'Journey reset. Start your onboarding again!'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <Target size={32} className="text-purple-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to start your journey</h3>
                <button
                  onClick={() => openModal('auth')}
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
    <div className="h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            {!hasCompletedOnboarding ? (
              /* Onboarding Entry Point */
              <div className="px-4 h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                    <Target size={36} className="text-teal-400" />
                  </div>
                  <h1 className="text-white text-2xl font-light mb-4">Create Your Transformation Journey</h1>
                  <p className="text-white/70 text-base mb-8 leading-relaxed">
                    Let's design a personalized path to unlock your authentic power through archetypal hypnosis.
                  </p>
                  <button
                    onClick={handleStartOnboarding}
                    className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/25 flex items-center space-x-3 mx-auto"
                  >
                    <Star size={20} />
                    <span>Begin Journey Design</span>
                    <ArrowRight size={20} />
                  </button>
                  
                  <p className="text-white/50 text-sm mt-4">
                    Takes 2-3 minutes • Personalized by AI • Unlock your full potential
                  </p>
                </div>
              </div>
            ) : (
              /* Journey Map Interface */
              <div className="px-4 space-y-6">
                {/* Journey Header */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-white text-2xl font-light mb-1">Your Transformation Map</h1>
                      <p className="text-white/70">{userGoals?.mainGoal || 'Personal Transformation'}</p>
                    </div>
                    <button
                      onClick={handleResetJourney}
                      className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Reset Journey
                    </button>
                  </div>
                  
                  {/* Progress Overview */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-teal-400 text-xl font-bold">{user?.level || 1}</div>
                      <div className="text-white/60 text-xs">Current Stage</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-purple-400 text-xl font-bold">3</div>
                      <div className="text-white/60 text-xs">Milestones Unlocked</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-orange-400 text-xl font-bold">{user?.session_streak || 0}</div>
                      <div className="text-white/60 text-xs">Day Streak</div>
                    </div>
                  </div>
                </div>

                {/* Daily Tasks */}
                <DailyTasks 
                  onTaskComplete={(task) => {
                    onProtocolSelect(task.protocol);
                  }}
                  userLevel={user?.level || 1}
                  userGoals={userGoals}
                />

                {/* Journey Path */}
                <JourneyPath 
                  currentLevel={user?.level || 1}
                  userGoals={userGoals}
                  journeyData={journeyData}
                  onMilestoneSelect={(milestone) => {
                    onProtocolSelect(milestone.protocol);
                  }}
                />

                {/* Weekly Challenge */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                      <Trophy size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Weekly Challenge</h3>
                      <p className="text-white/70 text-sm">Complete for bonus rewards</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Master Your Morning Ritual</h4>
                      <div className="flex items-center space-x-1">
                        <Gift size={14} className="text-yellow-400" />
                        <span className="text-yellow-400 font-bold">+50 tokens</span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-4">Complete 7 consecutive morning sessions this week</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full ${
                              i < (user?.session_streak || 0) ? 'bg-yellow-400' : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white/60 text-sm">{user?.session_streak || 0}/7 days</span>
                    </div>
                  </div>
                </div>

                {/* Achievement Showcase */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Star size={20} className="text-purple-400" />
                    <span>Recent Achievements</span>
                  </h3>
                  
                  {(user?.achievements?.length || 0) > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {user?.achievements?.slice(0, 4).map((achievement, i) => (
                        <div key={i} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
                          <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-2">
                              <Trophy size={16} className="text-purple-400" />
                            </div>
                            <span className="text-white/80 text-sm font-medium">{achievement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center mx-auto mb-4 border border-gray-500/30">
                        <Star size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-white font-medium mb-2">No Achievements Yet</h4>
                      <p className="text-white/60 text-sm">Complete sessions to unlock badges and rewards</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}