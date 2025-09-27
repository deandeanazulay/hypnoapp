// src/config/ai.ts

/**
 * Configuration for AI and voice services.
 */
export const AI = {
  chatgptModel: 'gpt-4o',         // OpenAI ChatGPT model - 'gpt-4o' for best quality, 'gpt-3.5-turbo' for speed
  chatgptTimeoutMs: 8000,         // Hard timeout for ChatGPT API calls
  chatgptMaxRetries: 2,           // Max retries for transient ChatGPT errors
  openaiTtsBaseUrl: 'https://api.openai.com/v1/audio/speech', // OpenAI TTS API base URL
  voice: {
    defaultVoiceId: 'ash', // Ash - hypnotic voice as requested
    model: 'tts-1', // OpenAI's TTS model
    instructions: 'speak in a hypnotic voice', // Hypnotic voice instruction
    speed: 1.0, // Normal speed as specified
    preBufferSegments: 2,          // Number of audio segments to pre-buffer ahead of current playback
    maxCacheMB: 120,               // Maximum size for audio cache in MB
    maxCharactersPerRequest: 4096  // Character limit for OpenAI TTS
  },
  // Add other AI-related configurations here
};