import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, EGO_STATES } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
import ChatMessages from '../chat/ChatMessages';
import ChatSuggestions from '../chat/ChatSuggestions';
import ChatInput from '../chat/ChatInput';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../../utils/apiErrorHandler';
import { HYPNOSIS_PROTOCOLS, PROTOCOL_CATEGORIES } from '../../data/protocols';
import { useOrbBackground } from '../layout/OrbBackgroundLayer';
import {
  useChatSessionStore,
  selectChatMessages,
  selectCurrentChatSession,
  type ChatMessage,
} from '../../store/chatSessionStore';

interface ChatScreenProps {
  onQuickSessionReady?: (trigger: () => void) => void;
}

export default function ChatScreen({ onQuickSessionReady }: ChatScreenProps = {}) {
  const { isAuthenticated } = useAuth();
  const { activeEgoState, showToast, openModal } = useAppStore();
  const { user } = useGameState();
  const messages = useChatSessionStore(selectChatMessages);
  const currentSession = useChatSessionStore(selectCurrentChatSession);
  const appendMessage = useChatSessionStore(state => state.appendMessage);
  const clearLoadingMessages = useChatSessionStore(state => state.clearLoadingMessages);
  const resetChat = useChatSessionStore(state => state.resetChat);
  const startSession = useChatSessionStore(state => state.startSession);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { orbSize } = useOrbBackground();
  const topPadding = Math.max(Math.round(orbSize * 0.25), 160);
  const orbGlowSize = Math.min(Math.round(orbSize * 1.05), 520);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  const clearRecordingTimer = useCallback(() => {
    setRecordingTimer((existingTimer) => {
      if (existingTimer) {
        clearInterval(existingTimer);
      }
      return null;
    });
  }, []);

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const cleanupAfterStop = useCallback(() => {
    clearRecordingTimer();
    releaseMediaStream();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, [clearRecordingTimer, releaseMediaStream]);

  useEffect(() => {
    if (!isAuthenticated) {
      cleanupAfterStop();
      setRecordedBlob(null);
      setHasRecording(false);
    }

    return () => {
      cleanupAfterStop();
    };
  }, [cleanupAfterStop, isAuthenticated]);

  const getRecordingErrorMessage = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      return getUserFriendlyErrorMessage(error);
    }

    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'Microphone access was denied. Please allow microphone access and try again.';
      }

      if (error.name === 'NotFoundError') {
        return 'No microphone was found. Please connect a microphone and try again.';
      }

      if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        return 'We could not access your microphone. Please make sure no other app is using it and try again.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to start voice recording. Please try again.';
  }, []);

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
  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast({ type: 'error', message: 'Audio recording is not supported in this browser.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedBlob(event.data);
          setHasRecording(true);
        }
      };

      recorder.onstop = () => {
        cleanupAfterStop();
      };

      setIsRecording(true);
      setRecordingDuration(0);
      setHasRecording(false);
      setRecordedBlob(null);

      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      try {
        recorder.start();
      } catch (error) {
        cleanupAfterStop();
        showToast({ type: 'error', message: getRecordingErrorMessage(error) });
      }
    } catch (error) {
      cleanupAfterStop();
      showToast({ type: 'error', message: getRecordingErrorMessage(error) });
    }
  }, [cleanupAfterStop, getRecordingErrorMessage, isRecording, showToast]);

  const stopRecording = useCallback(() => {
    clearRecordingTimer();
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      cleanupAfterStop();
      return;
    }

    if (recorder.state === 'inactive') {
      cleanupAfterStop();
      return;
    }

    try {
      recorder.stop();
    } catch (error) {
      cleanupAfterStop();
      showToast({ type: 'error', message: getRecordingErrorMessage(error) });
    }
  }, [cleanupAfterStop, clearRecordingTimer, getRecordingErrorMessage, showToast]);

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

    if (isRecording) {
      stopRecording();
    } else {
      cleanupAfterStop();
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

    const sessionType = currentSession?.type ?? 'hypnosis';
    if (!currentSession || currentSession.status !== 'active') {
      startSession(sessionType, { status: 'active', resetMessages: false });
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      audioUrl
    };

    appendMessage(userMessage);
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
    appendMessage(typingMessage);

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
      clearLoadingMessages();

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

      appendMessage(aiMessage);

    } catch (error: any) {
      clearLoadingMessages();

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

      appendMessage(errorResponse);
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

  const startHypnosisSession = useCallback(() => {
    startSession('hypnosis', { status: 'active', resetMessages: false });
  }, [startSession]);

  useEffect(() => {
    if (onQuickSessionReady) {
      onQuickSessionReady(startHypnosisSession);
    }
  }, [onQuickSessionReady, startHypnosisSession]);

  const clearChat = () => {
    resetChat();
    startSession('hypnosis', { status: 'idle', startedAt: null, completedAt: null });
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
      <div className="relative h-full">
        <div
          className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur-3xl"
          aria-hidden
        >
          <div
            className="absolute left-1/2 top-[22vh] -translate-x-1/2 rounded-full bg-purple-500/25 blur-[160px]"
            style={{ width: orbGlowSize, height: orbGlowSize }}
          />
        </div>

        <PageShell
          className="relative z-10"
          body={
            <div className="h-full flex items-center justify-center p-4" style={{ paddingTop: `${topPadding}px` }}>
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
    <div className="relative h-full">
      <div
        className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur-3xl"
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-[22vh] -translate-x-1/2 rounded-full bg-teal-500/20 blur-[180px]"
          style={{ width: orbGlowSize, height: orbGlowSize }}
        />
      </div>

      <div
        className="relative z-10 flex h-full flex-col"
        style={{ paddingTop: `${topPadding}px` }}
      >
        {/* Welcome prompt - shown before the first message */}
        {!hasRealMessages && (
          <div className="flex-1 flex items-center justify-center py-8 px-4">
            <div className="text-center space-y-3 w-full max-w-md">
              <div className="mx-auto w-full rounded-3xl border border-white/10 bg-black/70 p-6 backdrop-blur-2xl shadow-2xl shadow-teal-500/10">
                <h2 className="text-white text-lg font-light mb-2">Chat with Libero</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tap the glowing orb to begin a new conversation or ask for guidance.
                </p>
              </div>
              <p className="text-white/60 text-xs">Try asking about your current ego state or daily focus.</p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {hasRealMessages && (
          <div
            className="flex-1 flex flex-col min-h-0 px-4"
            style={{ paddingTop: '40px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 140px + 1rem)' }}
          >
            <div className="relative flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-black/85 via-black/65 to-black/90 backdrop-blur-2xl shadow-[0_40px_120px_-60px_rgba(14,165,233,0.55)]">
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/5 via-transparent to-black/60" />
              <ChatMessages
                messages={messages}
                onCopyMessage={copyMessage}
                activeEgoState={activeEgoState}
                isSpeaking={isSpeaking}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Reply Suggestions */}
      <div className="fixed left-0 right-0 z-40" style={{ bottom: 'calc(var(--total-nav-height, 128px) + 80px)' }}>
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