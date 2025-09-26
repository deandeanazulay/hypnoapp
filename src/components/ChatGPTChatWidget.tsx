import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X, Zap, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../utils/apiErrorHandler';
import ModalShell from './layout/ModalShell';
import { useAppStore, EGO_STATES } from '../store';
import { useGameState } from './GameStateManager';
import { HYPNOSIS_PROTOCOLS, PROTOCOL_CATEGORIES } from '../data/protocols';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface ChatGPTChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatGPTChatWidget({ isOpen, onClose }: ChatGPTChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeEgoState, showToast } = useAppStore();
  const { user } = useGameState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        sendMessage('Test the API: Can you help me understand how Libero works?');
      }, 1000);
    }
  }, [isOpen]);

  const buildKnowledgeBase = () => {
    return {
      appName: 'Libero - The Hypnotist That Frees Minds',
      currentUser: {
        level: user?.level || 1,
        experience: user?.experience || 0,
        activeEgoState: activeEgoState,
        plan: user?.plan || 'free',
        tokens: user?.tokens || 0,
        streak: user?.session_streak || 0
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
      availableProtocols: HYPNOSIS_PROTOCOLS.slice(0, 5).map(protocol => ({
        name: protocol.name,
        category: protocol.category,
        difficulty: protocol.difficulty,
        duration: protocol.duration,
        description: protocol.description
      })),
      appFeatures: [
        'AI-generated hypnosis scripts using ChatGPT',
        'Voice synthesis with ElevenLabs', 
        'Multiple ego state guides',
        'Custom protocol creation',
        'Session tracking and analytics',
        'Gamification with XP and levels'
      ],
      technicalSetup: {
        framework: 'React + TypeScript + Vite',
        database: 'Supabase',
        ai: 'OpenAI ChatGPT',
        voice: 'ElevenLabs TTS',
        deployment: 'Supabase Edge Functions'
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
            conversationHistory: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          })
        },
        {
          operation: 'ChatGPT Chat',
          additionalContext: {
            messageLength: message.length,
            conversationLength: messages.length
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

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setApiStatus('working');

    } catch (error: any) {
      let errorMessage = 'Failed to connect to ChatGPT API';
      
      let userFriendlyErrorMessage = 'Failed to connect to ChatGPT API';
      if (error instanceof ApiError) {
        userFriendlyErrorMessage = getUserFriendlyErrorMessage(error);
        console.error('Chat API error:', userFriendlyErrorMessage);
      } else {
        console.error('Chat unexpected error:', error);
      }
      
      const chatMessageError: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **API Connection Failed**\n\n${userFriendlyErrorMessage}\n\n${error instanceof ApiError && error.suggestion ? `**Suggestion:** ${error.suggestion}` : '**Possible Solutions:**\n• Check OPENAI_API_KEY in Supabase Edge Functions\n• Verify internet connection\n• Try again in a few moments'}`,
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, chatMessageError]);
      setApiStatus('error');
      
      showToast({
        type: 'error',
        message: userFriendlyErrorMessage
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
    setApiStatus('unknown');
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="ChatGPT API Test Chat"
      className="max-w-2xl h-[80vh]"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              apiStatus === 'working' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
              apiStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
            }`}>
              {apiStatus === 'working' ? <CheckCircle size={12} /> :
               apiStatus === 'error' ? <AlertCircle size={12} /> :
               <Zap size={12} />}
              <span>
                {apiStatus === 'working' ? 'API Working' :
                 apiStatus === 'error' ? 'API Error' :
                 'API Unknown'}
              </span>
            </div>
            <span className="text-white/60 text-xs">{messages.length} messages</span>
          </div>
          
          <button
            onClick={clearChat}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105"
          >
            Clear Chat
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                <Bot size={24} className="text-teal-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Test ChatGPT API Connection</h3>
              <p className="text-white/70 text-sm">Ask questions about Libero or test the API functionality</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 border ${
                message.role === 'user'
                  ? 'bg-teal-500/20 border-teal-500/30 text-teal-100'
                  : message.error
                  ? 'bg-red-500/20 border-red-500/30 text-red-100'
                  : 'bg-white/10 border-white/20 text-white'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {message.role === 'user' ? (
                    <User size={14} className="text-teal-400" />
                  ) : (
                    <Bot size={14} className={message.error ? "text-red-400" : "text-white/60"} />
                  )}
                  <span className="text-xs font-medium opacity-80">
                    {message.role === 'user' ? 'You' : 'ChatGPT'}
                  </span>
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                
                <button
                  onClick={() => copyMessage(message.content)}
                  className="mt-2 p-1 hover:bg-black/20 rounded transition-colors"
                >
                  <Copy size={12} className="text-white/40 hover:text-white/70" />
                </button>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 max-w-[80%]">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot size={14} className="text-white/60" />
                  <span className="text-xs font-medium opacity-80">ChatGPT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-white/70 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex-shrink-0">
          <div className="flex items-center space-x-3 bg-white/5 border border-white/20 rounded-xl p-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about Libero, test the API, or request help..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all hover:scale-110 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
          
          {/* Quick Test Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Test API connection',
              'How do I set up OPENAI_API_KEY?',
              'Explain ego states',
              'Why are scripts not generating?',
              'Show available protocols'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputText(suggestion)}
                disabled={isLoading}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>
      </div>
    </ModalShell>
  );
}