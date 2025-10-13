import type { PlanStep, SessionPlan } from './planning';
import type { SessionState } from './session';

interface AnalyticsEvent {
  event: string;
  payload: Record<string, any>;
  timestamp: number;
  sessionId?: string;
}

export interface AnalyticsQueueHealth {
  queueSize: number;
  maxQueueSize: number;
  batchSize: number;
  flushIntervalMs: number;
  pendingFlush: boolean;
  isFlushInProgress: boolean;
  lastFlushAt: number | null;
  sessionId: string;
}

export interface SessionSnapshot {
  plan?: SessionPlan | null;
  currentSegmentId?: string | null;
  currentSegmentIndex?: number | null;
  totalSegments?: number | null;
  awaitingPlanConfirmation?: boolean;
  awaitingFeedbackForStepId?: string | null;
}

interface SegmentMetadata {
  id: string | null;
  index: number | null;
  total: number | null;
}

interface PlanMetadata {
  id: string | null;
  intent?: string | null;
  summary?: string | null;
  needsConfirmation?: boolean;
  stepCount?: number;
  revisionOf?: string | null;
}

interface AudioElementLike {
  src?: string;
  duration?: number;
  readyState?: number;
  autoplay?: boolean;
  dataset?: Record<string, string>;
}

function getNavigator(): Navigator | undefined {
  return typeof navigator !== 'undefined' ? navigator : undefined;
}

function getWindow(): Window | undefined {
  return typeof window !== 'undefined' ? window : undefined;
}

function getPerformance(): Performance | undefined {
  return typeof performance !== 'undefined' ? performance : undefined;
}

function getProcessEnv(): Record<string, string | undefined> | undefined {
  const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;

  if (globalProcess && typeof globalProcess.env === 'object') {
    return globalProcess.env as Record<string, string | undefined>;
  }

  return undefined;
}

function isDevEnvironment(): boolean {
  const metaEnv = (import.meta as any)?.env;

  if (typeof metaEnv?.DEV === 'boolean') {
    return metaEnv.DEV;
  }

  const processEnv = getProcessEnv();

  if (processEnv) {
    const nodeEnv = processEnv.NODE_ENV;
    return !nodeEnv || nodeEnv !== 'production';
  }

  return false;
}

function getAnalyticsEndpoint(): string | undefined {
  const metaEnv = (import.meta as any)?.env;

  if (typeof metaEnv?.VITE_ANALYTICS_ENDPOINT === 'string') {
    return metaEnv.VITE_ANALYTICS_ENDPOINT;
  }

  const processEnv = getProcessEnv();

  if (processEnv?.VITE_ANALYTICS_ENDPOINT) {
    return processEnv.VITE_ANALYTICS_ENDPOINT;
  }

  return undefined;
}

class AnalyticsQueue {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 50;
  private readonly flushIntervalMs = 10000; // 10 seconds
  private readonly batchSize = 20;
  private sessionId: string;
  private lastFlushAt: number | null = null;
  private isFlushInProgress = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Flush on page unload
    const globalWindow = getWindow();

    if (globalWindow?.addEventListener) {
      globalWindow.addEventListener('beforeunload', () => {
        this.flush(true); // Synchronous flush on unload
      });
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  add(event: string, payload: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      payload: {
        ...payload,
        userAgent: getNavigator()?.userAgent ?? '',
        timestamp: Date.now(),
        url: getWindow()?.location?.href ?? ''
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.queue.push(analyticsEvent);
    
    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.flushIntervalMs);
      }
    }

