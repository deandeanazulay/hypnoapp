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
    <div className="mx-auto w-full max-w-3xl px-4">
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-1"
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
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => !isDragging && onSuggestionClick(suggestion)}
            disabled={isLoading}
            className={`flex-shrink-0 rounded-full border border-[#565869] bg-[#40414f] px-4 py-2 text-sm text-white/80 transition hover:text-white hover:bg-[#4b4d5a] disabled:opacity-50 disabled:cursor-not-allowed ${
              isDragging ? 'pointer-events-none' : ''
            }`}
            style={{ minWidth: 'max-content' }}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}