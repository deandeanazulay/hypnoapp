import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import type { ChatMessage } from '../../store/chatSessionStore';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onCopyMessage: (content: string) => void;
  activeEgoState: string;
  isSpeaking?: boolean;
}

export default function ChatMessages({ 
  messages, 
  onCopyMessage, 
  activeEgoState, 
  isSpeaking = false 
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        {messages.map((message, index) => (
          <div key={message.id} style={{ animationDelay: `${index * 50}ms` }}>
            <ChatBubble
              message={message}
              onCopy={onCopyMessage}
              activeEgoState={activeEgoState}
              isSpeaking={isSpeaking && message.role === 'libero' && index === messages.length - 1}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}