import React, { useState, useEffect } from 'react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, getEgoState } from '../../store';
import { useGameState } from '../GameStateManager';
import { useProtocolStore } from '../../state/protocolStore';
import { track } from '../../services/analytics';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight, Clock } from 'lucide-react';
import Orb from '../Orb';
import SessionInitiationFlow from '../session/SessionInitiationFlow';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';
import PageShell from '../layout/PageShell';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  onShowAuth: () => void;
  activeTab: string;
}

// Horizontal Milestone Roadmap Component
interface HorizontalMilestoneRoadmapProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
  onTabChange: (tabId: TabId) => void;
}


  return (
    <div className="w-full max-w-md mx-auto mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/80 text-sm font-medium">Your Next Milestones</h3>
        <button
          onClick={() => onTabChange('explore')}
          className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Horizontal Roadmap */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable container */}
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 py-2">
          {milestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;
            
              <div key={milestone.id} className="flex items-center space-x-6 flex-shrink-0">
                {/* Milestone Node */}
                <button
                  onClick={() => handleMilestoneClick(milestone)}
                  disabled={!isUnlocked}
                  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-400 shadow-lg shadow-green-400/50'
                      : isActive  
                      ? 'bg-orange-500/30 border-orange-400 animate-pulse shadow-lg shadow-orange-400/50'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-400/40 hover:bg-teal-500/30'
                      : 'bg-white/10 border-white/20 cursor-not-allowed opacity-60'
                  }`}
                >
                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in border border-black">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                  )}
                  
                  {/* Active pulse ring */}
                  {isActive && (
                    <div className="absolute -inset-1 rounded-full border border-orange-400 animate-ping" />
                  )}
                  
                  {/* Icon */}
                  {isCompleted ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={16} className="text-white/40" />
                  ) : (
                    <IconComponent size={16} className={`${
                      isActive ? 'text-orange-400' : 'text-teal-400'
                    }`} />
                  )}
                </button>

                {/* Connection Line */}
                {index < milestones.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-green-400 to-teal-400'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-400 to-white/20'
                      : isUnlocked && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-teal-400 to-orange-400 animate-pulse'
                      : 'bg-white/20'
                  } rounded-full`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Labels - Below the roadmap */}
      <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 mt-2">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex-shrink-0 text-center" style={{ width: '72px' }}>
            <div className={`text-xs font-medium ${
              milestone.completed
                ? 'text-green-400'
                : milestone.active
                ? 'text-orange-400'
                : milestone.unlocked
                ? 'text-teal-400'
                : 'text-white/40'
            }`}>
              {milestone.name}
            </div>
            {milestone.unlocked && (
              <div className="flex items-center justify-center space-x-1 text-xs mt-1">
                {milestone.xpReward && (
                  <span className="text-orange-400/80">+{milestone.xpReward}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth, activeTab }: HomeScreenProps) {
  const { isAuthenticated } = useAuth();
  const { user } = useGameState();
  const { activeEgoState, openModal, showToast } = useAppStore();
  const { customActions } = useProtocolStore();
  
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showSessionFlow, setShowSessionFlow] = useState(false);

  const currentEgoState = getEgoState(activeEgoState);

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    
    setShowSessionFlow(true);
    track('orb_interaction', { 
      state: 'tapped', 
      authenticated: isAuthenticated,
      egoState: activeEgoState 
    });
  };

  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
    track('action_selected', { 
      actionId: action.id, 
      actionName: action.name,
      egoState: activeEgoState 
    });
  };

  const handleNavigateToCreate = () => {
    onTabChange('create');
    track('navigation', { tab: 'create', source: 'home_actions' });
  };

  const handleSessionStart = () => {
    // Session started successfully, could navigate or show success
    track('session_started_from_home', { egoState: activeEgoState });
  };

  const handleMilestoneSelect = (milestone: any) => {
    onTabChange('explore');
    track('milestone_selected', { 
      milestoneId: milestone.id, 
      source: 'home_roadmap' 
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
        </div>


        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                  <Heart size={32} className="text-teal-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to begin your transformation</h3>
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-hidden">
            {/* Main Content */}
            <div 
              id="scene" 
              className="relative h-full flex flex-col items-center justify-center px-4"
              style={{ 
                paddingTop: '60px',
                paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)'
              }}
            >
              {/* Orb Section */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6">
                    <Orb
                      onTap={handleOrbTap}
                      size={Math.min(window.innerWidth * 0.8, 400)}
                      egoState={activeEgoState}
                      variant="auto"
                      className="mx-auto"
                    />
                  </div>
                  
                  {/* Orb Tagline */}
                  <div className="max-w-xs mx-auto">
                    <p className="text-white/90 text-lg font-light mb-2">
                      Enter with Libero in <span className="text-teal-400 font-medium">{currentEgoState.name}</span>
                    </p>
                    <p className="text-white/60 text-sm">
                      Tap to begin your transformation
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Milestone Roadmap */}
              <div className="flex-shrink-0 w-full max-w-lg mx-auto mb-4">
                <HorizontalMilestoneRoadmap 
                  user={user}
                  onMilestoneSelect={handleMilestoneSelect}
                  onTabChange={onTabChange}
                />
              </div>
            </div>

            {/* Session Initiation Flow */}
            <SessionInitiationFlow
              isOpen={showSessionFlow}
              onClose={() => setShowSessionFlow(false)}
              onSessionStart={handleSessionStart}
              egoState={activeEgoState}
            />
          </div>
        }
      />
    </div>
  );
}