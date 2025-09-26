import React, { useRef, useEffect } from 'react';
import { Send, RotateCcw, Mic, Square, Play, Trash2, X } from 'lucide-react';

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
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = React.useState({ x: 0, y: 0 });
  const [showCancelIndicator, setShowCancelIndicator] = React.useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mouse/touch events for hold-to-record
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
    setDragPosition({ x: 0, y: 0 });
    onStartRecording();
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    setDragPosition({ x: deltaX, y: deltaY });
    
    // Show cancel indicator if dragged left significantly
    const shouldShowCancel = deltaX < -50;
    setShowCancelIndicator(shouldShowCancel);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check if should cancel (dragged left)
    if (showCancelIndicator) {
      onDeleteRecording(); // Cancel recording
      setShowCancelIndicator(false);
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } else {
      onStopRecording();
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    
    setDragPosition({ x: 0, y: 0 });
  };

  // Global pointer events to handle dragging outside button
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startPosition.x;
      setDragPosition({ x: deltaX, y: 0 });
      setShowCancelIndicator(deltaX < -50);
    };

    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (showCancelIndicator) {
          onDeleteRecording();
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
        } else {
          onStopRecording();
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        }
        setShowCancelIndicator(false);
        setDragPosition({ x: 0, y: 0 });
      }
    };

    if (isDragging) {
      document.addEventListener('pointermove', handleGlobalPointerMove);
      document.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, startPosition, showCancelIndicator, onStopRecording, onDeleteRecording]);

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
          {hasRecording && !isRecording && (
            <div className="mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 border border-blue-500/50 flex items-center justify-center">
                    <Mic size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Voice Message</div>
                    <div className="text-blue-400 text-xs">{formatTime(recordingDuration)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onPlayRecording}
                    disabled={isPlayingRecording}
                    className="p-2 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all hover:scale-110 disabled:opacity-50"
                  >
                    {isPlayingRecording ? (
                      <div className="w-4 h-4 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                  <button
                    onClick={onDeleteRecording}
                    className="p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 hover:bg-red-500/30 transition-all hover:scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={onSendRecording}
                    className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="mb-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-4 animate-bounce-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-500/50 flex items-center justify-center animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm flex items-center space-x-2">
                      <span>Recording</span>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-400 rounded-full animate-pulse"
                            style={{
                              height: `${8 + Math.random() * 16}px`,
                              animationDelay: `${i * 100}ms`,
                              animationDuration: '0.8s'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-red-400 text-xs font-mono">{formatTime(recordingDuration)}</div>
                  </div>
                </div>
                
                {/* Cancel Indicator */}
                {showCancelIndicator && (
                  <div className="flex items-center space-x-2 text-red-400 animate-bounce-in">
                    <X size={16} />
                    <span className="text-sm font-medium">Release to cancel</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-center">
                <p className="text-white/70 text-xs">
                  Hold to record • Slide left to cancel • Release to stop
                </p>
              </div>
            </div>
          )}
          
          {/* Main Input Form */}
          <div className="bg-gradient-to-br from-white/10 to-white/15 backdrop-blur-xl rounded-2xl border border-white/25 p-3 shadow-2xl">
            <form onSubmit={onSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={isRecording ? "Recording..." : placeholder}
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
                {/* Clear Chat Button */}
                {hasMessages && !isRecording && !hasRecording && (
                  <button
                    type="button"
                    onClick={onClearChat}
                    className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/70 hover:text-white/90 transition-all hover:scale-110"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                
                {/* Voice Recording Button - WhatsApp Style */}
                <button
                  ref={micButtonRef}
                  type="button"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  disabled={isLoading}
                  className={`relative p-2.5 rounded-xl transition-all border select-none touch-none ${
                    isRecording
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse scale-110' 
                      : hasRecording
                      ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30 hover:scale-110'
                      : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30 hover:scale-110'
                  }`}
                  style={{
                    transform: isDragging ? `translateX(${dragPosition.x}px)` : undefined,
                    transition: isDragging ? 'none' : 'all 0.2s ease'
                  }}
                >
                  {isRecording ? (
                    <Square size={16} />
                  ) : hasRecording ? (
                    <div className="w-4 h-4 bg-green-400 rounded-full" />
                  ) : (
                    <Mic size={16} />
                  )}
                  
                  {/* Recording pulse effect */}
                  {isRecording && (
                    <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping" />
                  )}
                </button>
                
                {/* Send Button - Always Visible */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !hasRecording) || isLoading || isRecording}
                  className="p-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-teal-400/25 flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}