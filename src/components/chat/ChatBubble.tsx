import React from 'react';
import { User, Copy } from 'lucide-react';
import Orb from '../Orb';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  activeEgoState: string;
}

export default function ChatBubble({ message, onCopy, activeEgoState }: ChatBubbleProps) {
  return (
    <div className={`flex items-start gap-3 mb-4 animate-slide-up ${
      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
    }`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border-2 border-teal-400/50 flex items-center justify-center">
            <User size={16} className="text-teal-400" />
          </div>
        ) : (
          /* Libero Orb Avatar - Fixed 60px size */
          <Orb
            onTap={() => {}}
            egoState={activeEgoState}
            size={60}
            variant="webgl"
          />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`max-w-[75%] rounded-2xl p-4 backdrop-blur-xl border relative group shadow-xl ${
        message.role === 'user'
          ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-white'
          : message.error
          ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 text-white'
          : message.isLoading
          ? 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-white'
          : 'bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border-purple-500/30 text-white'
      }`}>
        {/* Message Header */}
        {!message.isLoading && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white/90">
                {message.role === 'user' ? 'You' : 'Libero'}
              </span>
              <span className="text-xs text-white/60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => onCopy(message.content)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/20 rounded-lg transition-all hover:scale-110"
            >
              <Copy size={12} className="text-white/50 hover:text-white/80" />
            </button>
          </div>
        )}
        
        {/* Message Content */}
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
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/95">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}