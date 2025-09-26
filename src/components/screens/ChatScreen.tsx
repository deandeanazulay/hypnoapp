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
  audioUrl?: string;
}

// Local storage for chat persistence
const CHAT_STORAGE_KEY = 'libero-chat-messages';

const saveMessagesToStorage = (messages: ChatMessage[]) => {
  try {
    const messagesToSave = messages.filter(msg => !msg.isLoading);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error('Failed to save chat messages:', error);
  }
};

const loadMessagesFromStorage = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Failed to load chat messages:', error);
  }
  return [];
};

export default function ChatScreen() {
  const { isAuthenticated } = useAuth();
  const { activeEgoState, showToast, openModal } = useAppStore();
  const { user } = useGameState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  // Load messages from storage
  useEffect(() => {
    if (isAuthenticated) {
      const savedMessages = loadMessagesFromStorage();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
    }
  }, [isAuthenticated]);

  // Save messages to storage
  useEffect(() => {
    if (isAuthenticated && messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages, isAuthenticated]);

  // Initialize media recorder
  useEffect(() => {
    const initializeRecorder = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('Media recording not supported');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedBlob(event.data);
            setHasRecording(true);
          }
        };
        
        recorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          if (recordingTimer) {
            clearInterval(recordingTimer);
            setRecordingTimer(null);
          }
        };
        
        setMediaRecorder(recorder);
      } catch (error) {
        console.warn('Media recorder initialization failed:', error);
        setMediaRecorder(null);
      }
    };

    if (isAuthenticated) {
      initializeRecorder();
    }

    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [isAuthenticated]);

  // Send welcome message
  useEffect(() => {
    if (isAuthenticated && messages.length === 0 && loadMessagesFromStorage().length === 0) {
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-' + Date.now(),
          role: 'libero',
          content: `Hello! I'm Libero, your consciousness guide. I can help you with hypnotherapy sessions, ego state exploration, and transformation techniques.\n\nWhat would you like to explore today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }, 1000);
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

  // Voice recording functions
  const startRecording = () => {
    if (!mediaRecorder || isRecording) return;
    
    setIsRecording(true);
    setRecordingDuration(0);
    setHasRecording(false);
    setRecordedBlob(null);
    
    const timer = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    setRecordingTimer(timer);
    
    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    
    mediaRecorder.stop();
    setIsRecording(false);
    
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  const playRecording = () => {
    if (!recordedBlob) return;
    
    const audio = new Audio(URL.createObjectURL(recordedBlob));
    setIsPlayingRecording(true);
    
    audio.onended = () => {
      setIsPlayingRecording(false);
      URL.revokeObjectURL(audio.src);
    };
    
    audio.onerror = () => {
      setIsPlayingRecording(false);
    };
    
    audio.play();
  };

  const deleteRecording = () => {
    setHasRecording(false);
    setRecordedBlob(null);
    setRecordingDuration(0);
    
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const sendRecording = async () => {
    if (!recordedBlob) return;
    
    try {
      // TODO: Implement OpenAI Whisper transcription
      const transcribedText = `[Voice Message - ${formatTime(recordingDuration)}]`;
      const audioUrl = URL.createObjectURL(recordedBlob);
      
      deleteRecording();
      await sendMessage(transcribedText, audioUrl);
      
      showToast({
        type: 'info',
        message: 'Voice transcription coming soon - audio saved'
      });
    } catch (error) {
      console.error('Failed to send voice message:', error);
      showToast({
        type: 'error',
        message: 'Failed to send voice message'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = async (message: string, audioUrl?: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      audioUrl
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Show typing indicator
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
          'Supabase configuration missing',
          'Check environment variables'
        );
      }

      const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      
      // Set speaking state for orb animation
      setIsSpeaking(true);
      
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
      showToast({ type: 'error', message: userFriendlyMessage });
    } finally {
      setIsLoading(false);
      setIsSpeaking(false);
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
    localStorage.removeItem(CHAT_STORAGE_KEY);
    
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'libero',
        content: `Hello! I'm Libero, your consciousness guide. I can help you with hypnotherapy sessions, ego state exploration, and transformation techniques.\n\nWhat would you like to explore today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }, 500);
  };

  const suggestions = [
    'What ego state should I use today?',
    'Recommend a stress relief protocol',
    'How do I create a custom protocol?',
    'Explain hypnotherapy basics',
    'Help me with confidence building',
    'Show me sleep improvement techniques'
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

  const hasRealMessages = messages.some(msg => !msg.isLoading);

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Welcome Orb - Show when no conversation */}
        {!hasRealMessages && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Orb
                onTap={() => {}}
                egoState={activeEgoState}
                size={window.innerWidth < 768 ? 280 : 420}
                variant="webgl"
                afterglow={false}
              />
              <div className="mt-6">
                <h2 className="text-white text-xl font-light mb-2">Chat with Libero</h2>
                <p className="text-white/70 text-sm">Your consciousness guide is ready to help</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {hasRealMessages && (
          <div className="flex-1 flex flex-col min-h-0" style={{ paddingTop: '60px', paddingBottom: '200px' }}>
            <ChatMessages
              messages={messages}
              onCopyMessage={copyMessage}
              activeEgoState={activeEgoState}
              isSpeaking={isSpeaking}
            />
          </div>
        )}
      </div>

      {/* Quick Reply Suggestions */}
      <div className="fixed left-0 right-0 z-40" style={{ bottom: 'calc(var(--total-nav-height, 128px) + 140px)' }}>
        <ChatSuggestions
          suggestions={suggestions}
          onSuggestionClick={setInputText}
          isLoading={isLoading}
          show={messages.length <= 1}
        />
      </div>

      {/* Chat Input */}
      <ChatInput
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSubmit}
        onClearChat={clearChat}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPlayRecording={playRecording}
        onDeleteRecording={deleteRecording}
        onSendRecording={sendRecording}
        isLoading={isLoading}
        isRecording={isRecording}
        hasRecording={hasRecording}
        isPlayingRecording={isPlayingRecording}
        recordingDuration={recordingDuration}
        hasMessages={messages.length > 1}
      />
    </div>
  );
}