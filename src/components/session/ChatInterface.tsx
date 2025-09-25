import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Brain, MessageCircle, Loader, ArrowUp, MicOff } from 'lucide-react';

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
  currentSegment: number;
  totalSegments: number;
  bufferedAhead: number;
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
  onToggleMic,
  currentSegment,
  totalSegments,
  bufferedAhead
}: ChatInterfaceProps) {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

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

  const latestAiMessage = conversation.filter(msg => msg.role === 'ai').slice(-1)[0];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-6">
      {/* Libero Message Bubble - Only latest AI message */}
      {latestAiMessage && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-teal-500/25 to-cyan-500/15 backdrop-blur-xl rounded-2xl p-5 border border-teal-500/30 shadow-2xl max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 border border-teal-400/60 flex items-center justify-center flex-shrink-0">
                <Brain size={20} className="text-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-teal-100 text-lg font-medium">Libero</span>
                  {isThinking && (
                    <div className="flex items-center space-x-2">
                      <Loader size={12} className="text-teal-300 animate-spin" />
                      <span className="text-teal-200 text-sm">thinking...</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-200 text-sm">speaking</span>
                    </div>
                  )}
                </div>
                <p className="text-teal-50 text-base leading-relaxed">
                  {latestAiMessage.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Progress Text - Above Input */}
      <div className="text-center mb-3">
        <span className="text-white/50 text-sm">
          Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
        </span>
      </div>

      {/* Bottom Input Dock - Exactly Like 2nd Image */}
      <div className="space-y-4">
        {/* Main Input Row - Exactly matching the 2nd image layout */}
        <div className="flex items-center space-x-4">
          {/* Large Circular Mic Button - Far Left (matches 2nd image) */}
          <button
            type="button"
            onClick={onToggleListening}
            disabled={!isMicEnabled || isThinking}
            className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-xl ${
              isListening 
                ? 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-2 border-red-400/60 text-red-300 animate-pulse' 
                : 'bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300'
            }`}
          >
            <Mic size={20} />
          </button>

          {/* Text Input - Center (matching 2nd image) */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              disabled={isListening || isThinking}
              className="w-full bg-black/40 backdrop-blur-xl border border-white/20 rounded-full px-6 py-4 pr-16 text-white text-base placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-black/60 transition-all disabled:opacity-50"
            />
          </div>

          {/* Send Button - Circular, Right of Input (matching 2nd image) */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (textInput.trim() && !isThinking) {
                onUserInput(textInput.trim());
                setTextInput('');
              }
            }}
            disabled={!textInput.trim() || isThinking}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300 hover:scale-110 transition-all disabled:opacity-50"
          >
            <ArrowUp size={16} />
          </button>

          {/* Audio Controls - Far Right (matching 2nd image) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleVoice}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border-2 border-green-400/60 text-green-300' 
                  : 'bg-black/60 border-2 border-white/30 text-white/60'
              }`}
            >
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 ${
                isMicEnabled 
                  ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-2 border-blue-400/60 text-blue-300' 
                  : 'bg-black/60 border-2 border-white/30 text-white/60'
              }`}
            >
              {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>
        </div>

        {/* Quick Suggestions Pills - Below Input */}
        {conversation.length <= 1 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onUserInput(suggestion)}
                disabled={isThinking}
                className="px-4 py-2 bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 rounded-full text-white/70 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 hover:border-teal-400/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}