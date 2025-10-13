export { type MemoryVectorStoreAdapter, type MemoryAdapterContext } from './types';
export { SupabaseVectorStoreAdapter, type SupabaseVectorStoreAdapterOptions } from './SupabaseVectorStoreAdapter';

import { AutonomyMemoryConfig, type AutonomyMemoryConfigShape } from '../../config/autonomy';
import { SupabaseVectorStoreAdapter as DefaultSupabaseAdapter } from './SupabaseVectorStoreAdapter';
import type { MemoryVectorStoreAdapter } from './types';

export interface MemoryAdapterFactoryOptions {
  config?: AutonomyMemoryConfigShape;
}

export function createMemoryVectorStoreAdapter(options: MemoryAdapterFactoryOptions = {}): MemoryVectorStoreAdapter | null {
  const config = options.config?.vectorStore || AutonomyMemoryConfig.vectorStore;

  if (!config?.enabled) {
    return null;
  }

  switch (config.adapter) {
    case 'supabase':
      return new DefaultSupabaseAdapter({
        tableName: config.tableName,
        maxRetries: config.maxRetries,
        retryDelayMs: config.retryDelayMs
      });
    case 'none':
    default:
      return null;
  }
}
