import type { StartSessionOptions } from '../services/session';
import { createSessionPlan, updatePlanStepStatus, type SessionPlan, type StepFeedback } from '../services/planning';
import { loadUserMemory, mergeMemoryIntoContext, type UserMemory } from '../services/userMemory';
import { mapStartOptionsToContext, type SessionContext } from '../services/sessionContext';

export interface GoalDecomposerOptions extends StartSessionOptions {
  revisionOf?: string | null;
  feedback?: StepFeedback | null;
}

export interface GoalDecomposerResult {
  plan: SessionPlan;
  context: SessionContext;
  memory: UserMemory | null;
}

export async function runGoalDecomposer(options: GoalDecomposerOptions): Promise<GoalDecomposerResult> {
  const baseContext = mapStartOptionsToContext(options);
  const userId = options.userPrefs?.userId || options.userId;

  let memory: UserMemory | null = null;
  let context: SessionContext = baseContext;

  if (userId) {
    try {
      memory = await loadUserMemory(userId);
      context = mergeMemoryIntoContext(baseContext, memory);
    } catch (error) {
      console.warn('GoalDecomposerAgent: Failed to load user memory, continuing with defaults:', error);
      memory = null;
      context = baseContext;
    }
  }

  const planOptions = {
    revisionOf: options.revisionOf ?? null,
    feedback: options.feedback ?? null
  };

  let plan = createSessionPlan(context, planOptions);
  const gatherStep = plan.steps.find((step) => step.type === 'gather_context');
  if (gatherStep) {
    plan = updatePlanStepStatus(plan, gatherStep.id, 'complete');
  }

  return { plan, context, memory };
}
