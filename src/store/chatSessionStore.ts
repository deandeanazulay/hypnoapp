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

interface ChatSessionStoreState {
  currentSession: ChatSessionMeta;
  messages: ChatMessage[];
  xp: ChatXpState;
}

interface ChatSessionStoreActions {
  startSession: (type: ChatSessionType, options?: StartSessionOptions) => void;
  appendMessage: (message: ChatMessage) => void;
  setMessages: (updater: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[])) => void;
  clearLoadingMessages: () => void;
  resetChat: () => void;
  setXp: (xp: Partial<ChatXpState>) => void;
}

export type ChatSessionStore = ChatSessionStoreState & ChatSessionStoreActions;

type PersistedChatMessage = Omit<ChatMessage, 'timestamp'> & { timestamp: string };

type PersistedState = {
  currentSession: ChatSessionMeta;
  messages: PersistedChatMessage[];
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

const createInitialState = (): ChatSessionStoreState => ({
  currentSession: {
    id: 'sample-hypnosis-seed',
    type: 'hypnosis',
    title: SESSION_TITLES.hypnosis,
    status: 'idle',
    startedAt: null,
    completedAt: null,
  },
  messages: [createWelcomeMessage()],
  xp: {
    total: 240,
    pendingReward: 25,
    streak: 3,
    lastAwardedAt: null,
  },
});

export const useChatSessionStore = create<ChatSessionStore>()(
  persist(
    (set) => ({
      ...createInitialState(),

      startSession: (type, options = {}) => {
        const title = options.title || SESSION_TITLES[type] || 'Guided Session';
        const resetMessages = options.resetMessages ?? false;

        set((state) => ({
          currentSession: {
            id: options.id || `chat-${type}-${Date.now()}`,
            type,
            title,
            status: options.status || 'active',
            startedAt:
              options.startedAt !== undefined ? options.startedAt : new Date().toISOString(),
            completedAt:
              options.completedAt !== undefined ? options.completedAt : null,
          },
          messages: resetMessages ? [createWelcomeMessage()] : state.messages,
        }));
      },

      appendMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }));
      },

      setMessages: (updater) => {
        set((state) => ({
          messages:
            typeof updater === 'function'
              ? (updater as (messages: ChatMessage[]) => ChatMessage[])(state.messages)
              : updater,
        }));
      },

      clearLoadingMessages: () => {
        set((state) => ({ messages: state.messages.filter((message) => !message.isLoading) }));
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
      version: 1,
      partialize: (state) => ({
        currentSession: state.currentSession,
        messages: state.messages.filter((message) => !message.isLoading),
        xp: state.xp,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState) {
          return currentState;
        }

        const typed = persistedState as PersistedState;

        return {
          ...currentState,
          ...typed,
          messages: typed.messages
            ? typed.messages.map((message) => ({
                ...message,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
              }))
            : currentState.messages,
        };
      },
    }
  )
);

export const selectChatMessages = (state: ChatSessionStore) => state.messages;
export const selectCurrentChatSession = (state: ChatSessionStore) => state.currentSession;
export const selectChatXp = (state: ChatSessionStore) => state.xp;
export const selectChatXpTotal = (state: ChatSessionStore) => state.xp.total;
export const selectPendingChatXp = (state: ChatSessionStore) => state.xp.pendingReward;
