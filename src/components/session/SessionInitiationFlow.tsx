import React, { useState, useCallback } from 'react';
import { track } from '../../services/analytics';
import { useSessionStore } from '../../store/sessionStore';
import { useGameState } from '../GameStateManager';
import { useAppStore } from '../../store';
import GoalPicker from '../GoalPicker';
import MethodPicker from '../MethodPicker';
import ModePicker from '../ModePicker';

export interface SessionInitiationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStart?: () => void;
  egoState: string;
}

interface FlowState {
  currentStep: 'goal' | 'method' | 'mode' | 'closed';
  selectedGoal: any;
  selectedMethod: any;
  selectedMode: any;
}

export default function SessionInitiationFlow({ 
  isOpen, 
  onClose, 
  onSessionStart,
  egoState 
}: SessionInitiationFlowProps) {
  const { startNewSession } = useSessionStore();
  const { user } = useGameState();
  const { showToast } = useAppStore();
  
  const [flowState, setFlowState] = useState<FlowState>({
    currentStep: 'goal',
    selectedGoal: null,
    selectedMethod: null,
    selectedMode: null
  });

  // Reset flow state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFlowState({
        currentStep: 'goal',
        selectedGoal: null,
        selectedMethod: null,
        selectedMode: null
      });
    }
  }, [isOpen]);

  const handleGoalSelect = useCallback((goal: any) => {
    setFlowState(prev => ({
      ...prev,
      selectedGoal: goal,
      currentStep: 'method'
    }));
    
    track('session_goal_selected', {
      goalId: goal.id,
      goalName: goal.name,
      egoState
    });
  }, [egoState]);

  const handleMethodSelect = useCallback((method: any) => {
    setFlowState(prev => ({
      ...prev,
      selectedMethod: method,
      currentStep: 'mode'
    }));
    
    track('session_method_selected', {
      methodId: method.id,
      methodName: method.name,
      goalId: flowState.selectedGoal?.id,
      egoState
    });
  }, [flowState.selectedGoal?.id, egoState]);

  const handleModeSelect = useCallback(async ({ mode, duration }: { mode: any; duration: string }) => {
    setFlowState(prev => ({
      ...prev,
      selectedMode: { mode, duration }
    }));

    // Start the session
    try {
      const sessionOptions = {
        egoState,
        goal: flowState.selectedGoal,
        method: flowState.selectedMethod,
        mode: mode,
        lengthSec: parseInt(duration) * 60,
        userPrefs: {
          level: user?.level || 1,
          experience: user?.experience || 0
        }
      };

      await startNewSession(sessionOptions);
      
      track('session_started', {
        egoState,
        goalId: flowState.selectedGoal?.id,
        methodId: flowState.selectedMethod?.id,
        modeId: mode.id,
        duration: parseInt(duration)
      });

      showToast({
        type: 'success',
        message: `${mode.name} session started!`
      });

      onSessionStart?.();
      onClose();
      
    } catch (error) {
      console.error('Failed to start session:', error);
      showToast({
        type: 'error',
        message: 'Failed to start session. Please try again.'
      });
    }
  }, [flowState.selectedGoal, flowState.selectedMethod, egoState, user, startNewSession, onSessionStart, onClose, showToast]);

  const handleClose = useCallback(() => {
    setFlowState(prev => ({ ...prev, currentStep: 'closed' }));
    onClose();
  }, [onClose]);

  const handleNavigateToCreate = useCallback(() => {
    onClose();
    // Navigate to create tab would be handled by parent
    track('navigate_to_create', { source: 'session_flow' });
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Goal Picker */}
      <GoalPicker
        isOpen={flowState.currentStep === 'goal'}
        onSelect={handleGoalSelect}
        onClose={handleClose}
        onNavigateToCreate={handleNavigateToCreate}
      />

      {/* Method Picker */}
      <MethodPicker
        isOpen={flowState.currentStep === 'method'}
        selectedGoal={flowState.selectedGoal}
        onSelect={handleMethodSelect}
        onClose={handleClose}
      />

      {/* Mode Picker */}
      <ModePicker
        isOpen={flowState.currentStep === 'mode'}
        onSelect={handleModeSelect}
        onClose={handleClose}
      />
    </>
  );
}