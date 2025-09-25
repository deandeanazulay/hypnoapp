```typescript
// src/config/ai.ts

/**
 * Configuration for AI and voice services.
 */
export const AI = {
  geminiModel: 'gemini-1.5-flash', // Start with 'gemini-1.5-flash', upgrade path 'gemini-1.5-pro'
  geminiTimeoutMs: 8000,           // Hard timeout for Gemini API calls
  geminiMaxRetries: 2,             // Max retries for transient Gemini errors
  voice: {
    defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Placeholder: Replace with an actual ElevenLabs voice ID
    model: 'flash-v2.5' as 'flash-v2.5' | 'v3', // 'flash-v2.5' for low latency, 'v3' for expressive
    preBufferSegments: 2,          // Number of audio segments to pre-buffer ahead of current playback
    maxCacheMB: 120                // Maximum size for audio cache in MB
  },
  // Add other AI-related configurations here
};
```