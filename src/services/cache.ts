import { AI } from '../config/ai';

/**
 * Metadata to store alongside cached items.
 */
export interface CacheMetadata {
  timestamp: number;
  size: number;
  lastAccessed: number;
  contentType?: string;
}

const CACHE_NAME = 'libero-audio-cache';
const METADATA_DB_NAME = 'libero-metadata-db';
const METADATA_STORE_NAME = 'audio-metadata';

/**
 * Opens IndexedDB for metadata storage
 */
async function openMetadataDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(METADATA_DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(METADATA_STORE_NAME)) {
        const store = db.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
  });
}

/**
 * Gets metadata for a cache key
 */
async function getMetadata(key: string): Promise<(CacheMetadata & { key: string }) | null> {
  try {
    const db = await openMetadataDb();
    const transaction = db.transaction(METADATA_STORE_NAME, 'readonly');
    const store = transaction.objectStore(METADATA_STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
}

/**
 * Sets metadata for a cache key
 */
async function setMetadata(key: string, meta: CacheMetadata): Promise<void> {
  try {
    const db = await openMetadataDb();
    const transaction = db.transaction(METADATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, ...meta });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set metadata'));
    });
  } catch (error) {
    console.error('Error setting metadata:', error);
    throw error;
  }
}

/**
 * Deletes metadata for a cache key
 */
async function deleteMetadata(key: string): Promise<void> {
  try {
    const db = await openMetadataDb();
    const transaction = db.transaction(METADATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete metadata'));
    });
  } catch (error) {
    console.error('Error deleting metadata:', error);
    throw error;
  }
}

/**
 * Gets all metadata entries sorted by lastAccessed (for LRU eviction)
 */
async function getAllMetadata(): Promise<(CacheMetadata & { key: string })[]> {
  try {
    const db = await openMetadataDb();
    const transaction = db.transaction(METADATA_STORE_NAME, 'readonly');
    const store = transaction.objectStore(METADATA_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get all metadata'));
    });
  } catch (error) {
    console.error('Error getting all metadata:', error);
    return [];
  }
}

/**
 * Enforces cache size limits using LRU eviction
 */
async function enforceCacheLimits(): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const allMetadata = await getAllMetadata();
    
    // Calculate current cache size
    const currentSizeMB = allMetadata.reduce((total, meta) => total + (meta.size / (1024 * 1024)), 0);
    
    console.log('Cache: Current size: ' + currentSizeMB.toFixed(2) + 'MB / ' + AI.voice.maxCacheMB + 'MB');
    
    if (currentSizeMB > AI.voice.maxCacheMB) {
      // Sort by lastAccessed (oldest first) for LRU eviction
      allMetadata.sort((a, b) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp));
      
      let sizeToRemove = currentSizeMB - (AI.voice.maxCacheMB * 0.8); // Target 80% of max size
      let removedSize = 0;
      
      for (const entry of allMetadata) {
        if (removedSize >= sizeToRemove) break;
        
        try {
          await cache.delete(new Request(entry.key));
          await deleteMetadata(entry.key);
          removedSize += entry.size / (1024 * 1024);
          console.log(\`Cache: Evicted ${entry.key}, freed ${(entry.size / (1024 * 1024)).toFixed(2)}MB`);
          console.log('Cache: Evicted ' + entry.key + ', freed ' + (entry.size / (1024 * 1024)).toFixed(2) + 'MB');
        } catch (error) {
          console.error('Cache: Failed to evict ' + entry.key + ':', error);
        }
      }
      
      console.log('Cache: Eviction complete. Freed ' + removedSize.toFixed(2) + 'MB');
    }
  } catch (error) {
    console.error('Cache: Error enforcing limits:', error);
  }
}

/**
 * Retrieves an item from the cache.
 */
export async function get(key: string): Promise<{ data: Blob | string, meta: CacheMetadata } | null> {
  console.log('Cache: Attempting to get key:', key);
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(new Request(key));
    
    if (response) {
      const meta = await getMetadata(key);
      if (meta) {
        // Update lastAccessed for LRU
        const updatedMeta = { ...meta, lastAccessed: Date.now() };
        await setMetadata(key, updatedMeta);
        
        const data = await response.blob();
        return { data, meta: updatedMeta };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Cache: Error retrieving key:', key, error);
    return null;
  }
}

/**
 * Stores an item in the cache.
 */
export async function set(key: string, data: Blob | string, meta: CacheMetadata): Promise<void> {
  console.log('Cache: Setting key:', key, 'with data size:', meta.size);
  
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Create response with appropriate headers
    const headers = new Headers({
      'Content-Type': meta.contentType || 'audio/mpeg',
      'Cache-Control': 'max-age=2592000' // 30 days
    });
    
    const response = new Response(data, { headers });
    await cache.put(new Request(key), response);
    
    // Store metadata
    await setMetadata(key, { ...meta, lastAccessed: Date.now() });
    
    // Enforce cache limits after adding new item
    await enforceCacheLimits();
    
    console.log('Cache: Successfully cached key:', key);
  } catch (error) {
    console.error('Cache: Error setting key:', key, error);
    throw error;
  }
}

/**
 * Checks if an item exists in the cache.
 */
export async function has(key: string): Promise<boolean> {
  console.log('Cache: Checking for key:', key);
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(new Request(key));
    return !!response;
  } catch (error) {
    console.error('Cache: Error checking key:', key, error);
    return false;
  }
}

/**
 * Clears all cached items
 */
export async function clear(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
    
    // Clear metadata database
    const db = await openMetadataDb();
    const transaction = db.transaction(METADATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('Cache: Cleared all cached items');
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to clear metadata'));
    });
  } catch (error) {
    console.error('Cache: Error clearing cache:', error);
    throw error;
  }
}

/**
 * Gets cache statistics
 */
export async function getStats(): Promise<{totalItems: number, totalSizeMB: number}> {
  try {
    const allMetadata = await getAllMetadata();
    const totalItems = allMetadata.length;
    const totalSizeMB = allMetadata.reduce((total, meta) => total + (meta.size / (1024 * 1024)), 0);
    
    return { totalItems, totalSizeMB };
  } catch (error) {
    console.error('Cache: Error getting stats:', error);
    return { totalItems: 0, totalSizeMB: 0 };
  }
}