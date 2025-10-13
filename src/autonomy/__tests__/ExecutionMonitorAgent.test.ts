import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionMonitorAgent } from '../ExecutionMonitorAgent';
import type { SessionHandle, SessionState } from '../../services/session';
import type { PlanStep, SessionPlan } from '../../services/planning';
import { flushAnalytics, getAnalyticsStatus } from '../../services/analytics';

const ORIGINAL_VITE_ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

interface ListenerMap {
  [event: string]: Function[];
}

class MockSessionHandle implements SessionHandle {
  private listeners: ListenerMap = {};
  private state: SessionState;

  constructor(state: SessionState) {
    this.state = state;
  }

  play = vi.fn();
  pause = vi.fn();
  next = vi.fn();
  prev = vi.fn();
  dispose = vi.fn();

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, payload?: any) {
    (this.listeners[event] || []).forEach(listener => listener(payload));
  }

  getCurrentState(): SessionState {
    return { ...this.state };
  }

  setState(partial: Partial<SessionState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
  }
}

function createPlan(): SessionPlan {
  const steps: PlanStep[] = [
    { id: 'step-context', type: 'gather_context', title: 'Context', status: 'complete', index: 0 },
    { id: 'step-script', type: 'generate_script', title: 'Script', status: 'complete', index: 1 },
    { id: 'step-play', type: 'play_segment', title: 'Play', status: 'in-progress', index: 2 },
    { id: 'step-wrap', type: 'wrap_up', title: 'Wrap', status: 'pending', index: 3 },
  ];

  return {
    id: 'plan-123',
    createdAt: new Date().toISOString(),
    intent: 'test-intent',
    summary: 'Test plan for execution telemetry.',
    needsConfirmation: true,
    steps,
    metadata: { goal: 'relax' },
    revisionOf: null,
  };
}

function createState(plan: SessionPlan): SessionState {
  return {
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    totalSegments: 3,
    plan,
    script: null,
    bufferedAhead: 0,
    error: null,
    isInitialized: true,
    awaitingPlanConfirmation: true,
    awaitingFeedbackForStepId: null,
  };
}

describe('ExecutionMonitorAgent telemetry', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (import.meta as any).env = {
      ...import.meta.env,
      DEV: false,
      VITE_ANALYTICS_ENDPOINT: 'https://example.com/analytics',
    };

    process.env.VITE_ANALYTICS_ENDPOINT = 'https://example.com/analytics';
    process.env.NODE_ENV = 'test';

    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(async () => {
    await flushAnalytics();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env.VITE_ANALYTICS_ENDPOINT = ORIGINAL_VITE_ANALYTICS_ENDPOINT;
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('queues analytics events as the session progresses and flushes them in a batch', async () => {
    const plan = createPlan();
    const state = createState(plan);
    const handle = new MockSessionHandle(state);

    new ExecutionMonitorAgent(handle);

    handle.emit('plan-confirmation-needed', plan);

    handle.setState({
      currentSegmentId: 'segment-1',
      currentSegmentIndex: 0,
      totalSegments: 3,
      awaitingPlanConfirmation: false,
    });
    handle.emit('play');

    const fakeAudio = {
      src: 'https://example.com/audio.mp3',
      duration: 42,
      readyState: 3,
      autoplay: false,
    } as unknown as HTMLAudioElement;
    handle.emit('audio-element', fakeAudio);

    const feedbackStep = plan.steps[2];
    handle.setState({ awaitingFeedbackForStepId: feedbackStep.id });
    handle.emit('feedback-required', feedbackStep);

    handle.emit('end');

    const statusBeforeFlush = getAnalyticsStatus();
    expect(statusBeforeFlush.queueSize).toBe(5);
    expect(statusBeforeFlush.pendingFlush).toBe(true);
    expect(statusBeforeFlush.maxQueueSize).toBeGreaterThan(0);

    await flushAnalytics();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = fetchMock.mock.calls[0]?.[1]?.body as string;
    const payload = JSON.parse(requestBody);
    const events = payload.events;

    expect(events).toHaveLength(5);
    const eventNames = events.map((entry: any) => entry.event);
    expect(eventNames).toEqual(
      expect.arrayContaining([
        'plan_confirmation_needed',
        'session_play',
        'session_audio_ready',
        'session_feedback_required',
        'session_end',
      ]),
    );

    const planEvent = events.find((entry: any) => entry.event === 'plan_confirmation_needed');
    expect(planEvent?.payload?.session?.plan?.id).toBe(plan.id);
    const playEvent = events.find((entry: any) => entry.event === 'session_play');
    expect(playEvent?.payload?.session?.segment?.id).toBe('segment-1');
  });
});
