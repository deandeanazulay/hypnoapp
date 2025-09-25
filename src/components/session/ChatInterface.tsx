import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Brain, MessageCircle, Loader } from 'lucide-react';

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  conversation: ChatMessage[];
  onUserInput: (input: string) => void;
  isThinking: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isVoiceEnabled: boolean;
  isMicEnabled: boolean;
  onToggleListening: () => void;
  onToggleVoice: () => void;
  onToggleMic: () => void;
}

export default function ChatInterface({
  conversation,
  onUserInput,
  isThinking,
  isSpeaking,
  isListening,
  isVoiceEnabled,
  isMicEnabled,
  onToggleListening,
  onToggleVoice,
  onToggleMic
}: ChatInterfaceProps) {
  const [textInput, setTextInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      onUserInput(textInput.trim());
      setTextInput('');
    }
  };

  const quickSuggestions = [
    'I feel stressed',
    'Help me focus', 
    'I want to relax',
    'I need confidence'
  ];

  return (
    <div className="space-y-4">
      {/* Conversation Bubble */}
      {conversation.length > 0 && (
        <div className="mx-6">
          <div className="bg-teal-500/20 backdrop-blur-xl rounded-3xl p-4 border border-teal-500/30 shadow-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <Brain size={14} className="text-teal-400" />
              <span className="text-teal-100 text-sm font-medium">Libero</span>
            </div>
            <p className="text-teal-50 text-sm leading-relaxed">
              {conversation[conversation.length - 1]?.content || 'Welcome to your session...'}
            </p>
            
            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-teal-500/20">
                <Loader size={14} className="text-teal-400 animate-spin" />
                <span className="text-teal-200 text-xs">Tuning into your energy...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Interface */}
      <div className="mx-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main Input Row */}
          <div className="flex items-center space-x-3">
            {/* Voice Button */}
            <button
              type="button"
              onClick={onToggleListening}
              disabled={!isMicEnabled || isThinking}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-xl ${
                isListening 
                  ? 'bg-red-500/30 border-2 border-red-500/60 text-red-400 animate-pulse shadow-red-500/30' 
                  : 'bg-teal-500/20 border border-teal-500/40 text-teal-400 shadow-teal-500/20'
              }`}
            >
              <Mic size={20} />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
                disabled={isListening || isThinking}
                className="w-full bg-black/40 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/60 focus:bg-black/60 transition-all disabled:opacity-50 shadow-xl"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!textInput.trim() || isThinking}
              className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 hover:bg-teal-500/30 transition-all hover:scale-110 disabled:opacity-50 shadow-xl shadow-teal-500/20"
            >
              <Send size={20} />
            </button>

            {/* Audio Controls */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                isVoiceEnabled 
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400 shadow-green-500/20' 
                  : 'bg-white/10 border border-white/20 text-white/60'
              }`}
            >
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                isMicEnabled 
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 shadow-blue-500/20' 
                  : 'bg-white/10 border border-white/20 text-white/60'
              }`}
            >
              <Mic size={16} />
            </button>
          </div>

          {/* Session Progress Text */}
          <div className="text-center">
            <span className="text-white/60 text-sm">
              Session progress: 1 of 5 segments • 1 buffered ahead
            </span>
          </div>

          {/* Quick Suggestions */}
          {conversation.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onUserInput(suggestion)}
                  disabled={isThinking}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/70 text-sm transition-all hover:scale-105 disabled:opacity-50 shadow-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}