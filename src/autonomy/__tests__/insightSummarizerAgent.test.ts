import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runInsightSummarizer, runInsightSummariesOnSchedule } from '../InsightSummarizerAgent';
import { type UserMemory, loadUserMemory } from '../../services/userMemory';

vi.mock('../../services/userMemory', async () => {
  const actual = await vi.importActual<typeof import('../../services/userMemory')>('../../services/userMemory');
  return {
    ...actual,
    loadUserMemory: vi.fn()
  };
});

const mockedLoadUserMemory = loadUserMemory as unknown as vi.MockedFunction<typeof loadUserMemory>;

const now = new Date('2024-04-01T12:00:00Z');

const emptyMemory: UserMemory = {
  preferences: null,
  recentSessions: [],
  outcomeSummary: {
    totalSessions: 0,
    totalExperience: 0,
    lastSessionAt: null,
    averageDurationMinutes: null,
    favoriteEgoState: null,
    egoStateCounts: {}
  }
};

describe('InsightSummarizerAgent', () => {
  beforeEach(() => {
    mockedLoadUserMemory.mockReset();
  });

  it('summarizes empty memory with starter guidance', async () => {
    mockedLoadUserMemory.mockResolvedValue(emptyMemory);

    const result = await runInsightSummarizer({ userId: 'user-empty', channels: ['coach'], now });

    expect(result.trends[0]?.summary).toContain('No guided sessions');
    expect(result.briefs[0]?.body).toContain('No guided sessions');
  });

  it('summarizes partial history highlighting preferences and pacing', async () => {
    const partialMemory: UserMemory = {
      preferences: {
        activeEgoState: 'sage'
      },
      recentSessions: [],
      outcomeSummary: {
        totalSessions: 4,
        totalExperience: 68,
        lastSessionAt: '2024-03-30T18:30:00Z',
        averageDurationMinutes: 18,
        favoriteEgoState: 'Sage',
        egoStateCounts: { sage: 3, guardian: 1 }
      }
    };

    mockedLoadUserMemory.mockResolvedValue(partialMemory);

    const result = await runInsightSummarizer({ userId: 'user-partial', channels: ['product'], now });

    const preferenceInsight = result.trends.find((trend) => trend.type === 'preference');
    expect(preferenceInsight?.summary).toContain('Sage');

    const experienceInsight = result.trends.find((trend) => trend.type === 'experience');
    expect(experienceInsight?.summary).toContain('Balanced growth');

    expect(result.briefs[0]?.body).toContain('Product should adapt UI');
  });

  it('identifies streaking behaviour and recommends re-engagement timing', async () => {
    const streakMemory: UserMemory = {
      preferences: {
        sessionStreak: 9
      },
      recentSessions: [],
      outcomeSummary: {
        totalSessions: 15,
        totalExperience: 420,
        lastSessionAt: '2024-04-01T08:00:00Z',
        averageDurationMinutes: 26,
        favoriteEgoState: 'Rebel',
        egoStateCounts: { rebel: 11, guardian: 4 }
      }
    };

    mockedLoadUserMemory.mockResolvedValue(streakMemory);

    const result = await runInsightSummarizer({ userId: 'user-streak', channels: ['broadcast'], now });

    const recency = result.trends.find((trend) => trend.type === 'recency');
    expect(recency?.summary).toContain('today');

    const engagement = result.trends.find((trend) => trend.type === 'engagement');
    expect(engagement?.summary).toContain('Consistent momentum');

    expect(result.briefs[0]?.body).toContain('outbound comms');
  });

  it('schedules summaries for multiple cohorts', async () => {
    const partialMemory: UserMemory = {
      preferences: null,
      recentSessions: [],
      outcomeSummary: {
        totalSessions: 6,
        totalExperience: 120,
        lastSessionAt: '2024-03-29T10:00:00Z',
        averageDurationMinutes: 20,
        favoriteEgoState: 'Mystic',
        egoStateCounts: { mystic: 4, guardian: 2 }
      }
    };

    const streakMemory: UserMemory = {
      preferences: null,
      recentSessions: [],
      outcomeSummary: {
        totalSessions: 14,
        totalExperience: 380,
        lastSessionAt: '2024-03-31T11:00:00Z',
        averageDurationMinutes: 24,
        favoriteEgoState: 'Guardian',
        egoStateCounts: { guardian: 9, sage: 5 }
      }
    };

    const scenarios: Record<string, UserMemory> = {
      'user-empty': emptyMemory,
      'user-partial': partialMemory,
      'user-streak': streakMemory
    };

    mockedLoadUserMemory.mockImplementation(async (userId?: string | null) => {
      if (!userId) {
        return emptyMemory;
      }
      return scenarios[userId] ?? emptyMemory;
    });

    const publish = vi.fn();

    const logger = {
      info: vi.fn(),
      error: vi.fn()
    };

    const results = await runInsightSummariesOnSchedule({
      userIds: Object.keys(scenarios),
      channels: ['coach'],
      now,
      onSummary: publish,
      logger
    });

    expect(results).toHaveLength(3);
    expect(publish).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenCalledWith('[INSIGHT_SUMMARY] Generated briefs for user user-streak');

    const streakResult = results.find((result) => result.userId === 'user-streak');
    expect(streakResult?.trends.find((trend) => trend.type === 'recency')?.summary).toMatch(/Last session/);
  });
});
