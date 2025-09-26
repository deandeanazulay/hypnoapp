// src/config/ai.ts

/**
 * Configuration for AI and voice services.
 */
export const AI = {
  chatgptModel: 'gpt-4o',         // OpenAI ChatGPT model - 'gpt-4o' for best quality, 'gpt-3.5-turbo' for speed
  chatgptTimeoutMs: 8000,         // Hard timeout for ChatGPT API calls
  chatgptMaxRetries: 2,           // Max retries for transient ChatGPT errors
  elevenLabsBaseUrl: 'https://api.elevenlabs.io/v1', // ElevenLabs API base URL
  voice: {
    defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - calm, deep male voice perfect for hypnosis
    model: 'v3' as 'flash-v2.5' | 'v3', // 'flash-v2.5' for low latency, 'v3' for expressive quality
    preBufferSegments: 2,          // Number of audio segments to pre-buffer ahead of current playback
    maxCacheMB: 120,               // Maximum size for audio cache in MB
    maxCharactersPerRequest: 3000  // Character limit for eleven_flash_v2_5 (ultra-low latency)
  },
  // Add other AI-related configurations here
};