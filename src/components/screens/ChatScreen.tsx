import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, Copy, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, EGO_STATES } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
import Orb from '../Orb';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../../utils/apiErrorHandler';
import { HYPNOSIS_PROTOCOLS, PROTOCOL_CATEGORIES } from '../../data/protocols';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

export default function ChatScreen() {
  const { isAuthenticated } = useAuth();
  const { activeEgoState, showToast, openModal } = useAppStore();
  const { user } = useGameState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send welcome message when screen loads and user is authenticated
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'libero',
        content: `Hello! I'm Libero, your consciousness guide. I can help you with hypnotherapy sessions, ego state exploration, and transformation techniques.\n\nWhat would you like to explore today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isAuthenticated, messages.length]);

  const buildKnowledgeBase = () => {
    return {
      appName: 'Libero - The Hypnotist That Frees Minds',
      currentUser: {
        level: user?.level || 1,
        experience: user?.experience || 0,
        activeEgoState: activeEgoState,
        plan: user?.plan || 'free',
        tokens: user?.tokens || 0,
        streak: user?.session_streak || 0,
        dailySessionsUsed: user?.daily_sessions_used || 0
      },
      egoStates: EGO_STATES.map(state => ({
        id: state.id,
        name: state.name,
        role: state.role,
        description: state.description
      })),
      protocolCategories: PROTOCOL_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon
      })),
      availableProtocols: HYPNOSIS_PROTOCOLS.slice(0, 8).map(protocol => ({
        name: protocol.name,
        category: protocol.category,
        difficulty: protocol.difficulty,
        duration: protocol.duration,
        description: protocol.description,
        benefits: protocol.benefits.slice(0, 3)
      })),
      sessionContext: {
        currentTime: new Date().toISOString(),
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
      }
    };
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing-' + Date.now(),
      role: 'libero',
      content: '...',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new ApiError(
          'Chat service not configured',
          500,
          'MISSING_CONFIG',
          'Supabase URL or API key missing',
          'Check environment variables'
        );
      }

      const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      
      const response = await safeFetch(
        `${baseUrl}/functions/v1/chatgpt-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            message: message,
            knowledgeBase: buildKnowledgeBase(),
            conversationHistory: messages
              .filter(msg => !msg.isLoading && !msg.error)
              .map(msg => ({
                role: msg.role === 'libero' ? 'assistant' : 'user',
                content: msg.content
              }))
          })
        },
        {
          operation: 'Chat with Libero',
          additionalContext: {
            messageLength: message.length,
            conversationLength: messages.length,
            activeEgoState: activeEgoState
          }
        }
      );

      const data = await response.json();
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      if (!data.response) {
        throw new ApiError(
          'No response from chat service',
          500,
          'NO_RESPONSE',
          'Chat API returned empty response',
          'Try again or rephrase your message'
        );
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'libero',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      let userFriendlyMessage = 'Connection temporarily unavailable';
      
      if (error instanceof ApiError) {
        userFriendlyMessage = getUserFriendlyErrorMessage(error);
      }
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'libero',
        content: `I'm having trouble connecting right now. ${userFriendlyMessage}\n\nPlease try again in a moment.`,
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorResponse]);
      
      showToast({
        type: 'error',
        message: userFriendlyMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText.trim());
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const clearChat = () => {
    setMessages([]);
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'libero',
        content: `Hello! I'm Libero, your consciousness guide. I can help you with hypnotherapy sessions, ego state exploration, and transformation techniques.\n\nWhat would you like to explore today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  const currentEgoState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <MessageCircle size={32} className="text-purple-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to chat with Libero</h3>
                <button
                  onClick={() => openModal('auth')}
                  className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full flex flex-col">
            {/* Orb Header */}
            <div className="flex-shrink-0 flex justify-center py-6">
              <Orb
                onTap={() => {}}
                egoState={activeEgoState}
                size={200}
                variant="webgl"
              />
            </div>

            {/* Messages Area - Improved */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-teal-400 to-cyan-400 border-teal-300'
                        : message.error
                        ? 'bg-gradient-to-br from-red-400 to-orange-400 border-red-300'
                        : 'bg-gradient-to-br from-purple-400 to-indigo-400 border-purple-300'
                    }`}>
                      {message.role === 'user' ? (
                        <User size={16} className="text-black" />
                      ) : (
                        <Bot size={16} className="text-black" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`max-w-[70%] rounded-2xl p-4 backdrop-blur-xl border relative group shadow-xl ${
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
                            onClick={() => copyMessage(message.content)}
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
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Bottom Input Area - Improved */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/98 backdrop-blur-xl border-t border-white/20 px-4 py-4 z-40" 
                 style={{ paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
              {/* Quick Suggestions - Floating Above Input */}
              {messages.length <= 1 && (
                <div className="px-4 mb-3">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-4 shadow-xl">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'What ego state should I use today?',
                          'Recommend a stress relief protocol',
                          'How do I create a custom protocol?',
                          'Explain hypnotherapy basics'
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setInputText(suggestion)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl text-white/70 hover:text-white/90 text-sm transition-all hover:scale-105 disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bottom Input Dock */}
              <div className="px-4">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-gradient-to-br from-white/10 to-white/15 backdrop-blur-xl rounded-2xl border border-white/25 p-3 shadow-2xl">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask Libero about protocols, ego states, or transformation techniques..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none text-base disabled:opacity-50 py-3 px-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      
                      {/* Control Buttons */}
                      <div className="flex items-center space-x-2">
                        {/* Audio Control */}
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-2.5 rounded-xl transition-all hover:scale-110 border ${
                            isMuted 
                              ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        
                        {/* Clear Chat Button */}
                        {messages.length > 1 && (
                          <button
                            type="button"
                            onClick={clearChat}
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
          </div>
        }
      />
    </div>
  );
}