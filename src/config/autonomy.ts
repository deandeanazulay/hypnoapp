export interface MemoryVectorStoreConfig {
  enabled: boolean;
  adapter: 'supabase' | 'none';
  tableName?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface AutonomyMemoryConfigShape {
  vectorStore: MemoryVectorStoreConfig;
}

export const AutonomyMemoryConfig: AutonomyMemoryConfigShape = {
  vectorStore: {
    enabled: true,
    adapter: 'supabase',
    tableName: 'session_memory_vectors',
    maxRetries: 2,
    retryDelayMs: 750
  }
};
