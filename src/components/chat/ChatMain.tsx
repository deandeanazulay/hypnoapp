import React from 'react';
import ChatScreen from '../screens/ChatScreen';

/**
 * Main chat route entry point. This component wraps the legacy ChatScreen
 * so the shell overlay can host additional routes without changing the
 * existing chat implementation.
 */
export default function ChatMain() {
  return <ChatScreen />;
}
