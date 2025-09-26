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
}

export default function ChatMessages({ messages, onCopyMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto px-4" style={{ paddingBottom: '200px', paddingTop: '20px' }}>
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((message, index) => (
          <div key={message.id} style={{ animationDelay: `${index * 100}ms` }}>
            <ChatBubble message={message} onCopy={onCopyMessage} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}