import React, { useCallback, useEffect, useState } from 'react';
import { Plus, MessageSquareMore } from 'lucide-react';
import ChatScreen from '../screens/ChatScreen';
import { useOrbSize } from '../../hooks/useOrbSize';
import { useChatSessionStore, selectChatMessages } from '../../store/chatSessionStore';
import ChatActionSheet from './ChatActionSheet';
import { useChatNavigator } from '../../hooks/useChatNavigator';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { track } from '../../services/analytics';

import { useOrbBackground } from '../layout/OrbBackgroundLayer';

export default function ChatMain() {
  const responsiveOrbSize = useOrbSize();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openModal, setActiveTab, showToast } = useAppStore();
  const { setOrbSize } = useOrbBackground();
  const fallbackStartSession = useChatSessionStore((state) => state.startSession);
  const messages = useChatSessionStore(selectChatMessages);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [startHypnosisSession, setStartHypnosisSession] = useState<(() => void) | null>(null);
  const navigateChat = useChatNavigator();

  const handleToggleActionSheet = useCallback(() => {
    setIsActionSheetOpen((previous) => !previous);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setIsActionSheetOpen(false);
  }, []);

  useEffect(() => {
    setOrbSize(responsiveOrbSize);
  }, [responsiveOrbSize, setOrbSize]);

  const handleQuickSessionReady = useCallback((trigger: () => void) => {
    setStartHypnosisSession(() => trigger);
  }, []);

  const handleStartHypnosisSession = useCallback(() => {
    if (startHypnosisSession) {
      startHypnosisSession();
    } else {
      fallbackStartSession('hypnosis', { status: 'active', resetMessages: false });
    }

    handleCloseActionSheet();
  }, [startHypnosisSession, fallbackStartSession, handleCloseActionSheet]);

  const handleStartBreathworkSession = useCallback(() => {
    if (!isAuthenticated) {
      openModal('auth');
      track('chat_action_blocked', {
        action: 'start_breathwork',
        reason: 'unauthenticated',
      });
      return false;
    }

    fallbackStartSession('breathwork', { status: 'active', resetMessages: false });
    track('session_start', {
      type: 'breathwork',
      source: 'chat_action_sheet',
    });
    showToast({ type: 'success', message: 'Breathwork session starting...' });
    return true;
  }, [fallbackStartSession, isAuthenticated, openModal, showToast]);

  const handleOpenProtocolBuilder = useCallback(() => {
    if (!isAuthenticated) {
      openModal('auth');
      track('chat_action_blocked', {
        action: 'open_protocol_builder',
        reason: 'unauthenticated',
      });
      return false;
    }

    setActiveTab('create');
    navigate('/', { replace: false });
    track('navigation', { tab: 'create', source: 'chat_action_sheet' });
    showToast({ type: 'success', message: 'Opening protocol builder...' });
    return true;
  }, [isAuthenticated, navigate, openModal, setActiveTab, showToast]);

  const handleOpenWorkoutCreator = useCallback(() => {
    if (!isAuthenticated) {
      openModal('auth');
      track('chat_action_blocked', {
        action: 'open_workout_creator',
        reason: 'unauthenticated',
      });
      return false;
    }

    setActiveTab('create');
    navigate('/', { replace: false });
    track('chat_action', {
      action: 'open_workout_creator',
      destination: 'create',
      source: 'chat_action_sheet',
    });
    showToast({ type: 'success', message: 'Opening workout creator...' });
    return true;
  }, [isAuthenticated, navigate, openModal, setActiveTab, showToast]);

  const handleOpenThreads = useCallback(() => {
    navigateChat('threads');
  }, [navigateChat]);

  const hasThreadHistory = messages.length > 0;

  return (
    <div className="relative h-full bg-[#343541] text-white">
      <div className="flex h-full flex-col">
        <ChatScreen onQuickSessionReady={handleQuickSessionReady} />
      </div>

      {hasThreadHistory && (
        <button
          type="button"
          onClick={handleOpenThreads}
          className="fixed top-6 right-6 z-[1100] flex items-center gap-2 rounded-full border border-[#565869] bg-[#40414f]/90 px-4 py-2 text-sm text-white/80 shadow-lg shadow-black/30 transition hover:border-white/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]"
        >
          <MessageSquareMore className="h-4 w-4" aria-hidden />
          Threads
        </button>
      )}

      <button
        type="button"
        onClick={handleToggleActionSheet}
        className="fixed bottom-[calc(var(--total-nav-height,64px)+28px)] right-6 z-[1100] flex h-14 w-14 items-center justify-center rounded-full bg-[#10a37f] text-black shadow-lg shadow-black/40 transition hover:bg-[#12b187] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]/70"
        aria-label="Toggle actions"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <ChatActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleCloseActionSheet}
        onStartHypnosisSession={handleStartHypnosisSession}
        onShowThreadList={handleOpenThreads}
        onStartBreathwork={handleStartBreathworkSession}
        onBuildProtocol={handleOpenProtocolBuilder}
        onCreateWorkout={handleOpenWorkoutCreator}
      />
    </div>
  );
}
