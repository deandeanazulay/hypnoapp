import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, EGO_STATES } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
import Orb from '../Orb';
import ChatMessages from '../chat/ChatMessages';
import ChatSuggestions from '../chat/ChatSuggestions';
import ChatInput from '../chat/ChatInput';
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

  const suggestions = [
    'What ego state should I use today?',
    'Recommend a stress relief protocol',
    'How do I create a custom protocol?',
    'Explain hypnotherapy basics'
  ];

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
          <div className="relative z-10 h-full overflow-hidden">
            {/* Orb - Top aligned, responsive */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
              <Orb
                onTap={() => {}}
                egoState={activeEgoState}
                size={window.innerWidth < 768 ? 200 : 350}
                variant="webgl"
              />
            </div>

            {/* Messages Area - Properly spaced below orb */}
            <div 
              className="h-full relative z-30 flex flex-col"
              style={{ 
                paddingTop: window.innerWidth < 768 ? '220px' : '370px',
                paddingBottom: '200px' // Space for suggestions + input
              }}
            >
              <ChatMessages 
                messages={messages}
                onCopyMessage={copyMessage}
              />
            </div>
          </div>
        }
      />

      {/* Suggestions - Above Input Area */}
      <div className="fixed bottom-32 left-0 right-0 z-40">
        <ChatSuggestions
          suggestions={suggestions}
          onSuggestionClick={setInputText}
          isLoading={isLoading}
          show={messages.length <= 1}
        />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <ChatInput
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSubmit}
        onClearChat={clearChat}
        onToggleMute={() => setIsMuted(!isMuted)}
        isLoading={isLoading}
        isMuted={isMuted}
        hasMessages={messages.length > 1}
      />
    </div>
  );
}