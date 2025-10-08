import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

vi.mock('../../../hooks/useSimpleAuth', () => ({
  useSimpleAuth: () => ({
    isAuthenticated: true
  })
}));

vi.mock('../../../store', () => ({
  useAppStore: () => ({
    activeEgoState: {
      id: 'test-ego',
      name: 'Test Ego',
      role: 'Guide',
      description: 'A mocked ego state'
    },
    showToast: vi.fn(),
    openModal: vi.fn()
  }),
  EGO_STATES: [
    {
      id: 'test-ego',
      name: 'Test Ego',
      role: 'Guide',
      description: 'A mocked ego state'
    }
  ]
}));

vi.mock('../../../data/protocols', () => ({
  HYPNOSIS_PROTOCOLS: [
    {
      name: 'Mock Protocol',
      category: 'Mock Category',
      difficulty: 'easy',
      duration: 10,
      description: 'Mock description',
      benefits: ['mock']
    }
  ],
  PROTOCOL_CATEGORIES: [
    {
      id: 'mock-category',
      name: 'Mock Category',
      icon: '🌀'
    }
  ]
}));

vi.mock('../../GameStateManager', () => ({
  useGameState: () => ({
    user: {
      level: 1,
      experience: 0,
      plan: 'free',
      tokens: 0,
      session_streak: 0,
      daily_sessions_used: 0
    }
  })
}));

vi.mock('../../layout/PageShell', () => ({
  default: ({ body }: { body: React.ReactNode }) => <div data-testid="page-shell">{body}</div>
}));

vi.mock('../../Orb', () => ({
  default: () => <div data-testid="orb" />
}));

vi.mock('../../chat/ChatMessages', () => ({
  default: () => <div data-testid="chat-messages" />
}));

vi.mock('../../chat/ChatSuggestions', () => ({
  default: () => <div data-testid="chat-suggestions" />
}));

vi.mock('../../chat/ChatInput', () => ({
  default: () => <div data-testid="chat-input" />
}));

import ChatScreen from '../ChatScreen';

describe('ChatScreen SSR compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure window is not defined before rendering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;
  });

  it('renders without accessing window', () => {
    expect(() => renderToString(<ChatScreen />)).not.toThrow();
  });
});
