import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ChatScreen from '../screens/ChatScreen';
import {
  useChatSessionStore,
  selectChatThreads,
} from '../../store/chatSessionStore';
import { useChatNavigator } from '../../hooks/useChatNavigator';

export default function ChatThreadView() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigateChat = useChatNavigator();
  const threads = useChatSessionStore(selectChatThreads);
  const currentThreadId = useChatSessionStore((state) => state.currentThreadId);
  const switchThread = useChatSessionStore((state) => state.switchThread);
  const thread = threadId ? threads?.[threadId] : undefined;

  React.useEffect(() => {
    if (!threadId || !thread) {
      return;
    }

    if (threadId !== currentThreadId) {
      switchThread(threadId);
    }
  }, [threadId, thread, currentThreadId, switchThread]);

  const handleBackToThreads = React.useCallback(() => {
    navigateChat('threads');
  }, [navigateChat]);

  if (!threadId) {
    return <Navigate to="/chat/threads" replace />;
  }

  if (!thread) {
    return (
      <div className="flex h-full flex-col bg-black/95 text-white">
        <div className="border-b border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={handleBackToThreads}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Threads
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-white/70">
          <h3 className="text-lg font-light">Thread unavailable</h3>
          <p className="mt-2 text-sm text-white/60">
            We couldn&apos;t find that conversation. Return to the thread list to pick another discussion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <ChatScreen />

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1200] flex items-start justify-between px-5 pt-5">
        <button
          type="button"
          onClick={handleBackToThreads}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm text-white/80 backdrop-blur transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Threads
        </button>

        <div className="pointer-events-none hidden rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/70 backdrop-blur sm:block">
          {thread.session.title}
        </div>
      </div>
    </div>
  );
}
