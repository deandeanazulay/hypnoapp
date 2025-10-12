export type PlanStepType = 'gather_context' | 'generate_script' | 'play_segment' | 'wrap_up';
export type PlanStepStatus = 'pending' | 'in-progress' | 'awaiting-feedback' | 'complete' | 'needs-revision';

export interface PlanStep {
  id: string;
  type: PlanStepType;
  title: string;
  status: PlanStepStatus;
  details?: string;
  data?: Record<string, any>;
  index: number;
}

export interface SessionPlan {
  id: string;
  createdAt: string;
  intent: string;
  summary: string;
  needsConfirmation: boolean;
  steps: PlanStep[];
  metadata?: Record<string, any>;
  revisionOf?: string | null;
}

export interface StepFeedback {
  stepId?: string;
  approved: boolean;
  notes?: string;
  reason?: string;
  adjustments?: Record<string, any>;
}

interface PlanOptions {
  revisionOf?: string | null;
  feedback?: StepFeedback | null;
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}

export function inferSessionIntent(userContext: any): string {
  const rawGoal = (userContext?.goalName || userContext?.goal?.name || '').toString().toLowerCase();
  const egoState = (userContext?.egoState || '').toString().toLowerCase();

  if (!rawGoal && !egoState) {
    return 'general-support';
  }

  const goalKeywords: Record<string, string> = {
    calm: 'stress-relief',
    stress: 'stress-relief',
    overwhelm: 'stress-relief',
    anxious: 'stress-relief',
    focus: 'focus-enhancement',
    productivity: 'motivation',
    motivate: 'motivation',
    sleep: 'sleep-support',
    habit: 'habit-building',
    confidence: 'confidence-boost'
  };

  for (const [keyword, intent] of Object.entries(goalKeywords)) {
    if (rawGoal.includes(keyword)) {
      return intent;
    }
  }

  if (egoState.includes('guardian')) {
    return 'grounding-and-safety';
  }

  if (egoState.includes('sage')) {
    return 'insight-coaching';
  }

  return 'general-support';
}

export function createSessionPlan(userContext: any, options: PlanOptions = {}): SessionPlan {
  const planId = generateId('plan');
  const intent = inferSessionIntent(userContext);
  const goal = userContext?.goalName || userContext?.goal?.name || 'your desired transformation';
  const egoState = userContext?.egoState || 'inner guide';

  const baseSteps: PlanStep[] = [
    {
      id: generateId('step'),
      type: 'gather_context',
      title: 'Clarify current state and desired outcome',
      status: 'pending',
      details: `Review conversation and preferences to understand how to guide the user toward ${goal}.`,
      index: 0,
      data: {
        egoState,
        goal,
        userSignals: userContext?.userSignals || null
      }
    },
    {
      id: generateId('step'),
      type: 'generate_script',
      title: 'Design tailored hypnosis narrative',
      status: 'pending',
      details: 'Draft a multi-segment hypnosis journey aligned with the inferred need.',
      index: 1,
      data: {
        intent,
        goal,
        estimatedDuration: userContext?.lengthSec || 600
      }
    },
    {
      id: generateId('step'),
      type: 'play_segment',
      title: 'Guide the user through each segment with check-ins',
      status: 'pending',
      details: 'Deliver the hypnosis audio one segment at a time, pausing for feedback between steps.',
      index: 2,
      data: {
        placeholder: true
      }
    },
    {
      id: generateId('step'),
      type: 'wrap_up',
      title: 'Integrate insights and capture reflections',
      status: 'pending',
      details: 'Close the session, invite reflections, and store outcomes for future personalization.',
      index: 3
    }
  ];

  const plan: SessionPlan = {
    id: planId,
    createdAt: new Date().toISOString(),
    intent,
    summary: `Support the user with ${intent.replace('-', ' ')} using the ${egoState} ego state focus and goal "${goal}".`,
    needsConfirmation: true,
    steps: baseSteps,
    metadata: {
      goal,
      egoState,
      revisionRequested: options.feedback?.approved === false,
      feedbackNotes: options.feedback?.notes || null
    },
    revisionOf: options.revisionOf || null
  };

  return plan;
}

export function materializePlanWithSegments(plan: SessionPlan, segments: { id: string; text: string; approxSec?: number }[]): SessionPlan {
  const newSteps: PlanStep[] = [];

  for (const step of plan.steps) {
    if (step.type === 'play_segment' && step.data?.placeholder) {
      segments.forEach((segment, index) => {
        newSteps.push({
          id: generateId('step'),
          type: 'play_segment',
          title: `Guide segment ${index + 1}`,
          status: 'pending',
          details: segment.text?.slice(0, 140) || 'Deliver hypnosis content.',
          index: step.index + index,
          data: {
            segmentId: segment.id,
            approxSec: segment.approxSec || null,
            textPreview: segment.text?.slice(0, 280) || null
          }
        });
      });
      continue;
    }

    newSteps.push(step);
  }

  return {
    ...plan,
    steps: newSteps.map((step, idx) => ({ ...step, index: idx }))
  };
}

export function updatePlanStepStatus(plan: SessionPlan, stepId: string, status: PlanStepStatus, patch: Partial<PlanStep> = {}): SessionPlan {
  const steps = plan.steps.map(step => {
    if (step.id !== stepId) {
      return step;
    }
    return {
      ...step,
      ...patch,
      status
    };
  });

  return { ...plan, steps };
}

export function findPlanStep(plan: SessionPlan | null, stepId?: string): PlanStep | null {
  if (!plan || !stepId) {
    return null;
  }
  return plan.steps.find(step => step.id === stepId) || null;
}

export function findSegmentStep(plan: SessionPlan | null, segmentId: string): PlanStep | null {
  if (!plan) {
    return null;
  }
  return plan.steps.find(step => step.type === 'play_segment' && step.data?.segmentId === segmentId) || null;
}

export function allSegmentStepsComplete(plan: SessionPlan | null): boolean {
  if (!plan) {
    return false;
  }
  const segmentSteps = plan.steps.filter(step => step.type === 'play_segment');
  if (segmentSteps.length === 0) {
    return false;
  }
  return segmentSteps.every(step => step.status === 'complete');
}
