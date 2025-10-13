import { supabase } from '../../lib/supabase';
import type { SessionSummaryMemory } from '../../services/userMemory';
import type { MemoryAdapterContext, MemoryVectorStoreAdapter } from './types';

export interface SupabaseVectorStoreAdapterOptions {
  tableName?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  mapSummaryToRow?: (summary: SessionSummaryMemory, context: MemoryAdapterContext) => Record<string, any>;
}

const DEFAULT_TABLE = 'session_memory_vectors';
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_MAX_RETRIES = 2;

function defaultRowMapper(summary: SessionSummaryMemory, context: MemoryAdapterContext) {
  return {
    session_id: summary.id,
    user_id: summary.userId || context.userId,
    action: summary.action,
    ego_state: summary.egoState,
    duration_minutes: summary.durationMinutes,
    experience_gained: summary.experienceGained,
    completed_at: summary.completedAt,
    outcome_snapshot: context.outcomeSummary || null,
    metadata: {
      ...(context.context || {}),
      forwarded_at: new Date().toISOString()
    }
  };
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class SupabaseVectorStoreAdapter implements MemoryVectorStoreAdapter {
  private readonly tableName: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly mapper: (summary: SessionSummaryMemory, context: MemoryAdapterContext) => Record<string, any>;

  constructor(options: SupabaseVectorStoreAdapterOptions = {}) {
    this.tableName = options.tableName || DEFAULT_TABLE;
    this.maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : DEFAULT_MAX_RETRIES;
    this.retryDelayMs = typeof options.retryDelayMs === 'number' ? options.retryDelayMs : DEFAULT_RETRY_DELAY;
    this.mapper = options.mapSummaryToRow || defaultRowMapper;
  }

  async upsertSessionSummary(summary: SessionSummaryMemory, context: MemoryAdapterContext): Promise<void> {
    const row = this.mapper(summary, context);

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const result = await supabase
          .from(this.tableName)
          .upsert(row);

        const error = result?.error;

        if (error) {
          if (error.code === 'OFFLINE') {
            if (attempt < this.maxRetries) {
              await delay(this.retryDelayMs);
              continue;
            }

            console.warn('[SupabaseVectorStoreAdapter] Offline after retries, dropping summary', {
              sessionId: summary.id,
              userId: context.userId
            });
            return;
          }

          throw error;
        }

        return;
      } catch (error: any) {
        if (error?.code === 'OFFLINE') {
          if (attempt < this.maxRetries) {
            await delay(this.retryDelayMs);
            continue;
          }

          console.warn('[SupabaseVectorStoreAdapter] Offline after retries, dropping summary', {
            sessionId: summary.id,
            userId: context.userId
          });
          return;
        }

        console.error('[SupabaseVectorStoreAdapter] Failed to upsert summary', error);
        throw error;
      }
    }
  }
}
