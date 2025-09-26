import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';

interface ChatMessage {
  id: string;
  role: 'user' | 'libero';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
  audioUrl?: string;
}

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
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex flex-col space-y-2">
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