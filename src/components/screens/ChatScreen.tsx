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

    const conversationHistory = [...messages, userMessage];

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
            conversationHistory: conversationHistory
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
            conversationLength: conversationHistory.length,
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
      <PageShell
        className="bg-[#343541] text-white"
        body={
          <div className="flex h-full items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-[#40414f]">
                <MessageCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Sign in to chat with Libero</h3>
                <p className="text-sm text-white/60">
                  Access personalized hypnosis guidance and keep track of your sessions.
                </p>
              </div>
              <button
                onClick={() => openModal('auth')}
                className="w-full rounded-full bg-[#10a37f] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#12b187]"
              >
                Sign in
              </button>
            </div>
          </div>
        }
      />
    );
  }

  const hasRealMessages = messages.some((msg) => !msg.isLoading);

  return (
    <PageShell
      className="bg-[#343541] text-white"
      body={
        <div className="flex h-full flex-col">
          <header className="border-b border-[#565869]/60 bg-[#343541]/90">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
              <div>
                <h1 className="text-lg font-medium">Libero</h1>
                <p className="text-xs text-white/60">Your hypnotic companion</p>
              </div>
              <div className="text-xs text-white/50">
                {currentSession?.type ? currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1) : 'Hypnosis'} session
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            {hasRealMessages ? (
              <ChatMessages
                messages={messages}
                onCopyMessage={copyMessage}
                activeEgoState={activeEgoState}
                isSpeaking={isSpeaking}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 pb-6">
                <div className="mx-auto w-full max-w-3xl space-y-8 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold">ChatGPT-style conversations</h2>
                    <p className="text-sm text-white/60">
                      Ask Libero anything about hypnosis, ego states, or your current focus and receive clear guidance.
                    </p>
                  </div>

                  <div className="grid gap-4 text-left sm:grid-cols-2">
                    {suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInputText(suggestion)}
                        className="rounded-2xl border border-[#565869] bg-[#40414f] p-4 text-left text-sm text-white/80 transition hover:border-white/50 hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#343541]/95 py-4">
            <ChatSuggestions
              suggestions={suggestions}
              onSuggestionClick={setInputText}
              isLoading={isLoading}
              show={messages.length <= 1}
            />
          </div>

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
      }
    />
  );
}
