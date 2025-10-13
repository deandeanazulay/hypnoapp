import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionOutcomeInput, SessionSummaryMemory } from '../../services/userMemory';
import { MemoryGraphAgent } from '../MemoryGraphAgent';
import type { MemoryAdapterContext, MemoryVectorStoreAdapter } from '../memory';
import { SupabaseVectorStoreAdapter } from '../memory/SupabaseVectorStoreAdapter';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn()
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock
  }
}));

type SupabaseResult<T> = Promise<{ data: T; error: any }>;

describe('MemoryGraphAgent', () => {
  let profileRow: any;
  let seededSessions: any[];
  let insertResponse: { data: any; error: any };
  let lastInsertPayload: any;
  let vectorUpsertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    profileRow = {
      plan: 'steady-progress',
      active_ego_state: 'guardian',
      session_streak: 4,
      last_session_date: '2024-03-01T12:00:00Z'
    };
    seededSessions = [];
    insertResponse = { data: null, error: null };
    lastInsertPayload = null;
    vectorUpsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: profileRow, error: null })
            })
          })
        };
      }

      if (table === 'sessions') {
        const makeSessionsResult = () => Promise.resolve({ data: seededSessions, error: null }) as SupabaseResult<any[]>;

        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => makeSessionsResult()
              }),
              limit: () => makeSessionsResult()
            })
          }),
          insert: (payload: any) => {
            lastInsertPayload = payload;
            return {
              select: () => ({
                limit: () => Promise.resolve(insertResponse)
              })
            };
          }
        };
      }

      if (table === 'session_memory_vectors') {
        return {
          upsert: vectorUpsertMock
        };
      }

      throw new Error(`Unexpected table requested: ${table}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  class FakeAdapter implements MemoryVectorStoreAdapter {
    calls: Array<{ summary: SessionSummaryMemory; context: MemoryAdapterContext }> = [];

    async upsertSessionSummary(summary: SessionSummaryMemory, context: MemoryAdapterContext): Promise<void> {
      this.calls.push({ summary, context });
    }
  }

  it('loads seeded sessions and forwards normalized offline summaries to the adapter', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T10:00:00Z'));

    seededSessions = [
      {
        id: 'session-base-1',
        user_id: 'user-123',
        ego_state: 'guardian',
        action: 'Foundational Practice',
        duration: 20,
        experience_gained: 40,
        completed_at: '2024-04-30T21:00:00Z'
      }
    ];
    insertResponse = { data: null, error: { code: 'OFFLINE' } };

    const adapter = new FakeAdapter();
    const agent = new MemoryGraphAgent({ adapter });

    const memory = await agent.loadUserMemory('user-123');

    expect(memory.recentSessions).toHaveLength(1);
    expect(memory.recentSessions[0]).toMatchObject({
      id: 'session-base-1',
      userId: 'user-123',
      action: 'Foundational Practice',
      durationMinutes: 20,
      experienceGained: 40
    });

    const outcome: SessionOutcomeInput = {
      userId: 'user-123',
      context: { actionName: 'Restoration Drill', egoState: 'seer', lengthSec: 600 },
      previousMemory: memory
    };

    const updatedMemory = await agent.saveSessionOutcome(outcome);

    expect(lastInsertPayload).toMatchObject({
      user_id: 'user-123',
      ego_state: 'seer',
      action: 'Restoration Drill'
    });

    expect(updatedMemory.recentSessions[0]).toMatchObject({
      userId: 'user-123',
      egoState: 'seer',
      action: 'Restoration Drill',
      durationMinutes: 10,
      experienceGained: 20
    });
    expect(updatedMemory.recentSessions[0].id).toMatch(/^offline_/);

    expect(adapter.calls).toHaveLength(1);
    const forwarded = adapter.calls[0];
    expect(forwarded.summary).toEqual(updatedMemory.recentSessions[0]);
    expect(forwarded.context.userId).toBe('user-123');
    expect(forwarded.context.outcomeSummary).toEqual(updatedMemory.outcomeSummary);
  });

  it('retries supabase adapter upserts when offline before eventually succeeding', async () => {
    vi.useFakeTimers();

    const adapter = new SupabaseVectorStoreAdapter({ retryDelayMs: 200, maxRetries: 2 });
    const summary: SessionSummaryMemory = {
      id: 'session-123',
      userId: 'user-123',
      egoState: 'seer',
      action: 'Restoration Drill',
      durationMinutes: 15,
      experienceGained: 28,
      completedAt: '2024-05-01T10:00:00Z'
    };

    const contexts: MemoryAdapterContext = {
      userId: 'user-123',
      context: { source: 'test' },
      outcomeSummary: {
        totalSessions: 5,
        totalExperience: 100,
        lastSessionAt: '2024-04-30T10:00:00Z',
        averageDurationMinutes: 12,
        favoriteEgoState: 'seer',
        egoStateCounts: { seer: 3, guardian: 2 }
      }
    };

    vectorUpsertMock
      .mockResolvedValueOnce({ data: null, error: { code: 'OFFLINE' } })
      .mockResolvedValueOnce({ data: null, error: { code: 'OFFLINE' } })
      .mockResolvedValueOnce({ data: [{ session_id: 'session-123' }], error: null });

    const promise = adapter.upsertSessionSummary(summary, contexts);

    await vi.advanceTimersByTimeAsync(400);
    await promise;

    expect(vectorUpsertMock).toHaveBeenCalledTimes(3);
    const payload = vectorUpsertMock.mock.calls.at(-1)?.[0];
    expect(payload).toMatchObject({
      session_id: 'session-123',
      user_id: 'user-123',
      action: 'Restoration Drill'
    });
  });
});
