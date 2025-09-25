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
    <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-4">
      {/* Libero Message Bubble - Only latest AI message */}
      {latestAiMessage && (
        <div className="mb-4">
          <div className="bg-gradient-to-br from-teal-500/30 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/40 shadow-2xl shadow-teal-500/10 max-w-5xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-teal-400/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain size={20} className="text-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-teal-100 text-base font-semibold">Libero</span>
                  {isThinking && (
                    <div className="flex items-center space-x-2">
                      <Loader size={12} className="text-teal-300 animate-spin" />
                      <span className="text-teal-200 text-xs">thinking...</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-200 text-xs">speaking</span>
                    </div>
                  )}
                </div>
                <p className="text-teal-50 text-lg leading-relaxed">
                  {latestAiMessage.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Progress Text - Above Input */}
      <div className="text-center mb-4">
        <span className="text-white/60 text-sm">
          Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
        </span>
      </div>

      {/* Bottom Input Dock - Matching 2nd Image Layout */}
      <div className="space-y-3">
        {/* Main Input Row */}
        <div className="flex items-center space-x-3">
          {/* Large Circular Mic Button - Far Left */}
          <button
            type="button"
            onClick={onToggleListening}
            disabled={!isMicEnabled || isThinking}
            className={`w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-2xl ${
              isListening 
                ? 'bg-gradient-to-br from-red-500/50 to-red-600/40 border-2 border-red-400/80 text-red-200 animate-pulse shadow-red-500/50' 
                : 'bg-gradient-to-br from-teal-500/50 to-cyan-500/40 border-2 border-teal-400/80 text-teal-200 shadow-teal-500/40'
            }`}
          >
            <Mic size={26} />
          </button>

          {/* Text Input - Center */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              disabled={isListening || isThinking}
              className="w-full bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-4 pr-16 text-white text-lg placeholder-white/50 focus:outline-none focus:border-teal-400/60 focus:bg-black/90 transition-all disabled:opacity-50 shadow-xl"
            />
          </div>

          {/* Send Button - Separate, Right of Input */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (textInput.trim() && !isThinking) {
                onUserInput(textInput.trim());
                setTextInput('');
              }
            }}
            disabled={!textInput.trim() || isThinking}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/40 to-cyan-500/30 border-2 border-teal-400/70 text-teal-200 hover:scale-110 transition-all disabled:opacity-50 shadow-xl shadow-teal-500/30"
          >
            <ArrowUp size={22} />
          </button>

          {/* Audio Controls - Far Right (Circular) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleVoice}
              className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-xl ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-br from-green-500/40 to-emerald-500/30 border-2 border-green-400/70 text-green-200 shadow-green-500/30' 
                  : 'bg-gradient-to-br from-black/80 to-gray-900/60 border-2 border-white/30 text-white/60 shadow-black/30'
              }`}
            >
              {isVoiceEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-xl ${
                isMicEnabled 
                  ? 'bg-gradient-to-br from-blue-500/40 to-cyan-500/30 border-2 border-blue-400/70 text-blue-200 shadow-blue-500/30' 
                  : 'bg-gradient-to-br from-black/80 to-gray-900/60 border-2 border-white/30 text-white/60 shadow-black/30'
              }`}
            >
              {isMicEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
          </div>
        </div>

        {/* Quick Suggestions Pills - Below Input */}
        {conversation.length <= 1 && (
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onUserInput(suggestion)}
                disabled={isThinking}
                className="px-5 py-3 bg-gradient-to-br from-black/70 to-gray-900/50 backdrop-blur-sm hover:bg-black/90 border border-white/30 rounded-2xl text-white/80 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl hover:border-teal-400/40"
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