import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { runGoalDecomposer, type GoalDecomposerOptions } from '../GoalDecomposerAgent';
import { type UserMemory, loadUserMemory } from '../../services/userMemory';

vi.mock('../../services/userMemory', async () => {
  const actual = await vi.importActual<typeof import('../../services/userMemory')>('../../services/userMemory');
  return {
    ...actual,
    loadUserMemory: vi.fn()
  };
});

const mockedLoadUserMemory = loadUserMemory as unknown as vi.MockedFunction<typeof loadUserMemory>;

describe('runGoalDecomposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoadUserMemory.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates deterministic metadata when time and randomness are controlled', async () => {
    mockedLoadUserMemory.mockResolvedValue(null);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T12:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const options: GoalDecomposerOptions = {
      egoState: 'sage',
      goalId: 'deep-focus',
      goal: { id: 'deep-focus', name: 'Deep Focus' },
      action: { id: 'focus-reset', name: 'Focus Reset' },
      method: { id: 'breathwork', name: 'Breathwork' },
      protocol: { id: 'flow', name: 'Flow State', description: 'Guided focus protocol', duration: 900 },
      lengthSec: 900,
      userId: 'user-123',
      userPrefs: { level: 3, experience: 'intermediate', userId: 'user-123' }
    };

    const { plan } = await runGoalDecomposer(options);

    expect(plan.metadata).toEqual({
      goal: 'Deep Focus',
      egoState: 'sage',
      revisionRequested: false,
      feedbackNotes: null
    });

    const gatherStep = plan.steps.find((step) => step.type === 'gather_context');
    expect(gatherStep?.status).toBe('complete');
  });

  it('marks revisions correctly when feedback requests changes', async () => {
    mockedLoadUserMemory.mockResolvedValue(null);

    const options: GoalDecomposerOptions = {
      egoState: 'guardian',
      goalId: 'sleep',
      userId: 'user-456',
      revisionOf: 'plan_1',
      feedback: {
        approved: false,
        notes: 'Please emphasize safety more.'
      }
    };

    const { plan } = await runGoalDecomposer(options);

    expect(plan.revisionOf).toBe('plan_1');
    expect(plan.metadata).toMatchObject({
      revisionRequested: true,
      feedbackNotes: 'Please emphasize safety more.'
    });
  });

  it('returns merged context that includes memory-derived preferences', async () => {
    const memory: UserMemory = {
      preferences: {
        plan: 'steady-progress',
        activeEgoState: 'sage',
        sessionStreak: 5,
        lastSessionDate: '2024-03-01T10:00:00Z'
      },
      recentSessions: [],
      outcomeSummary: {
        totalSessions: 10,
        totalExperience: 120,
        lastSessionAt: '2024-03-05T10:00:00Z',
        averageDurationMinutes: 20,
        favoriteEgoState: 'sage',
        egoStateCounts: { sage: 7, guardian: 3 }
      }
    };

    mockedLoadUserMemory.mockResolvedValue(memory);

    const options: GoalDecomposerOptions = {
      egoState: 'guardian',
      goalId: 'relax',
      userId: 'user-789',
      userPrefs: { level: 2, experience: 'beginner', userId: 'user-789' }
    };

    const { context } = await runGoalDecomposer(options);

    expect(context.userPrefs).toMatchObject({
      preferredPlan: 'steady-progress',
      activeEgoState: 'sage',
      sessionStreak: 5,
      lastSessionDate: '2024-03-01T10:00:00Z'
    });
  });
});
