import {
  loadUserMemory,
  mergeMemoryIntoContext,
  saveSessionOutcome,
  type SessionOutcomeInput,
  type SessionSummaryMemory,
  type UserMemory
} from '../services/userMemory';
import {
  createMemoryVectorStoreAdapter,
  type MemoryAdapterContext,
  type MemoryVectorStoreAdapter
} from './memory';

export interface MemoryGraphAgentOptions {
  adapter?: MemoryVectorStoreAdapter | null;
  adapterFactory?: () => MemoryVectorStoreAdapter | null;
  onAdapterError?: (error: unknown, summary: SessionSummaryMemory, context: MemoryAdapterContext) => void;
}

export class MemoryGraphAgent {
  private readonly adapter: MemoryVectorStoreAdapter | null;
  private readonly onAdapterError?: MemoryGraphAgentOptions['onAdapterError'];

  constructor(options: MemoryGraphAgentOptions = {}) {
    this.adapter = options.adapter ?? options.adapterFactory?.() ?? createMemoryVectorStoreAdapter();
    this.onAdapterError = options.onAdapterError;
  }

  async loadUserMemory(userId?: string | null): Promise<UserMemory> {
    return loadUserMemory(userId);
  }

  mergeMemoryIntoContext<TContext extends Record<string, any>>(context: TContext, memory?: UserMemory | null): TContext {
    return mergeMemoryIntoContext(context, memory);
  }

  async saveSessionOutcome(outcome: SessionOutcomeInput): Promise<UserMemory> {
    const updatedMemory = await this._persistSessionOutcome(outcome);
    await this._forwardSessionSummary(outcome, updatedMemory);
    return updatedMemory;
  }

  protected async _persistSessionOutcome(outcome: SessionOutcomeInput): Promise<UserMemory> {
    return saveSessionOutcome(outcome);
  }

  protected async _forwardSessionSummary(outcome: SessionOutcomeInput, memory: UserMemory): Promise<void> {
    const adapter = this.adapter;
    const latestSession = memory.recentSessions?.[0];

    if (!adapter || !latestSession || !outcome.userId) {
      return;
    }

    const context: MemoryAdapterContext = {
      userId: outcome.userId,
      context: outcome.context || null,
      outcomeSummary: memory.outcomeSummary || null
    };

    try {
      await adapter.upsertSessionSummary(latestSession, context);
    } catch (error) {
      if (this.onAdapterError) {
        this.onAdapterError(error, latestSession, context);
        return;
      }

      console.warn('[MemoryGraphAgent] Failed to forward session summary to adapter', error);
    }
  }
}

export const memoryGraphAgent = new MemoryGraphAgent();
