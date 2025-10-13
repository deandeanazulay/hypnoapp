import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionHandle, SessionPlan, SessionState, StepFeedback, StartSessionOptions } from '../services/session';
import type { PlanStep } from '../services/planning';

interface ListenerMap {
  [event: string]: ((payload?: any) => void)[];
}

const createInitialState = (): SessionState => ({
  playState: 'stopped',
  currentSegmentIndex: 0,
  currentSegmentId: null,
  totalSegments: 0,
  plan: null,
  script: null,
  bufferedAhead: 0,
  error: null,
  isInitialized: false,
  awaitingPlanConfirmation: false,
  awaitingFeedbackForStepId: null,
});

class MockSessionHandle implements SessionHandle {
  play = vi.fn();
  pause = vi.fn();
  next = vi.fn();
  prev = vi.fn();
  dispose = vi.fn();

  private listeners: ListenerMap = {};
  state: SessionState = createInitialState();
  plan: SessionPlan | null = null;

  on(event: string, listener: (payload?: any) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }

  emit(event: string, payload?: any) {
    (this.listeners[event] || []).forEach(listener => listener(payload));
  }

  getCurrentState(): SessionState {
    return this.state;
  }

  setPlan(plan: SessionPlan) {
    this.plan = JSON.parse(JSON.stringify(plan));
    this.state = { ...this.state, plan: this.plan, awaitingPlanConfirmation: plan.needsConfirmation };
    this.emit('state-change', this.state);
  }

  confirmPlan = vi.fn((planPatch: Partial<SessionPlan> = {}) => {
    if (!this.plan) {
      return;
    }
    const nextPlan: SessionPlan = {
      ...this.plan,
      ...planPatch,
      steps: planPatch.steps ? planPatch.steps.map(step => ({ ...step })) : this.plan.steps.map(step => ({ ...step })),
      needsConfirmation: false,
    };
    this.plan = nextPlan;
    this.state = { ...this.state, plan: nextPlan, awaitingPlanConfirmation: false };
    this.emit('state-change', this.state);
  });

  submitStepFeedback = vi.fn(async (feedback: StepFeedback) => {
    if (!this.plan) {
      return;
    }
    const stepId = feedback.stepId;
    if (!stepId) {
      return;
    }
    const nextSteps = this.plan.steps.map(step => {
      if (step.id !== stepId) {
        return { ...step };
      }
      return {
        ...step,
        status: 'complete',
        data: {
          ...(step.data || {}),
          feedback: feedback.notes || null,
          adjustments: feedback.adjustments || undefined,
        },
      };
    });

    this.plan = { ...this.plan, steps: nextSteps };
    this.state = { ...this.state, plan: this.plan, awaitingFeedbackForStepId: null };
    this.emit('state-change', this.state);
  });
}

const startSessionMock = vi.fn((options: StartSessionOptions) => {
  void options;
  return new MockSessionHandle();
});

vi.mock('../services/session', () => ({
  startSession: startSessionMock,
}));

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Research planner agent integration', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let useSessionStore: typeof import('./sessionStore').useSessionStore;

  beforeAll(async () => {
    ({ useSessionStore } = await import('./sessionStore'));
  });

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ confirm: true, stepTransitions: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    startSessionMock.mockClear();
    const dispose = useSessionStore.getState().disposeSession;
    dispose();
    vi.restoreAllMocks();
  });

  it('confirms the plan, advances research steps, and handles feedback requests', async () => {
    const { startNewSession } = useSessionStore.getState();

    await startNewSession({ egoState: 'sage' } as any);

    const handle = useSessionStore.getState().sessionHandle as unknown as MockSessionHandle;

    const plan: SessionPlan = {
      id: 'plan-123',
      createdAt: new Date().toISOString(),
      intent: 'focus-enhancement',
      summary: 'Help the user regain deep focus.',
      needsConfirmation: true,
      steps: [
        {
          id: 'step-gather',
          type: 'gather_context',
          title: 'Review signals',
          status: 'pending',
          index: 0,
        },
        {
          id: 'step-generate',
          type: 'generate_script',
          title: 'Draft narrative',
          status: 'pending',
          index: 1,
        },
        {
          id: 'step-deliver',
          type: 'play_segment',
          title: 'Deliver segment',
          status: 'pending',
          index: 2,
        },
      ],
      metadata: {},
    };

    handle.setPlan(plan);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          confirm: true,
          planNotes: 'Scripts validated.',
          stepTransitions: [
            { stepId: 'step-generate', status: 'complete', notes: 'Narrative ready.' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    handle.emit('plan-confirmation-needed', plan);
    await flushPromises();
    await flushPromises();

    expect(handle.confirmPlan).toHaveBeenCalledTimes(2);
    const firstCall = handle.confirmPlan.mock.calls[0][0];
    expect(firstCall.steps?.find(step => step.id === 'step-generate')?.status).toBe('in-progress');
    const secondCall = handle.confirmPlan.mock.calls[1][0];
    expect(secondCall.steps?.find(step => step.id === 'step-generate')?.status).toBe('complete');

    const storeState = useSessionStore.getState().sessionState;
    expect(storeState.awaitingPlanConfirmation).toBe(false);
    expect(storeState.plan?.steps.find(step => step.id === 'step-generate')?.status).toBe('complete');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ approved: true, notes: 'Proceed to play.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const feedbackStep: PlanStep = {
      ...plan.steps[2],
      status: 'awaiting-feedback',
    };

    handle.state = {
      ...handle.state,
      plan: {
        ...handle.state.plan!,
        steps: handle.state.plan!.steps.map(step =>
          step.id === feedbackStep.id ? { ...feedbackStep } : step
        ),
      },
      awaitingFeedbackForStepId: feedbackStep.id,
    };

    handle.emit('feedback-required', feedbackStep);
    await flushPromises();

    expect(handle.submitStepFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ stepId: feedbackStep.id, approved: true, notes: 'Proceed to play.' })
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const planBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(planBody.mode).toBe('plan-review');
    const feedbackBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(feedbackBody.mode).toBe('step-feedback');
  });
});
