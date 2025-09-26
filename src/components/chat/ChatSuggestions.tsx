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
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!show) return null;

  return (
    <div className="px-4 mb-4">
      <div className="max-w-3xl mx-auto">
        {/* Horizontal Scrolling Container with Fade */}
        <div className="relative">
          {/* Fade Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable Suggestions */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-6"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading}
                className={`flex-shrink-0 px-4 py-2.5 bg-gradient-to-br from-white/10 to-white/15 hover:from-white/15 hover:to-white/20 border border-white/25 hover:border-white/40 rounded-full text-white/80 hover:text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 select-none shadow-lg backdrop-blur-sm animate-slide-up`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  minWidth: 'max-content'
                }}
              >
                {suggestion}
              </button>
            ))}
            
            {/* Spacer for smooth edge scrolling */}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}