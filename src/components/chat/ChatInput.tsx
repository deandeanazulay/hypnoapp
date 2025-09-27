import React from 'react';
import { Send, RotateCcw, Mic, MicOff, Play, Trash2, Square } from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearChat: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onDeleteRecording: () => void;
  onSendRecording: () => void;
  isLoading: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  isPlayingRecording: boolean;
  recordingDuration: number;
  hasMessages: boolean;
}

export default function ChatInput({
  inputText,
  onInputChange,
  onSubmit,
  onClearChat,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onDeleteRecording,
  onSendRecording,
  isLoading,
  isRecording,
  hasRecording,
  isPlayingRecording,
  recordingDuration,
  hasMessages
}: ChatInputProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording interface
  if (hasRecording) {
    return (
      <div 
        className="fixed left-0 right-0 z-50 bg-gradient-to-r from-black/95 via-purple-950/95 to-black/95 backdrop-blur-xl border-t border-white/10 p-4"
        style={{ bottom: 'var(--total-nav-height, 64px)', paddingBottom: '1rem' }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={onPlayRecording}
              disabled={isPlayingRecording}
              className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center hover:bg-blue-500/30 transition-all hover:scale-110 disabled:opacity-50"
            >
              <Play size={20} className="text-blue-400 ml-1" />
            </button>
            
            <div className="text-white">
              <div className="text-sm font-medium">Voice Recording</div>
              <div className="text-xs text-white/70">{formatTime(recordingDuration)}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onDeleteRecording}
              className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/30 transition-all hover:scale-110"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
            
            <button
              onClick={onSendRecording}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-teal-500/25"
            >
              <Send size={20} className="text-black ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal input interface
  return (
    <div 
      className="fixed left-0 right-0 z-50 bg-gradient-to-r from-black/95 via-purple-950/95 to-black/95 backdrop-blur-xl border-t border-white/10 p-4"
      style={{ bottom: 'var(--total-nav-height, 64px)', paddingBottom: '1rem' }}
    >
      <div className="flex items-end space-x-3 max-w-md mx-auto">
        {/* Retry Button */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="w-12 h-12 rounded-full bg-gray-500/20 border border-gray-500/40 flex items-center justify-center hover:bg-gray-500/30 transition-all hover:scale-110 flex-shrink-0"
            title="Start new conversation"
          >
            <RotateCcw size={18} className="text-gray-400" />
          </button>
        )}
        
        {/* Input Field */}
        <div className="flex-1 relative">
          <form onSubmit={onSubmit} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Message Libero..."
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all disabled:opacity-50"
              />
            </div>
          </form>
        </div>

        {/* Microphone Button */}
        <button
          onPointerDown={onStartRecording}
          onPointerUp={onStopRecording}
          onPointerLeave={onStopRecording}
          onTouchStart={onStartRecording}
          onTouchEnd={onStopRecording}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            isRecording
              ? 'bg-red-500/30 border-red-500/60 scale-110 shadow-lg shadow-red-500/25'
              : 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 hover:scale-110'
          } disabled:opacity-50`}
          title={isRecording ? "Recording..." : "Hold to record"}
        >
          {isRecording ? (
            <Square size={18} className="text-red-400" />
          ) : (
            <Mic size={18} className="text-blue-400" />
          )}
        </button>

        {/* Send Button - only show when there's text */}
        {inputText.trim() && (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 flex-shrink-0 shadow-lg shadow-teal-500/25"
          >
            <Send size={20} className="text-black ml-1" />
          </button>
        )}
      </div>

      {/* Recording pulse animation */}
      {isRecording && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
        </div>
      )}
    </div>
  );
}