    // Console log for development
    if (isDevEnvironment()) {
      // Reduced analytics logging in dev mode
    }
  }

  private async flush(synchronous = false): Promise<void> {
    if (this.queue.length === 0) return;

    const eventsToSend = this.queue.splice(0, this.batchSize);

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.isFlushInProgress = true;

    try {
      if (synchronous) {
        const globalNavigator = getNavigator();

        if (globalNavigator?.sendBeacon) {
          const data = JSON.stringify({ events: eventsToSend });
          globalNavigator.sendBeacon('/api/analytics', data);
        }
        this.lastFlushAt = Date.now();
      } else {
        // Regular fetch for asynchronous sending
        await this.sendEvents(eventsToSend);
        this.lastFlushAt = Date.now();
      }
      if (isDevEnvironment()) {
        console.log('Analytics: Flushed ' + eventsToSend.length + ' events');
      }
    } catch (error) {
      console.error('Analytics: Failed to send events:', error);
      // Re-add events to front of queue for retry
      this.queue.unshift(...eventsToSend);
    } finally {
      this.isFlushInProgress = false;
    }

    // Schedule next flush if queue still has items
    if (this.queue.length > 0 && !this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Check if we have a configured analytics endpoint
    const analyticsEndpoint = getAnalyticsEndpoint();

    if (!analyticsEndpoint) {
      // No analytics endpoint configured - just log to console in development
      if (isDevEnvironment()) {
        console.log('Analytics: No endpoint configured, events:', events);
      }
      return;
    }

    const response = await fetch(analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  // Manual flush method for testing or immediate sending
  public async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Get current queue size for monitoring
  public getQueueSize(): number {
    return this.queue.length;
  }

  public getQueueHealth(): AnalyticsQueueHealth {
    return {
      queueSize: this.queue.length,
      maxQueueSize: this.maxQueueSize,
      batchSize: this.batchSize,
      flushIntervalMs: this.flushIntervalMs,
      pendingFlush: Boolean(this.flushTimer),
      isFlushInProgress: this.isFlushInProgress,
      lastFlushAt: this.lastFlushAt,
      sessionId: this.sessionId,
    };
  }
}

const analyticsQueue = new AnalyticsQueue();

type SessionSnapshotInput = SessionSnapshot | Partial<SessionSnapshot> | undefined;

function normalizePlanMetadata(plan?: SessionPlan | null): PlanMetadata | null {
  if (!plan) {
    return null;
  }

  return {
    id: plan.id ?? null,
    intent: plan.intent ?? null,
    summary: plan.summary ?? null,
    needsConfirmation: plan.needsConfirmation ?? false,
    stepCount: Array.isArray(plan.steps) ? plan.steps.length : 0,
    revisionOf: plan.revisionOf ?? null,
  };
}

function normalizeSegmentMetadata(snapshot: SessionSnapshotInput): SegmentMetadata | null {
  const index = snapshot?.currentSegmentIndex ?? null;
  const id = snapshot?.currentSegmentId ?? null;
  const total = snapshot?.totalSegments ?? null;

  if (index === null && id === null && total === null) {
    return null;
  }

  return {
    id,
    index,
    total,
  };
}

function buildSessionPayload(snapshot: SessionSnapshotInput): Record<string, any> {
  const plan = normalizePlanMetadata(snapshot?.plan);
  const segment = normalizeSegmentMetadata(snapshot);

  return {
    plan,
    segment,
    awaitingPlanConfirmation: snapshot?.awaitingPlanConfirmation ?? false,
    awaitingFeedbackForStepId: snapshot?.awaitingFeedbackForStepId ?? null,
  };
}

function buildAudioMetadata(audioElement?: AudioElementLike | null): Record<string, any> {
  if (!audioElement) {
    return {
      hasSource: false,
      readyState: null,
      duration: null,
      autoplay: false,
    };
  }

  const duration = typeof audioElement.duration === 'number' && Number.isFinite(audioElement.duration)
    ? audioElement.duration
    : null;

  return {
    hasSource: Boolean(audioElement.src),
    readyState: typeof audioElement.readyState === 'number' ? audioElement.readyState : null,
    duration,
    autoplay: Boolean(audioElement.autoplay),
    dataAttributes: audioElement.dataset ?? undefined,
  };
}

function mergeSnapshot(base: SessionSnapshotInput, overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    ...(base ?? {}),
    ...overrides,
  } as SessionSnapshot;
}

export function toSessionSnapshot(state?: SessionState | null): SessionSnapshot {
  if (!state) {
    return {};
  }

  return {
    plan: state.plan,
    currentSegmentId: state.currentSegmentId,
    currentSegmentIndex: state.currentSegmentIndex,
    totalSegments: state.totalSegments,
    awaitingPlanConfirmation: state.awaitingPlanConfirmation,
    awaitingFeedbackForStepId: state.awaitingFeedbackForStepId,
  };
}

/**
 * Tracks an application event.
 *
 * @param event - The name of the event (e.g., 'session_start', 'segment_play').
 * @param payload - An object containing event-specific data.
 */
export function track(event: string, payload: Record<string, any> = {}): void {
  analyticsQueue.add(event, payload);
}

/**
 * Tracks session-specific events with additional context
 */
export function trackSession(event: string, sessionData: Record<string, any>, additionalPayload: Record<string, any> = {}): void {
  track(event, {
    ...additionalPayload,
    session: sessionData,
    sessionType: 'hypnotherapy'
  });
}

export function logSessionPlay(snapshot?: SessionSnapshotInput, metadata: { trigger?: 'auto' | 'user'; [key: string]: any } = {}): void {
  const { trigger = 'auto', ...rest } = metadata;
  const mergedSnapshot = mergeSnapshot(snapshot, {});

  trackSession('session_play', buildSessionPayload(mergedSnapshot), {
    lifecycle: 'play',
    trigger,
    ...rest,
  });
}

export function logAudioElementReady(
  snapshot?: SessionSnapshotInput,
  audioElement?: AudioElementLike | null,
  metadata: Record<string, any> = {},
): void {
  const mergedSnapshot = mergeSnapshot(snapshot, {});

  trackSession('session_audio_ready', buildSessionPayload(mergedSnapshot), {
    lifecycle: 'audio-element',
    audio: buildAudioMetadata(audioElement),
    ...metadata,
  });
}

export function logSessionEnded(snapshot?: SessionSnapshotInput, metadata: Record<string, any> = {}): void {
  const mergedSnapshot = mergeSnapshot(snapshot, {});

  trackSession('session_end', buildSessionPayload(mergedSnapshot), {
    lifecycle: 'end',
    ...metadata,
  });
}

export function logPlanConfirmationNeeded(plan?: SessionPlan | null, snapshot?: SessionSnapshotInput): void {
  const mergedSnapshot = mergeSnapshot(snapshot, {
    plan: plan ?? snapshot?.plan ?? null,
    awaitingPlanConfirmation: snapshot?.awaitingPlanConfirmation ?? plan?.needsConfirmation ?? true,
  });

  const steps = plan?.steps ?? [];

  trackSession('plan_confirmation_needed', buildSessionPayload(mergedSnapshot), {
    lifecycle: 'plan-confirmation-needed',
    plan: plan
      ? {
          id: plan.id ?? null,
          needsConfirmation: plan.needsConfirmation ?? false,
          stepIds: steps.map(step => step.id),
          stepCount: steps.length,
        }
      : null,
  });
}

export interface FeedbackRequiredTelemetryInput {
  plan?: SessionPlan | null;
  step?: PlanStep | null;
  snapshot?: SessionSnapshotInput;
  reason?: string | null;
}

export function logFeedbackRequired(payload: FeedbackRequiredTelemetryInput): void {
  const { plan = null, step = null, snapshot, reason = null } = payload;

  const mergedSnapshot = mergeSnapshot(snapshot, {
    plan: plan ?? snapshot?.plan ?? null,
    awaitingFeedbackForStepId: snapshot?.awaitingFeedbackForStepId ?? step?.id ?? null,
  });

  trackSession('session_feedback_required', buildSessionPayload(mergedSnapshot), {
    lifecycle: 'feedback-required',
    step: step
      ? {
          id: step.id,
          type: step.type,
          status: step.status,
          index: step.index,
        }
      : null,
    reason,
  });
}

/**
 * Tracks performance metrics
 */
export function trackPerformance(metric: string, value: number, unit: string = 'ms', additionalData: Record<string, any> = {}): void {
  track('performance_metric', {
    metric,
    value,
    unit,
    ...additionalData
  });
}

/**
 * Tracks errors with context
 */
export function trackError(
  error: Error, 
  context: Record<string, any> = {}
): void {
  // Enhanced error context for better debugging
  const errorContext = {
    // Basic error information
    message: error.message,
    stack: error.stack,
    name: error.name,

    // Browser environment
    userAgent: getNavigator()?.userAgent ?? '',
    url: getWindow()?.location?.href ?? '',
    timestamp: new Date().toISOString(),

    // Performance context
    memory: (() => {
      const perf = getPerformance();
      const perfMemory = (perf as any)?.memory;

      return perfMemory
        ? {
            usedJSHeapSize: perfMemory.usedJSHeapSize,
            totalJSHeapSize: perfMemory.totalJSHeapSize,
            jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
          }
        : undefined;
    })(),

    // Custom context
    ...context
  };

  track('error', {
    errorType: 'javascript_error',
    severity: context.severity || 'error',
    ...errorContext
  });

  // Also log to console with structured format for development
  if (isDevEnvironment()) {
    console.group(`🔥 Error: ${error.name}`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.table(context);
    console.groupEnd();
  }
}

/**
 * Force flush all pending events (useful for testing)
 */
export async function flushAnalytics(): Promise<void> {
  await analyticsQueue.forceFlush();
}

/**
 * Get analytics queue status
 */
export function getAnalyticsStatus(): AnalyticsQueueHealth {
  return analyticsQueue.getQueueHealth();
}
