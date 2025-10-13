import type { PlanStep, SessionPlan } from '../services/planning';
import type { SessionHandle } from '../services/session';
import {
  logAudioElementReady,
  logFeedbackRequired,
  logPlanConfirmationNeeded,
  logSessionEnded,
  logSessionPlay,
  toSessionSnapshot,
  type SessionSnapshot,
} from '../services/analytics';

/**
 * Observes a session handle and forwards lifecycle telemetry to analytics.
 */
export class ExecutionMonitorAgent {
  private readonly sessionHandle: SessionHandle;

  constructor(sessionHandle: SessionHandle) {
    this.sessionHandle = sessionHandle;
    this.registerListeners();
  }

  private registerListeners() {
    this.sessionHandle.on('play', () => {
      logSessionPlay(this.snapshotFromHandle());
    });

    this.sessionHandle.on('audio-element', (audioElement: HTMLAudioElement) => {
      logAudioElementReady(this.snapshotFromHandle(), audioElement);
    });

    this.sessionHandle.on('end', () => {
      logSessionEnded(this.snapshotFromHandle());
    });

    this.sessionHandle.on('plan-confirmation-needed', (plan: SessionPlan | undefined) => {
      const snapshot = this.snapshotFromHandle();
      logPlanConfirmationNeeded(plan ?? snapshot.plan ?? null, snapshot);
    });

    this.sessionHandle.on('feedback-required', (step: PlanStep | undefined) => {
      const snapshot = this.snapshotFromHandle();
      logFeedbackRequired({
        plan: snapshot.plan ?? null,
        step: step ?? null,
        snapshot,
      });
    });
  }

  private snapshotFromHandle(): SessionSnapshot {
    return toSessionSnapshot(this.sessionHandle.getCurrentState());
  }
}
