import React, { useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface VoiceInputDockProps {
  textInput: string;
  onTextChange: (text: string) => void;
  onSubmit: (input: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isMicEnabled: boolean;
  micPermission: 'granted' | 'denied' | 'prompt' | 'checking';
  isThinking: boolean;
  placeholder?: string;
}

export default function VoiceInputDock({
  textInput,
  onTextChange,
  onSubmit,
  isListening,
  onToggleListening,
  isMicEnabled,
  micPermission,
  isThinking,
  placeholder = "Share what's happening for you..."
}: VoiceInputDockProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      onSubmit(textInput.trim());
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur-xl border-t border-white/20">
      {/* Voice Input Button - Separate */}
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={onToggleListening}
          disabled={!isMicEnabled || micPermission === 'denied' || isThinking}
          className={`w-16 h-16 rounded-full border-2 transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
            isListening 
              ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse' 
              : micPermission === 'granted' && isMicEnabled
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
              : 'bg-white/10 border-white/20 text-white/30 cursor-not-allowed'
          }`}
        >
          <Mic size={24} />
        </button>
      </div>

      {/* Text Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={isListening ? "Listening..." : placeholder}
          disabled={isListening || isThinking}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={!textInput.trim() || isThinking}
          className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-xl hover:bg-teal-500/30 transition-all hover:scale-110 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}