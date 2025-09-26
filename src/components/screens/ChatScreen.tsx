import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, Sparkles, Brain, Mic, Copy, RotateCcw } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, EGO_STATES } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
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
        content: `✨ **Welcome to your personal transformation space**\n\nI'm Libero, your consciousness guide. I'm here to help you with:\n\n• **Hypnotherapy guidance** and session planning\n• **Ego state** exploration and understanding\n• **Protocol recommendations** based on your goals\n• **Transformation techniques** and best practices\n\nWhat would you like to explore together today?`,
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
      
      if (!data.response) {
        throw new ApiError(
          'No response from chat service',
          500,
          'NO_RESPONSE',
          'Chat API returned empty response',
          'Try again or rephrase your message'
        );
      }

      // Remove typing indicator and add actual response
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
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
      
      let errorMessage = 'Failed to connect to Libero';
      
      if (error instanceof ApiError) {
        errorMessage = getUserFriendlyErrorMessage(error);
      }
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'libero',
        content: `❌ **Connection Issue**\n\n${errorMessage}\n\n${error instanceof ApiError && error.suggestion ? `**Suggestion:** ${error.suggestion}` : '**Possible Solutions:**\n• Check your internet connection\n• Verify API configuration\n• Try again in a few moments'}`,
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorResponse]);
      
      showToast({
        type: 'error',
        message: errorMessage
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
    showToast({ type: 'success', message: 'Message copied to clipboard' });
  };

  const clearChat = () => {
    setMessages([]);
  };

  const currentEgoState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        {/* Background Effects */}
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
          <div className="relative z-10 h-full flex flex-col" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 mx-4 mb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 border-2 border-teal-500/40 flex items-center justify-center">
                    <span className="text-lg">{currentEgoState.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-light mb-1">Chat with Libero</h2>
                    <p className="text-white/70 text-sm">Your {currentEgoState.name} consciousness guide</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-white/60 text-xs">{messages.filter(m => !m.isLoading).length} messages</span>
                  {messages.length > 1 && (
                    <button
                      onClick={clearChat}
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/70 transition-all hover:scale-110"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 border relative group ${
                    message.role === 'user'
                      ? 'bg-teal-500/20 border-teal-500/30 text-teal-100'
                      : message.error
                      ? 'bg-red-500/20 border-red-500/30 text-red-100'
                      : message.isLoading
                      ? 'bg-white/10 border-white/20 text-white animate-pulse'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      {message.role === 'user' ? (
                        <User size={14} className="text-teal-400" />
                      ) : (
                        <div className="flex items-center space-x-1">
                          {message.isLoading ? (
                            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                          ) : (
                            <Brain size={14} className={message.error ? "text-red-400" : "text-purple-400"} />
                          )}
                        </div>
                      )}
                      <span className="text-xs font-medium opacity-80">
                        {message.role === 'user' ? 'You' : 'Libero'}
                      </span>
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        <span className="text-sm text-white/70 ml-2">Libero is thinking...</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                    
                    {/* Copy Button */}
                    {!message.isLoading && (
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-black/20 transition-all"
                      >
                        <Copy size={12} className="text-white/40 hover:text-white/70" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask Libero about hypnotherapy, ego states, or anything about your transformation journey..."
                        disabled={isLoading}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/15 transition-all resize-none h-20 disabled:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isLoading}
                      className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-xl hover:bg-teal-500/30 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  
                  {/* Quick Suggestions */}
                  {messages.length <= 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        'What ego state should I use today?',
                        'Recommend a protocol for stress relief',
                        'How does hypnotherapy work?',
                        'Help me create a custom protocol',
                        'What are my session statistics?'
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInputText(suggestion)}
                          disabled={isLoading}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Chat Tips */}
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-3 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-white font-medium text-sm">Chat with your {currentEgoState.name} guide</span>
                  </div>
                  <p className="text-white/70 text-xs">
                    Ask about protocols, explore ego states, get personalized hypnotherapy guidance, or discuss your transformation goals.
                  </p>
                </div>
              </form>
            </div>
          </div>
        }
      />
    </div>
  );
}