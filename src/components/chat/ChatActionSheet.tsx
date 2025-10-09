import React, { useCallback } from 'react';
import { useAppStore } from '../../store';
import { useChatSessionStore } from '../../store/chatSessionStore';

interface ChatActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onStartHypnosisSession: () => void;
}

export default function ChatActionSheet({
  isOpen,
  onClose,
  onStartHypnosisSession,
}: ChatActionSheetProps) {
  const resetChat = useChatSessionStore((state) => state.resetChat);
  const showToast = useAppStore((state) => state.showToast);

  if (!isOpen) {
    return null;
  }

  const handleBreathwork = () => {
    console.log('[CHAT_ACTION_SHEET] TODO: launch breathwork experience');
    // TODO: Integrate breathwork experience trigger
    onClose();
  };

  const handleBuildProtocol = () => {
    console.log('[CHAT_ACTION_SHEET] TODO: open protocol builder flow');
    // TODO: Navigate to protocol builder
    onClose();
  };

  const handleCreateWorkout = () => {
    console.log('[CHAT_ACTION_SHEET] TODO: open workout creation flow');
    // TODO: Implement workout creation entry point
    onClose();
  };

  const handleNewChat = () => {
    console.log('[CHAT_ACTION_SHEET] TODO: start a new chat thread');
    // TODO: Implement new chat thread creation
    onClose();
  };

  const handleResetChat = useCallback(() => {
    resetChat();

    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToClear = ['libero-chat-messages', 'libero-chat-session'];

      keysToClear.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.warn(`[CHAT_ACTION_SHEET] Failed to remove persisted key "${key}"`, error);
        }
      });
    }

    showToast({ type: 'success', message: 'Chat reset successfully' });
    onClose();
  }, [resetChat, showToast, onClose]);

  return (
    <div className="fixed inset-0 z-[1150] flex flex-col justify-end bg-black/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="flex-1"
        aria-label="Close action sheet"
      />

      <div className="bg-black/95 border-t border-white/10 rounded-t-3xl px-4 py-6 space-y-3 shadow-2xl shadow-black/60">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />
        <h3 className="text-white text-lg font-semibold text-center">Actions</h3>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onStartHypnosisSession}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-left hover:bg-teal-500/30 transition-colors"
          >
            <span className="text-white font-medium">Start Hypnosis Session</span>
            <span className="text-teal-200 text-sm">Quick launch</span>
          </button>

          <button
            type="button"
            onClick={handleBreathwork}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
          >
            <span className="text-white/90 font-medium">Breathwork</span>
            <span className="text-white/50 text-sm">Coming soon</span>
          </button>

          <button
            type="button"
            onClick={handleBuildProtocol}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
          >
            <span className="text-white/90 font-medium">Build Protocol</span>
            <span className="text-white/50 text-sm">Coming soon</span>
          </button>

          <button
            type="button"
            onClick={handleCreateWorkout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
          >
            <span className="text-white/90 font-medium">Create Workout</span>
            <span className="text-white/50 text-sm">Coming soon</span>
          </button>

          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
          >
            <span className="text-white/90 font-medium">New Chat</span>
            <span className="text-white/50 text-sm">Coming soon</span>
          </button>

          <button
            type="button"
            onClick={handleResetChat}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
          >
            <span className="text-white/90 font-medium">Reset Chat</span>
            <span className="text-white/60 text-sm">Clear conversation history</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
