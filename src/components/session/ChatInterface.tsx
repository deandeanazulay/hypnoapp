import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Brain, MessageCircle, Loader, ArrowUp } from 'lucide-react';

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
    <div className="absolute bottom-0 left-0 right-0 z-40">
      {/* Libero Message Bubble - Only latest AI message */}
      {latestAiMessage && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-br from-teal-500/30 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/40 shadow-2xl shadow-teal-500/10 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-teal-400/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain size={18} className="text-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-teal-100 text-sm font-semibold">Libero</span>
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
                <p className="text-teal-50 text-base leading-relaxed">
                  {latestAiMessage.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Input Dock */}
      <div className="bg-black/95 backdrop-blur-xl border-t border-white/20 p-6">
        {/* Main Input Row */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-4">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onToggleListening}
            disabled={!isMicEnabled || isThinking}
            className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-xl ${
              isListening 
                ? 'bg-red-500/30 border-2 border-red-400/80 text-red-300 animate-pulse shadow-red-500/30' 
                : 'bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300 shadow-teal-500/20'
            }`}
          >
            <Mic size={22} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              disabled={isListening || isThinking}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 text-white text-lg placeholder-white/50 focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all disabled:opacity-50 shadow-xl"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300 hover:scale-110 transition-all disabled:opacity-50 shadow-xl shadow-teal-500/20"
          >
            <ArrowUp size={22} />
          </button>

          {/* Audio Controls */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleVoice}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                isVoiceEnabled 
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400 shadow-green-500/20' 
                  : 'bg-white/10 border border-white/20 text-white/60'
              }`}
            >
              {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                isMicEnabled 
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 shadow-blue-500/20' 
                  : 'bg-white/10 border border-white/20 text-white/60'
              }`}
            >
              <Mic size={18} />
            </button>
          </div>
        </form>

        {/* Session Progress */}
        <div className="text-center mb-4">
          <span className="text-white/60 text-sm">
            Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
          </span>
        </div>

        {/* Quick Suggestions */}
        {conversation.length <= 1 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onUserInput(suggestion)}
                disabled={isThinking}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 rounded-2xl text-white/80 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
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