import React from 'react';
import { User, Copy, Clock } from 'lucide-react';
import Orb from '../Orb';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
  audioUrl?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  activeEgoState: string;
  isSpeaking?: boolean;
}

export default function ChatBubble({ message, onCopy, activeEgoState, isSpeaking = false }: ChatBubbleProps) {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const playAudioMessage = () => {
    if (!message.audioUrl) return;
    
    const audio = new Audio(message.audioUrl);
    setIsPlayingAudio(true);
    
    audio.onended = () => {
      setIsPlayingAudio(false);
    };
    
    audio.onerror = () => {
      setIsPlayingAudio(false);
    };
    
    audio.play();
  };

  return (
    <div className={`flex gap-3 mb-4 animate-slide-up ${
      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
    }`}>
      {/* Avatar */}
      <div className="flex-shrink-0 self-start">
        {message.role === 'libero' ? (
          <div className={`transition-all duration-300 ${isSpeaking ? 'animate-pulse' : ''}`}>
            <Orb
              onTap={() => {}}
              egoState={activeEgoState}
             size={60}
             variant="webgl"
              className="orb-avatar"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border-2 border-teal-400/50 flex items-center justify-center">
            <User size={18} className="text-teal-400" />
          </div>
        )}
      </div>
      
      {/* Message Bubble */}
      <div className={`max-w-[75%] flex flex-col ${
        message.role === 'user' ? 'items-end' : 'items-start'
      }`}>
        <div className={`rounded-2xl p-4 backdrop-blur-xl border relative group shadow-lg ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-white rounded-tr-md'
            : message.error
            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 text-white rounded-tl-md'
            : message.isLoading
            ? 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-white rounded-tl-md'
            : 'bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border-purple-500/30 text-white rounded-tl-md'
        }`}>
          {/* Loading State */}
          {message.isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-white/80 font-medium">Libero is thinking...</span>
            </div>
          ) : (
            <>
              {/* Audio Message Player */}
              {message.audioUrl && (
                <div className="flex items-center space-x-3 mb-3 p-2 bg-black/20 rounded-lg border border-white/10">
                  <button
                    onClick={playAudioMessage}
                    className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center hover:bg-blue-500/30 transition-all"
                  >
                    {isPlayingAudio ? (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    )}
                  </button>
                  <span className="text-white/70 text-sm">Voice message</span>
                </div>
              )}

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/95">
                {message.content}
              </div>

              {/* Copy Button */}
              <button
                onClick={() => onCopy(message.content)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/20 rounded-lg transition-all hover:scale-110"
              >
                <Copy size={12} className="text-white/40 hover:text-white/70" />
              </button>
            </>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-white/50 mt-1 px-2 ${
          message.role === 'user' ? 'text-right' : 'text-left'
        }`}>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}