import type { OutcomeSummaryMemory, SessionSummaryMemory } from '../../services/userMemory';

export interface MemoryAdapterContext {
  userId: string;
  context?: Record<string, any> | null;
  outcomeSummary?: OutcomeSummaryMemory | null;
}

export interface MemoryVectorStoreAdapter {
  upsertSessionSummary(summary: SessionSummaryMemory, context: MemoryAdapterContext): Promise<void>;
}
