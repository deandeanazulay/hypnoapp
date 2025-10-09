import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export type ChatSessionType = 'hypnosis' | 'breathwork' | 'coaching' | 'journey';

export type ChatRole = 'user' | 'libero';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
  audioUrl?: string;
}

export interface ChatSessionMeta {
  id: string;
  type: ChatSessionType;
  title: string;
  status: 'idle' | 'active' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
}

export interface ChatXpState {
  total: number;
  pendingReward: number;
  streak: number;
  lastAwardedAt: string | null;
}

interface StartSessionOptions {
  id?: string;
  title?: string;
  status?: ChatSessionMeta['status'];
  startedAt?: string | null;
  completedAt?: string | null;
  resetMessages?: boolean;
}

interface ChatThread {
  id: string;
  session: ChatSessionMeta;
  messages: ChatMessage[];
}

interface ChatSessionStoreState {
  threads: Record<string, ChatThread>;
  currentThreadId: string;
  xp: ChatXpState;
}

interface ChatSessionStoreActions {
  startSession: (type: ChatSessionType, options?: StartSessionOptions) => void;
  createThread: (type: ChatSessionType, options?: StartSessionOptions) => void;
  switchThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  appendMessage: (message: ChatMessage) => void;
  setMessages: (updater: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[])) => void;
  clearLoadingMessages: () => void;
  resetChat: () => void;
  setXp: (xp: Partial<ChatXpState>) => void;
}

export type ChatSessionStore = ChatSessionStoreState & ChatSessionStoreActions;

type PersistedChatMessage = Omit<ChatMessage, 'timestamp'> & { timestamp: string };

type PersistedThread = {
  session: ChatSessionMeta;
  messages: PersistedChatMessage[];
};

type PersistedStateV1 = {
  currentSession: ChatSessionMeta;
  messages: PersistedChatMessage[];
  xp: ChatXpState;
};

type PersistedStateV2 = {
  threads: Record<string, PersistedThread>;
  currentThreadId: string;
  xp: ChatXpState;
};

const SESSION_TITLES: Record<ChatSessionType, string> = {
  hypnosis: 'Hypnosis Guidance Session',
  breathwork: 'Breathwork Coaching Session',
  coaching: 'Integration Coaching Session',
  journey: 'Journey Mapping Session',
};

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage<ChatSessionStore>(() => {
  if (typeof window === 'undefined') {
    return fallbackStorage;
  }
  return window.localStorage;
});

const createWelcomeMessage = (): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'libero',
  content:
    "Hello! I'm Libero, your consciousness guide. I can help you with hypnotherapy sessions, ego state exploration, and transformation techniques.\n\nWhat would you like to explore today?",
  timestamp: new Date(),
});

const createDefaultSessionMeta = (): ChatSessionMeta => ({
  id: 'sample-hypnosis-seed',
  type: 'hypnosis',
  title: SESSION_TITLES.hypnosis,
  status: 'idle',
  startedAt: null,
  completedAt: null,
});

const createInitialThread = (): ChatThread => ({
  id: 'sample-hypnosis-seed',
  session: createDefaultSessionMeta(),
  messages: [createWelcomeMessage()],
});

const createInitialState = (): ChatSessionStoreState => {
  const initialThread = createInitialThread();

  return {
    threads: {
      [initialThread.id]: initialThread,
    },
    currentThreadId: initialThread.id,
    xp: {
      total: 240,
      pendingReward: 25,
      streak: 3,
      lastAwardedAt: null,
    },
  };
};

