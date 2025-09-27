import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX, MessageCircle, Brain, Mic, MicOff, Loader, Copy } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import PageShell from '../layout/PageShell';
import ChatMessages from '../chat/ChatMessages';
import ChatInput from '../chat/ChatInput';
import ChatSuggestions from '../chat/ChatSuggestions';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';
import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../../utils/apiErrorHandler';

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
  const { user } = useGameState();
  const { activeEgoState, openModal, showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentEgoState = getEgoState(activeEgoState);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermission('denied');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
    } catch (error) {
      setMicPermission('denied');
    }
  };

  const startRecording = async () => {
    if (micPermission !== 'granted') {
      await checkMicrophonePermission();
      if (micPermission !== 'granted') {
        showToast({ type: 'error', message: 'Microphone access required for voice input' });
        return;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (recordingChunksRef.current.length > 0) {
          setHasRecording(true);
        }
      };

      setIsRecording(true);
      setRecordingDuration(0);
      mediaRecorder.start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      showToast({ type: 'error', message: 'Failed to start recording' });
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
    if (recordingChunksRef.current.length === 0) return;

    const blob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);
    
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
    
    audioRef.current = new Audio(audioUrl);
    audioRef.current.onended = () => setIsPlayingRecording(false);
    audioRef.current.play();
    setIsPlayingRecording(true);
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    
    recordingChunksRef.current = [];
    setHasRecording(false);
    setIsPlayingRecording(false);
    setRecordingDuration(0);
  };

  const sendRecording = async () => {
    if (recordingChunksRef.current.length === 0) return;

    const blob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);

    // Add user message with audio
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: '[Voice Message]',
      timestamp: new Date(),
      audioUrl
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Clean up recording
    deleteRecording();
    
    // Process voice message (placeholder - would integrate with speech-to-text)
    await sendMessage('I sent a voice message');
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
          'Supabase URL or API key missing',
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
            message: message,
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
                .filter(msg => !msg.isLoading)
                .map(msg => ({
                  role: msg.role === 'libero' ? 'assistant' : 'user',
                  content: msg.content
                }))
            },
            requestType: 'guidance'
          })
        },
        {
          operation: 'AI Chat',
          additionalContext: {
            messageLength: message.length,
            egoState: activeEgoState,
            userLevel: user?.level || 1
          }
        }
      );

      const data = await response.json();
      
      if (!data.response) {
        throw new ApiError(
          'No response from AI service',
          500,
          'NO_RESPONSE',
          'AI service returned empty response',
          'Try again or rephrase your message'
        );
      }

      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'libero',
          content: data.response,
          timestamp: new Date()
        };
        return [...filtered, aiMessage];
      });

      // Speak the response if voice is enabled
      speakMessage(data.response);

    } catch (error: any) {
      let errorMessage = 'Failed to connect to Libero';
      
      if (error instanceof ApiError) {
        errorMessage = getUserFriendlyErrorMessage(error);
        console.error('Chat API error:', errorMessage);
      } else {
        console.error('Chat unexpected error:', error);
      }
      
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'libero',
          content: `I'm having trouble connecting right now. ${errorMessage}`,
          timestamp: new Date(),
          error: true
        };
        return [...filtered, errorMsg];
      });
      
      showToast({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    // Find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Karen') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Female') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText.trim());
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast({ type: 'success', message: 'Message copied to clipboard' });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputText(suggestion);
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
          <div className="relative z-10 h-full flex flex-col">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br border-2 flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${getEgoColor(activeEgoState).accent}60, ${getEgoColor(activeEgoState).accent}40)`,
                    borderColor: getEgoColor(activeEgoState).accent + '80'
                  }}
                >
                  <span className="text-lg">{currentEgoState.icon}</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Chat with {currentEgoState.name}</h2>
                  <p className="text-white/70 text-sm">{currentEgoState.description}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0">
              {messages.length === 0 ? (
                /* Welcome State */
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                      <Brain size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-white text-xl font-light mb-2">Connect with {currentEgoState.name}</h3>
                    <p className="text-white/70 text-sm mb-6">Share what's on your mind and let Libero guide you through transformation</p>
                    
                    {/* Horizontal Milestone Roadmap */}
                    <HorizontalMilestoneRoadmap 
                      user={user}
                      onMilestoneSelect={(milestone) => {
                        console.log('Milestone selected:', milestone);
                      }}
                      onTabChange={(tabId) => {
                        console.log('Tab change:', tabId);
                      }}
                    />
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

            {/* Chat Suggestions */}
            {messages.length === 0 && (
              <ChatSuggestions 
                onSuggestionSelect={handleSuggestionSelect}
                egoState={activeEgoState}
              />
            )}

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
          </div>
        }
      />
    </div>
  );
}