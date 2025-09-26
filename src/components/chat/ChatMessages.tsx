import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  onCopyMessage: (content: string) => void;
  activeEgoState: string;
  showOrbAsLiberoAvatar?: boolean;
}

export default function ChatMessages({ messages, onCopyMessage, activeEgoState, showOrbAsLiberoAvatar = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} style={{ animationDelay: `${index * 100}ms` }}>
            <ChatBubble 
              message={message} 
              onCopy={onCopyMessage}
              activeEgoState={activeEgoState}
              showOrbAsLiberoAvatar={showOrbAsLiberoAvatar}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}