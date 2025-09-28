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
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  if (!show) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-black/95 via-purple-950/95 to-black/95 backdrop-blur-xl border-t border-white/10 py-3">
      {/* Horizontal Scrolling Container with Mouse Drag */}
      <div className="relative w-full">
        {/* Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable Suggestions */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-8 select-none"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => !isDragging && onSuggestionClick(suggestion)}
              disabled={isLoading}
              className={`flex-shrink-0 px-4 py-2.5 bg-gradient-to-br from-white/10 to-white/15 hover:from-white/15 hover:to-white/20 border border-white/25 hover:border-white/40 rounded-full text-white/80 hover:text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 shadow-lg backdrop-blur-sm animate-slide-up ${
                isDragging ? 'pointer-events-none' : ''
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                minWidth: 'max-content'
              }}
            >
              {suggestion}
            </button>
          ))}
          
          {/* Spacer for smooth edge scrolling */}
          <div className="flex-shrink-0 w-8" />
        </div>
      </div>
    </div>
  );
}