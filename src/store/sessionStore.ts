import { create } from 'zustand';
import { startSession } from '../services/session';
import type { SessionHandle, SessionPlan, SessionState, StartSessionOptions, StepFeedback } from '../services/session';
import type { PlanStep } from '../services/planning';
import { ResearchPlannerAgent } from '../autonomy/ResearchPlannerAgent';

interface SessionStore {
  sessionHandle: SessionHandle | null;
  sessionState: SessionState;
  startNewSession: (options: StartSessionOptions) => Promise<void>;
  play: () => void;
  pause: () => void;
  nextSegment: () => void;
  prevSegment: () => void;
  disposeSession: () => void;
  confirmPlan: (planPatch?: Partial<SessionPlan>) => void;
  submitStepFeedback: (feedback: StepFeedback) => Promise<void>;
}

const initialState: SessionState = {
  playState: 'stopped',
  currentSegmentId: null,
  currentSegmentIndex: 0,
  totalSegments: 0,
  bufferedAhead: 0,
  error: null,
  plan: null,
  script: null,
  isInitialized: false,
  awaitingPlanConfirmation: false,
  awaitingFeedbackForStepId: null,
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionHandle: null,
  sessionState: { ...initialState },

  startNewSession: async (options: StartSessionOptions) => {
    get().disposeSession(); // Dispose any existing session first

    const handle = startSession(options);
    set({ sessionHandle: handle });

    const researchAgent = new ResearchPlannerAgent(handle);

    handle.on('plan-confirmation-needed', (plan: SessionPlan) => {
      researchAgent.handlePlanConfirmation(plan).catch(error => {
        console.error('[ResearchPlannerAgent] Plan confirmation failed:', error);
      });
    });

    handle.on('feedback-required', (step: PlanStep | null) => {
      researchAgent.handleFeedbackRequest(step).catch(error => {
        console.error('[ResearchPlannerAgent] Feedback handling failed:', error);
      });
    });

    // Subscribe to state changes from the session handle
    handle.on('state-change', (newState: SessionState) => {
      set({ sessionState: newState });
    });

    // Initial state update
    set({ sessionState: handle.getCurrentState() });

    // The session handle will automatically start loading the script
    // and transition to 'paused' or 'playing' based on its internal logic.
  },

  play: () => {
    get().sessionHandle?.play();
  },

  pause: () => {
    get().sessionHandle?.pause();
  },

  nextSegment: () => {
    get().sessionHandle?.next();
  },

  prevSegment: () => {
    get().sessionHandle?.prev();
  },

  disposeSession: () => {
    get().sessionHandle?.dispose();
    set({
      sessionHandle: null,
      sessionState: { ...initialState },
    });
  },

  confirmPlan: (planPatch?: Partial<SessionPlan>) => {
    get().sessionHandle?.confirmPlan(planPatch);
  },

  submitStepFeedback: async (feedback: StepFeedback) => {
    if (!get().sessionHandle) return;
    await get().sessionHandle?.submitStepFeedback(feedback);
  }
}));
