import React, { useState, useEffect } from 'react';
import { Play, Zap, Target, Shield, Moon } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { track } from '../../services/analytics';
import PageShell from '../layout/PageShell';
import Orb from '../Orb';
import ActionsBar from '../ActionsBar';
import GoalPicker from '../GoalPicker';
import ModePicker from '../ModePicker';
import MethodPicker from '../MethodPicker';
import { startSession } from '../../services/session';
import { QUICK_ACTIONS } from '../../utils/actions';
import { HYPNOSIS_PROTOCOLS } from '../../data/protocols';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  onShowAuth: () => void;
  activeTab: TabId;
}

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth, activeTab }: HomeScreenProps) {
  const { user } = useGameState();
  const { activeEgoState, showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { customActions } = useProtocolStore();
  
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  const currentEgoState = getEgoState(activeEgoState);

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    
    if (!selectedAction) {
      setShowGoalPicker(true);
      return;
    }

    if (!selectedGoal) {
      setShowGoalPicker(true);
      return;
    }

    if (!selectedMode) {
      setShowModePicker(true);
      return;
    }

    // Start session with selected parameters
    handleStartSession();
  };

  const handleStartSession = () => {
    const sessionHandle = startSession({
      egoState: activeEgoState,
      goal: selectedGoal,
      action: selectedAction,
      lengthSec: parseInt(selectedMode.duration) * 60,
      userPrefs: user
    });

    track('session_start', {
      egoState: activeEgoState,
      goalId: selectedGoal?.id,
      actionId: selectedAction?.id,
      duration: selectedMode?.duration
    });

    showToast({
      type: 'success',
      message: 'Session started! Let Libero guide your transformation.'
    });

    // Reset selections for next time
    setSelectedAction(null);
    setSelectedGoal(null);
    setSelectedMode(null);
  };

  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
    
    // Auto-advance to goal picker if this is a custom action
    if (action.isCustom) {
      setShowGoalPicker(true);
    }
  };

  const handleGoalSelect = (goal: any) => {
    setSelectedGoal(goal);
    setShowGoalPicker(false);
    setShowModePicker(true);
  };

  const handleModeSelect = ({ mode, duration }: { mode: any; duration: string }) => {
    setSelectedMode({ ...mode, duration });
    setShowModePicker(false);
    
    // For simple modes, start session immediately
    if (mode.id === 'guided-audio' || mode.id === 'silent-meditation') {
      handleStartSession();
    } else {
      // For interactive modes, show method picker
      setShowMethodPicker(true);
    }
  };

  const handleMethodSelect = (method: any) => {
    setShowMethodPicker(false);
    handleStartSession();
  };

  const handleNavigateToCreate = () => {
    onTabChange('create');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                  <Play size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to begin transformation</h3>
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
    <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full flex flex-col" style={{ paddingTop: '40px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
            {/* Main Content Container - Centered Layout */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 space-y-2 mb-2">
              
              {/* Tagline */}
              <div className="text-center mb-1">
                <p className="text-white/80 text-lg font-light">
                  Enter with Libero in {currentEgoState.name}
                </p>
              </div>

              {/* Main Orb */}
              <div className="flex justify-center">
                <Orb
                  onTap={handleOrbTap}
                  size={420}
                  egoState={activeEgoState}
                  variant="webgl"
                  className="cursor-pointer hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Tap to Begin */}
              <div className="text-center">
                <p className="text-white/60 text-base">
                  Tap to begin with Libero
                </p>
              </div>
            </div>

            {/* Milestone Roadmap - Above Actions */}
            <div className="flex-shrink-0 px-4 mb-4">
              <HorizontalMilestoneRoadmap 
                user={user}
                onMilestoneSelect={(milestone) => {
                  track('milestone_interaction', { milestoneId: milestone.id });
                }}
                onTabChange={onTabChange}
              />
            </div>
          </div>
        }
      />

      {/* Actions Bar - Fixed to bottom */}
      <ActionsBar
        selectedAction={selectedAction}
        onActionSelect={handleActionSelect}
        onNavigateToCreate={handleNavigateToCreate}
        customActions={customActions}
      />

      {/* Modals */}
      <GoalPicker
        isOpen={showGoalPicker}
        onSelect={handleGoalSelect}
        onClose={() => setShowGoalPicker(false)}
        onNavigateToCreate={handleNavigateToCreate}
      />

      <ModePicker
        isOpen={showModePicker}
        onSelect={handleModeSelect}
        onClose={() => setShowModePicker(false)}
      />

      <MethodPicker
        isOpen={showMethodPicker}
        selectedGoal={selectedGoal}
        onSelect={handleMethodSelect}
        onClose={() => setShowMethodPicker(false)}
      />
    </div>
  );
}