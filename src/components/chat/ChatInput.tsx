import React from 'react';
import { Send, Mic, RotateCcw, Trash2, Play, Pause } from 'lucide-react';

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
  const [isPointerDown, setIsPointerDown] = React.useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsPointerDown(true);
    onStartRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsPointerDown(false);
    onStopRecording();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsPointerDown(false);
    onStopRecording();
  };

  // Show recording interface if currently recording or has recording
  if (isRecording || hasRecording) {
    return (
      <div className="fixed bottom-5 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/20 p-4"
           style={{ paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}>
        <div className="max-w-3xl mx-auto">
          {isRecording ? (
            /* Recording Active State */
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-3 bg-red-500/20 border border-red-500/40 rounded-full px-6 py-3">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">{formatTime(recordingDuration)}</span>
                <span className="text-white/80 text-sm">Recording...</span>
              </div>
              
              <button
                onClick={onStopRecording}
                className="w-12 h-12 rounded-full bg-red-500/30 border-2 border-red-500/60 text-red-400 flex items-center justify-center hover:bg-red-500/40 transition-all"
              >
                <div className="w-4 h-4 bg-red-400 rounded"></div>
              </button>
            </div>
          ) : (
            /* Has Recording State */
            <div className="flex items-center justify-between">
              <button
                onClick={onDeleteRecording}
                className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center hover:bg-red-500/30 hover:scale-110 transition-all"
              >
                <Trash2 size={20} />
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={isPlayingRecording ? () => {} : onPlayRecording}
                  className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 hover:scale-110 transition-all"
                >
                  {isPlayingRecording ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                
                <div className="text-center">
                  <div className="text-white font-medium">{formatTime(recordingDuration)}</div>
                  <div className="text-white/60 text-xs">Voice message</div>
                </div>
              </div>
              
              <button
                onClick={onSendRecording}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-teal-400/30"
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal chat input state
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/20 p-4"
         style={{ paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="flex items-center space-x-3">
          {/* Retry Button (Left) - Telegram Style */}
          {hasMessages && (
            <button
              type="button"
              onClick={() => {
                // Retry last message - resend the last user message
                if (hasMessages) {
                  onClearChat();
                }
              }}
              className="w-12 h-12 rounded-full bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 text-gray-400 hover:text-gray-300 transition-all hover:scale-110 shadow-lg flex items-center justify-center"
              title="Clear chat"
            >
              <RotateCcw size={20} />
            </button>
          )}

          {/* Text Input - Flexible */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Message Libero..."
              disabled={isLoading}
              className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-teal-500/50 focus:bg-white/15 transition-all disabled:opacity-50"
            />
          </div>

          {/* Right Button - Changes based on input */}
          {inputText.trim() ? (
            /* Send Button */
            <button
              type="submit"
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 text-black flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 shadow-lg shadow-teal-400/30"
            >
              <Send size={20} />
            </button>
          ) : (
            /* Microphone Button */
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onTouchStart={(e) => { e.preventDefault(); handlePointerDown(e as any); }}
              onTouchEnd={(e) => { e.preventDefault(); handlePointerUp(e as any); }}
              disabled={isLoading}
              className={`w-12 h-12 rounded-full border-2 transition-all select-none touch-none shadow-lg disabled:opacity-50 flex items-center justify-center ${
                isPointerDown || isRecording
                  ? 'bg-red-500/30 border-red-500/60 text-red-400 scale-110 shadow-red-500/50' 
                  : 'bg-blue-500/30 border-blue-500/60 text-blue-400 hover:bg-blue-500/40 hover:scale-110 shadow-blue-500/30'
              }`}
              title={isPointerDown ? "Recording... release to stop" : "Hold to record voice message"}
            >
              <Mic size={20} />
              
              {/* Recording pulse effect */}
              {(isPointerDown || isRecording) && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                  <div className="absolute inset-0 rounded-full border border-red-300 animate-pulse" />
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}