import React from 'react';
import { Send, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearChat: () => void;
  onToggleMute: () => void;
  isLoading: boolean;
  isMuted: boolean;
  hasMessages: boolean;
  placeholder?: string;
}

export default function ChatInput({
  inputText,
  onInputChange,
  onSubmit,
  onClearChat,
  onToggleMute,
  isLoading,
  isMuted,
  hasMessages,
  placeholder = "Ask Libero about protocols, ego states, or transformation techniques..."
}: ChatInputProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/98 backdrop-blur-xl border-t border-white/20 px-4 py-4 z-50" 
         style={{ paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
      <div className="px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/15 backdrop-blur-xl rounded-2xl border border-white/25 p-3 shadow-2xl">
            <form onSubmit={onSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
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
                {/* Audio Control */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`p-2.5 rounded-xl transition-all hover:scale-110 border ${
                    isMuted 
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                
                {/* Clear Chat Button */}
                {hasMessages && (
                  <button
                    type="button"
                    onClick={onClearChat}
                    className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/70 hover:text-white/90 transition-all hover:scale-110"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
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