import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ChatScreen from '../screens/ChatScreen';
import ChatActionSheet from './ChatActionSheet';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import SessionSelectionModal from '../modals/SessionSelectionModal';

/**
 * Main chat route entry point. This component wraps the legacy ChatScreen
 * so the shell overlay can host additional routes without changing the
 * existing chat implementation.
 */
export default function ChatMain() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openModal, activeEgoState } = useAppStore();
  const { user } = useGameState();

  const handleStartHypnosis = () => {
    if (!isAuthenticated) {
      openModal('auth');
      return;
    }

    setIsSheetOpen(false);
    setShowSessionMenu(true);
  };

  const handleSessionSelect = (session: any) => {
    setShowSessionMenu(false);
    // TODO: Integrate chat-initiated session start flow
    console.log('[CHAT_ACTION_SHEET] TODO: start selected session from chat entry point', session);
  };

  return (
    <div className="relative h-full">
      <ChatScreen />

      <div className="fixed bottom-[88px] right-6 z-[1200]">
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="w-12 h-12 rounded-full bg-teal-500/80 hover:bg-teal-500 shadow-lg shadow-teal-500/40 text-black flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-300"
        >
          <Plus size={22} />
        </button>
      </div>

      <ChatActionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onStartHypnosisSession={handleStartHypnosis}
      />

      <SessionSelectionModal
        isOpen={showSessionMenu}
        onClose={() => setShowSessionMenu(false)}
        onSessionSelect={handleSessionSelect}
        user={user}
        activeEgoState={activeEgoState}
      />
    </div>
  );
}
