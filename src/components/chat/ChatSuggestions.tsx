import React from 'react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
  show: boolean;
}

export default function ChatSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  isLoading, 
  show 
}: ChatSuggestionsProps) {
  if (!show) return null;

  return (
    <div className="flex items-center justify-center px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide max-w-full">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLoading}
            className="flex-shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl text-white/70 hover:text-white/90 text-sm transition-all hover:scale-105 disabled:opacity-50 backdrop-blur-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}