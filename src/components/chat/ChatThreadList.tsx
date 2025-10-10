import React from 'react';
import { MessageSquare } from 'lucide-react';
import {
  useChatSessionStore,
  selectChatThreads,
  selectCurrentThreadId,
} from '../../store/chatSessionStore';
import { useChatNavigator } from '../../hooks/useChatNavigator';

interface ThreadListItem {
  id: string;
  title: string | null;
  fallbackTitle: string;
  lastMessage: string;
  timestamp: Date | null;
}

function formatTimestamp(timestamp: Date | null) {
  if (!timestamp) {
    return 'Just now';
  }

  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });

    return formatter.format(timestamp);
  } catch (error) {
    console.warn('[ChatThreadList] Failed to format timestamp', error);
    return timestamp.toLocaleString();
  }
}

export default function ChatThreadList() {
  const navigate = useChatNavigator();
  const threadsRecord = useChatSessionStore(selectChatThreads);
  const currentThreadId = useChatSessionStore(selectCurrentThreadId);
  const switchThread = useChatSessionStore((state) => state.switchThread);

  const threads = React.useMemo<ThreadListItem[]>(() => {
    const record = threadsRecord ?? {};
    const threadsArray = Object.keys(record).map((threadId) => record[threadId]);

    if (threadsArray.length === 0) {
      return [];
    }

    return threadsArray
      .map((thread) => {
        const lastMessage = thread.messages[thread.messages.length - 1] ?? null;
        const snippet =
          lastMessage?.content?.trim?.() ||
          'No messages yet. Start a conversation to see it appear here.';

        return {
          id: thread.id,
          title: thread.session.title?.trim?.() || null,
          fallbackTitle: snippet,
          lastMessage: snippet,
          timestamp:
            lastMessage?.timestamp ||
            (thread.session.startedAt ? new Date(thread.session.startedAt) : null),
        };
      })
      .sort((a, b) => {
        const aTime = a.timestamp ? a.timestamp.getTime() : 0;
        const bTime = b.timestamp ? b.timestamp.getTime() : 0;

        return bTime - aTime;
      });
  }, [threadsRecord]);

  const handleSelectThread = React.useCallback(
    (threadId: string) => {
      switchThread(threadId);
      navigate(`/chat/threads/${threadId}`);
    },
    [navigate, switchThread]
  );

  return (
    <div className="flex h-full flex-col bg-black/95 text-white">
      <header className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-semibold">Conversations</h3>
        <p className="mt-1 text-sm text-white/60">
          Choose a thread to continue your work with Libero.
        </p>
      </header>

      {threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-white/70">
          <MessageSquare className="mb-3 h-10 w-10 text-white/40" aria-hidden />
          <p className="text-base font-medium">No conversations yet</p>
          <p className="mt-1 text-sm text-white/60">
            Threads will appear here once you start exploring multiple sessions.
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-white/10 overflow-y-auto">
          {threads.map((thread) => {
            const isActive = thread.id === currentThreadId;
            const displayTitle = thread.title ?? thread.fallbackTitle;
            const shouldShowLastMessage =
              Boolean(thread.lastMessage) && (thread.title !== null || thread.lastMessage !== displayTitle);
            const buttonClassName = [
              'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200',
              isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5',
            ].join(' ');

            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => handleSelectThread(thread.id)}
                  className={buttonClassName}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70">
                    <MessageSquare className="h-5 w-5" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-medium text-white truncate">
                        {displayTitle}
                      </h4>
                      <span className="flex-shrink-0 text-xs text-white/50">
                        {formatTimestamp(thread.timestamp)}
                      </span>
                    </div>

                    {shouldShowLastMessage ? (
                      <p className="mt-1 text-sm text-white/60 truncate">
                        {thread.lastMessage}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
