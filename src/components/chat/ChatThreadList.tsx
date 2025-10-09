import React from 'react';
import { MessageSquare } from 'lucide-react';
import {
  useChatSessionStore,
  selectChatMessages,
  selectCurrentChatSession,
} from '../../store/chatSessionStore';
import { useChatNavigator } from '../../hooks/useChatNavigator';

interface ThreadListItem {
  id: string;
  title: string;
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
  const currentSession = useChatSessionStore(selectCurrentChatSession);
  const messages = useChatSessionStore(selectChatMessages);

  const threads = React.useMemo<ThreadListItem[]>(() => {
    if (!currentSession) {
      return [];
    }

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    return [
      {
        id: currentSession.id,
        title: currentSession.title,
        lastMessage:
          lastMessage?.content ||
          'No messages yet. Start a conversation to see it appear here.',
        timestamp:
          lastMessage?.timestamp ||
          (currentSession.startedAt ? new Date(currentSession.startedAt) : null),
      },
    ];
  }, [currentSession, messages]);

  const handleSelectThread = React.useCallback(
    (threadId: string) => {
      navigate(`/chat/threads/${threadId}`);
    },
    [navigate]
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
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => handleSelectThread(thread.id)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70">
                  <MessageSquare className="h-5 w-5" aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-base font-medium text-white truncate">
                      {thread.title}
                    </h4>
                    <span className="flex-shrink-0 text-xs text-white/50">
                      {formatTimestamp(thread.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-white/60 truncate">
                    {thread.lastMessage}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