export const useChatSessionStore = create<ChatSessionStore>()(
  persist(
    (set) => ({
      ...createInitialState(),

      startSession: (type, options = {}) => {
        const title = options.title || SESSION_TITLES[type] || 'Guided Session';
        const resetMessages = options.resetMessages ?? false;

        set((state) => {
          const fallbackThread = createInitialThread();
          const targetThreadId = options.id || state.currentThreadId || fallbackThread.id;
          const existingThread = state.threads[targetThreadId];

          const session: ChatSessionMeta = {
            id: targetThreadId,
            type,
            title,
            status: options.status || existingThread?.session.status || 'active',
            startedAt:
              options.startedAt !== undefined
                ? options.startedAt
                : existingThread?.session.startedAt || new Date().toISOString(),
            completedAt:
              options.completedAt !== undefined
                ? options.completedAt
                : existingThread?.session.completedAt || null,
          };

          const messages = resetMessages
            ? [createWelcomeMessage()]
            : existingThread?.messages || fallbackThread.messages;

          return {
            currentThreadId: targetThreadId,
            threads: {
              ...state.threads,
              [targetThreadId]: {
                id: targetThreadId,
                session,
                messages,
              },
            },
          };
        });
      },

      createThread: (type, options = {}) => {
        const title = options.title || SESSION_TITLES[type] || 'Guided Session';
        const threadId = options.id || `chat-${type}-${Date.now()}`;

        const session: ChatSessionMeta = {
          id: threadId,
          type,
          title,
          status: options.status || 'active',
          startedAt:
            options.startedAt !== undefined ? options.startedAt : new Date().toISOString(),
          completedAt: options.completedAt !== undefined ? options.completedAt : null,
        };

        set((state) => {
          if (state.threads[threadId]) {
            return { currentThreadId: threadId };
          }

          return {
            currentThreadId: threadId,
            threads: {
              ...state.threads,
              [threadId]: {
                id: threadId,
                session,
                messages: [createWelcomeMessage()],
              },
            },
          };
        });
      },

      switchThread: (threadId) => {
        set((state) => {
          if (!state.threads[threadId]) {
            return state;
          }

          return {
            currentThreadId: threadId,
          };
        });
      },

      deleteThread: (threadId) => {
        set((state) => {
          if (!state.threads[threadId]) {
            return state;
          }

          const { [threadId]: _removed, ...remaining } = state.threads;
          const remainingIds = Object.keys(remaining);

          if (remainingIds.length === 0) {
            const initialState = createInitialState();
            return initialState;
          }

          const nextThreadId =
            state.currentThreadId === threadId ? remainingIds[0] : state.currentThreadId;

          return {
            threads: remaining,
            currentThreadId: nextThreadId,
          };
        });
      },

      appendMessage: (message) => {
        set((state) => {
          const fallbackThread = createInitialThread();
          const currentThread = state.threads[state.currentThreadId] || fallbackThread;

          return {
            currentThreadId: currentThread.id,
            threads: {
              ...state.threads,
              [currentThread.id]: {
                ...currentThread,
                messages: [...currentThread.messages, message],
              },
            },
          };
        });
      },

      setMessages: (updater) => {
        set((state) => {
          const fallbackThread = createInitialThread();
          const currentThread = state.threads[state.currentThreadId] || fallbackThread;
          const nextMessages =
            typeof updater === 'function'
              ? (updater as (messages: ChatMessage[]) => ChatMessage[])(currentThread.messages)
              : updater;

          return {
            currentThreadId: currentThread.id,
            threads: {
              ...state.threads,
              [currentThread.id]: {
                ...currentThread,
                messages: nextMessages,
              },
            },
          };
        });
      },

      clearLoadingMessages: () => {
        set((state) => {
          const fallbackThread = createInitialThread();
          const currentThread = state.threads[state.currentThreadId] || fallbackThread;

          return {
            currentThreadId: currentThread.id,
            threads: {
              ...state.threads,
              [currentThread.id]: {
                ...currentThread,
                messages: currentThread.messages.filter((message) => !message.isLoading),
              },
            },
          };
        });
      },

      resetChat: () => {
        set(() => createInitialState());
      },

      setXp: (xp) => {
        set((state) => ({ xp: { ...state.xp, ...xp } }));
      },
    }),
    {
      name: 'libero-chat-session',
      storage,
      version: 2,
      partialize: (state) => ({
        threads: Object.fromEntries(
          Object.entries(state.threads).map(([threadId, thread]) => [
            threadId,
            {
              session: thread.session,
              messages: thread.messages.filter((message) => !message.isLoading),
            },
          ])
        ),
        currentThreadId: state.currentThreadId,
        xp: state.xp,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState) {
          return currentState;
        }

        const fallbackState = createInitialState();
        const typed = persistedState as Partial<PersistedStateV2 & PersistedStateV1>;

        if ('threads' in typed && typed.threads) {
          const hydratedThreads = Object.fromEntries(
            Object.entries(typed.threads).map(([threadId, thread]) => [
              threadId,
              {
                id: threadId,
                session: thread.session,
                messages: thread.messages
                  ? thread.messages.map((message) => ({
                      ...message,
                      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
                    }))
                  : [],
              },
            ])
          );

          const availableThreadIds = Object.keys(hydratedThreads);

          if (availableThreadIds.length === 0) {
            return {
              ...currentState,
              ...fallbackState,
              xp: typed.xp ?? currentState.xp,
            };
          }

          const persistedCurrentThreadId =
            typed.currentThreadId && hydratedThreads[typed.currentThreadId]
              ? typed.currentThreadId
              : availableThreadIds[0];

          return {
            ...currentState,
            threads: hydratedThreads,
            currentThreadId: persistedCurrentThreadId,
            xp: typed.xp ?? currentState.xp,
          };
        }

        if ('currentSession' in typed || 'messages' in typed) {
          const legacyState = typed as PersistedStateV1;
          const session = legacyState.currentSession ?? fallbackState.threads[fallbackState.currentThreadId].session;
          const threadId = session.id || fallbackState.currentThreadId;
          const messages = legacyState.messages
            ? legacyState.messages.map((message) => ({
                ...message,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
              }))
            : fallbackState.threads[fallbackState.currentThreadId].messages;

          return {
            ...currentState,
            threads: {
              [threadId]: {
                id: threadId,
                session,
                messages,
              },
            },
            currentThreadId: threadId,
            xp: legacyState.xp ?? currentState.xp,
          };
        }

        return currentState;
      },
    }
  )
);

export const selectChatThreads = (state: ChatSessionStore) => state.threads;
export const selectCurrentThreadId = (state: ChatSessionStore) => state.currentThreadId;
export const selectChatMessages = (state: ChatSessionStore) =>
  state.threads[state.currentThreadId]?.messages ?? [];
export const selectCurrentChatSession = (state: ChatSessionStore) =>
  state.threads[state.currentThreadId]?.session;
export const selectChatXp = (state: ChatSessionStore) => state.xp;
export const selectChatXpTotal = (state: ChatSessionStore) => state.xp.total;
export const selectPendingChatXp = (state: ChatSessionStore) => state.xp.pendingReward;
