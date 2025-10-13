import type { SessionPlan, SessionHandle, StepFeedback } from '../services/session';
import type { PlanStep, PlanStepStatus } from '../services/planning';
import systemPrompt from '../prompts/researchPlanner.system.txt?raw';
import planReviewTemplate from '../prompts/researchPlanner.planReview.template.txt?raw';
import feedbackTemplate from '../prompts/researchPlanner.feedback.template.txt?raw';

interface PlanTransition {
  stepId: string;
  status: PlanStepStatus;
  notes?: string;
  data?: Record<string, unknown>;
}

interface PlanReviewResponse {
  confirm: boolean;
  planNotes?: string;
  stepTransitions?: PlanTransition[];
}

interface FeedbackResponse {
  approved: boolean;
  notes?: string;
  reason?: string;
  adjustments?: Record<string, unknown>;
}

interface ResearchPlannerAgentOptions {
  endpoint?: string;
  fetchImpl?: typeof fetch;
}

export class ResearchPlannerAgent {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch | null;
  private processingPlanId: string | null = null;
  private readonly sessionHandle: SessionHandle;

  constructor(sessionHandle: SessionHandle, options: ResearchPlannerAgentOptions = {}) {
    this.sessionHandle = sessionHandle;
    this.endpoint = options.endpoint || '/api/agent/research';
    this.fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  }

  async handlePlanConfirmation(plan: SessionPlan | null) {
    if (!plan || this.processingPlanId === plan.id) {
      return;
    }

    this.processingPlanId = plan.id;

    try {
      const stepsInProgress = this.markStepsInProgress(plan);
      this.sessionHandle.confirmPlan({ steps: stepsInProgress });

      const response = await this.requestPlanReview(plan);
      const nextSteps = this.applyTransitions(stepsInProgress, response.stepTransitions);
      const planPatch: Partial<SessionPlan> = {
        summary: response.planNotes ? `${plan.summary}\n\nAI Research Notes: ${response.planNotes}` : plan.summary,
        steps: nextSteps,
      };

      this.sessionHandle.confirmPlan(planPatch);
    } catch (error) {
      console.error('[ResearchPlannerAgent] Failed to process plan confirmation:', error);
      // Still confirm plan so that the user can proceed even if AI assistance fails
      this.sessionHandle.confirmPlan({ steps: this.markStepsInProgress(plan) });
    } finally {
      this.processingPlanId = null;
    }
  }

  async handleFeedbackRequest(step: PlanStep | null) {
    if (!step) {
      return;
    }

    try {
      const decision = await this.requestStepFeedback(step);
      const feedback: StepFeedback = {
        stepId: step.id,
        approved: decision.approved,
        notes: decision.notes,
        reason: decision.reason,
        adjustments: decision.adjustments as Record<string, any> | undefined,
      };

      await this.sessionHandle.submitStepFeedback(feedback);
    } catch (error) {
      console.error('[ResearchPlannerAgent] Failed to submit step feedback:', error);
      await this.sessionHandle.submitStepFeedback({
        stepId: step.id,
        approved: true,
        notes: 'Auto-approved due to assistant failure.',
      });
    }
  }

  private markStepsInProgress(plan: SessionPlan): SessionPlan['steps'] {
    return plan.steps.map(step => {
      if (step.type === 'gather_context') {
        return { ...step, status: 'complete' };
      }
      if (step.type === 'generate_script') {
        return { ...step, status: 'in-progress' };
      }
      return { ...step };
    });
  }

  private applyTransitions(
    steps: SessionPlan['steps'],
    transitions?: PlanTransition[] | null
  ): SessionPlan['steps'] {
    if (!transitions || transitions.length === 0) {
      return steps.map(step =>
        step.type === 'generate_script' ? { ...step, status: 'complete' } : step
      );
    }

    const transitionMap = new Map<string, PlanTransition>();
    transitions.forEach(transition => {
      transitionMap.set(transition.stepId, transition);
    });

    return steps.map(step => {
      const transition = transitionMap.get(step.id);
      if (!transition) {
        if (step.type === 'generate_script' && step.status === 'in-progress') {
          return { ...step, status: 'complete' };
        }
        return step;
      }

      return {
        ...step,
        status: transition.status,
        data: {
          ...(step.data || {}),
          ...(transition.data || {}),
          researchNotes: transition.notes || step.data?.researchNotes,
        },
      };
    });
  }

  private buildPlanPrompt(plan: SessionPlan): string {
    const stepsDescription = plan.steps
      .map(step => `- [${step.type}] ${step.title} :: ${step.status}`)
      .join('\n');

    return planReviewTemplate
      .replace('{{intent}}', plan.intent)
      .replace('{{summary}}', plan.summary)
      .replace('{{steps}}', stepsDescription);
  }

  private buildFeedbackPrompt(step: PlanStep): string {
    return feedbackTemplate
      .replace('{{title}}', step.title)
      .replace('{{type}}', step.type)
      .replace('{{status}}', step.status)
      .replace('{{details}}', step.details || 'No additional details provided.');
  }

  private async requestPlanReview(plan: SessionPlan): Promise<PlanReviewResponse> {
    if (!this.fetchImpl) {
      return { confirm: true, stepTransitions: [] };
    }

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'plan-review',
          systemPrompt: systemPrompt.trim(),
          userPrompt: this.buildPlanPrompt(plan),
          plan,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as PlanReviewResponse;
      return {
        confirm: data.confirm ?? true,
        planNotes: data.planNotes || '',
        stepTransitions: data.stepTransitions || [],
      };
    } catch (error) {
      console.error('[ResearchPlannerAgent] Plan review request failed:', error);
      return { confirm: true, stepTransitions: [] };
    }
  }

  private async requestStepFeedback(step: PlanStep): Promise<FeedbackResponse> {
    if (!this.fetchImpl) {
      return { approved: true };
    }

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'step-feedback',
          systemPrompt: systemPrompt.trim(),
          userPrompt: this.buildFeedbackPrompt(step),
          step,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as FeedbackResponse;
      return {
        approved: data.approved ?? true,
        notes: data.notes,
        reason: data.reason,
        adjustments: data.adjustments,
      };
    } catch (error) {
      console.error('[ResearchPlannerAgent] Step feedback request failed:', error);
      return { approved: true };
    }
  }
}
