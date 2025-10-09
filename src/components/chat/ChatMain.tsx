import React, { useCallback, useEffect, useState } from 'react';
import { Plus, MessageSquareMore } from 'lucide-react';
import ChatScreen from '../screens/ChatScreen';
import { useOrbSize } from '../../hooks/useOrbSize';
import { useOrbBackground } from '../layout/OrbBackgroundLayer';
import { useChatSessionStore } from '../../store/chatSessionStore';
import ChatActionSheet from './ChatActionSheet';
import { useChatNavigator } from '../../hooks/useChatNavigator';

/**
 * Main chat route entry point. This component wraps the legacy ChatScreen
 * so the shell overlay can host additional routes without changing the
 * existing chat implementation.
 */
function ChatOrbGlowOverlay() {
  const { orbSize } = useOrbBackground();

  const haloSize = Math.min(orbSize * 1.25, 520);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div
          className="relative rounded-full bg-teal-500/20 blur-[180px]"
          style={{
            width: haloSize,
            height: haloSize,
            transform: 'translateY(-33%)',
          }}
        />
      </div>

      <div
        className="absolute left-1/2 top-[18vh] -translate-x-1/2 -translate-y-1/2"
        style={{ width: orbSize, height: orbSize }}
      >
        <div className="absolute inset-0 rounded-full bg-teal-400/15 blur-3xl" />
      </div>
    </div>
  );
}

export default function ChatMain() {
  const responsiveOrbSize = useOrbSize();
  const { setOrbSize } = useOrbBackground();
  const fallbackStartSession = useChatSessionStore((state) => state.startSession);
  const messages = useChatSessionStore((state) => state.messages);
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

  const handleOpenThreads = useCallback(() => {
    navigateChat('threads');
  }, [navigateChat]);

  const hasThreadHistory = messages.length > 0;

  return (
    <div className="relative h-full overflow-hidden">
      <ChatOrbGlowOverlay />

      <div className="relative z-10 flex h-full flex-col">
        <ChatScreen onQuickSessionReady={handleQuickSessionReady} />
      </div>

      {hasThreadHistory && (
        <button
          type="button"
          onClick={handleOpenThreads}
          className="fixed top-[calc(env(safe-area-inset-top,0)+20px)] right-6 z-[1100] flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm text-white/80 backdrop-blur hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <MessageSquareMore className="h-4 w-4" aria-hidden />
          Threads
        </button>
      )}

      <button
        type="button"
        onClick={handleToggleActionSheet}
        className="fixed bottom-[calc(var(--total-nav-height,64px)+88px)] right-6 z-[1100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 text-black shadow-xl shadow-teal-500/40 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        aria-label="Toggle actions"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <ChatActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleCloseActionSheet}
        onStartHypnosisSession={handleStartHypnosisSession}
        onShowThreadList={handleOpenThreads}
      />
    </div>
  );
}
