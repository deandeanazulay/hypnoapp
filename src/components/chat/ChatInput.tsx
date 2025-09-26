import React from 'react';
import { Send, RotateCcw, Mic, Square, Play, Trash2 } from 'lucide-react';

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
  placeholder?: string;
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
  hasMessages,
  placeholder = "Ask Libero about protocols, ego states, or transformation techniques..."
}: ChatInputProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed left-0 right-0 bg-black/98 backdrop-blur-xl border-t border-white/20 z-50" 
         style={{ 
           bottom: 'var(--total-nav-height, 128px)', 
           paddingTop: '1rem',
           paddingBottom: '1rem',
           paddingLeft: '1rem',
           paddingRight: '1rem'
         }}>
      <div className="px-4">
        <div className="max-w-3xl mx-auto">
          {/* Voice Recording Preview */}
          {hasRecording && (
            <div className="mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-500/50 flex items-center justify-center">
                    <Mic size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Voice Message</div>
                    <div className="text-blue-400 text-xs">{formatTime(recordingDuration)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onPlayRecording}
                    className="p-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all hover:scale-110"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={onDeleteRecording}
                    className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={onSendRecording}
                    className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-white/10 to-white/15 backdrop-blur-xl rounded-2xl border border-white/25 p-3 shadow-2xl">
            <form onSubmit={onSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading || isRecording}
                className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none text-base disabled:opacity-50 py-3 px-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
              />
              
              {/* Control Buttons */}
              <div className="flex items-center space-x-2">
                {/* Voice Recording Button */}
                <button
                  type="button"
                  onMouseDown={onStartRecording}
                  onMouseUp={onStopRecording}
                  onTouchStart={onStartRecording}
                  onTouchEnd={onStopRecording}
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  disabled={isLoading}
                  className={`p-2.5 rounded-xl transition-all hover:scale-110 border relative ${
                    isRecording
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30' 
                      : hasRecording
                      ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30'
                      : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
                  }`}
                >
                  {isRecording ? <Square size={16} /> : <Mic size={16} />}
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black" />
                  )}
                </button>
                
                {/* Clear Chat Button */}
                {hasMessages && (
                  <button
                    type="button"
                    onClick={onClearChat}
                    disabled={isRecording}
                    className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/70 hover:text-white/90 transition-all hover:scale-110"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !hasRecording) || isLoading || isRecording}
                  className="p-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-teal-400/25 flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
            
            {/* Recording Timer */}
            {isRecording && (
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-medium">Recording: {formatTime(recordingDuration)}</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}