import React, { useState, useRef, useEffect } from 'react';
import { Copy, MessageCircle, Brain, HelpCircle } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, getEgoState } from '../../store';
import { useGameState } from '../GameStateManager';
import { track } from '../../services/analytics';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../../utils/apiErrorHandler';
import PageShell from '../layout/PageShell';
import ChatMessages from '../chat/ChatMessages';
import ChatInput from '../chat/ChatInput';
import ChatSuggestions from '../chat/ChatSuggestions';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
  audioUrl?: string;
}

export default function ChatScreen() {
  const { isAuthenticated } = useAuth();
  const { activeEgoState, openModal, showToast } = useAppStore();
  const { user } = useGameState();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentEgoState = getEgoState(activeEgoState);

  // Auto-welcome message when chat opens
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-' + Date.now(),
          role: 'libero',
          content: `I'm Libero, channeling ${currentEgoState.name} energy. What's on your mind today? I'm here to listen and guide you through whatever you're experiencing.`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }, 1000);
    }
  }, [isAuthenticated, currentEgoState.name, messages.length]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'libero',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

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
      
      const response = await safeFetch(
        `${baseUrl}/functions/v1/ai-hypnosis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            message: content,
            sessionContext: {
              egoState: activeEgoState,
              phase: 'conversation',
              depth: 1,
              breathing: 'rest',
              userProfile: {
                level: user?.level || 1,
                experience: user?.experience || 0
              },
              conversationHistory: messages
                .filter(m => !m.isLoading)
                .map(msg => ({
                  role: msg.role === 'libero' ? 'assistant' : 'user',
                  content: msg.content
                }))
            },
            requestType: 'guidance'
          })
        },
        {
          operation: 'Chat with Libero',
          additionalContext: {
            egoState: activeEgoState,
            messageLength: content.length
          }
        }
      );

      const data = await response.json();
      
      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'libero',
          content: data.response || 'I hear you. Continue sharing what\'s on your mind.',
          timestamp: new Date()
        };
        return [...withoutLoading, aiMessage];
      });

      track('chat_message_sent', {
        egoState: activeEgoState,
        messageLength: content.length,
        conversationLength: messages.length
      });

    } catch (error: any) {
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'libero',
          content: error instanceof ApiError 
            ? getUserFriendlyErrorMessage(error)
            : 'I\'m having trouble connecting right now, but I\'m still here with you. Take a deep breath and know that you\'re not alone.',
          timestamp: new Date(),
          error: true
        };
        return [...withoutLoading, errorMessage];
      });

      showToast({
        type: 'error',
        message: 'Chat connection issue - continuing offline'
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

  const handleClearChat = () => {
    setMessages([]);
    showToast({ type: 'info', message: 'Chat cleared' });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast({ type: 'success', message: 'Message copied to clipboard' });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordingBlob(blob);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      showToast({ type: 'error', message: 'Could not access microphone' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (recordingBlob) {
      const audio = new Audio(URL.createObjectURL(recordingBlob));
      setIsPlayingRecording(true);
      audio.onended = () => setIsPlayingRecording(false);
      audio.play();
    }
  };

  const deleteRecording = () => {
    setRecordingBlob(null);
    setHasRecording(false);
    setRecordingDuration(0);
  };

  const sendRecording = () => {
    if (recordingBlob) {
      // For now, just send a placeholder text
      sendMessage('[Voice message recorded]');
      deleteRecording();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full flex flex-col" style={{ paddingTop: '60px' }}>
            {/* Chat Header */}
            <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-purple-500/40 flex items-center justify-center">
                  <Brain size={20} className="text-black" />
                </div>
                <div>
                  <h1 className="text-white text-lg font-medium">Chat with Libero</h1>
                  <p className="text-white/70 text-sm">Your {currentEgoState.name} guide is listening</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                      <MessageCircle size={24} className="text-teal-400" />
                    </div>
                    <h3 className="text-white text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-white/70 text-sm">Libero is here to listen and guide you</p>
                  </div>
                </div>
              ) : (
                <ChatMessages
                  messages={messages}
                  onCopyMessage={handleCopyMessage}
                  activeEgoState={activeEgoState}
                  isSpeaking={isSpeaking}
                />
              )}
            </div>

            {/* Chat Input */}
            <ChatInput
              inputText={inputText}
              onInputChange={setInputText}
              onSubmit={handleSubmit}
              onClearChat={handleClearChat}
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
              hasMessages={messages.length > 0}
            />

            {/* Chat Suggestions */}
            {messages.length <= 1 && (
              <ChatSuggestions
                onSuggestionSelect={handleSuggestionSelect}
                egoState={activeEgoState}
              />
            )}
          </div>
        }
      />
    </div>
  );
}