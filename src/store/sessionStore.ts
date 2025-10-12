import { create } from 'zustand';
import { SessionHandle, SessionPlan, SessionState, StartSessionOptions, StepFeedback, startSession } from '../services/session';

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
