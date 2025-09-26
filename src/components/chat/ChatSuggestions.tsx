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
  const [isDragging, setIsDragging] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    scrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
      const walk = (x - startXRef.current) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  if (!show) return null;

  return (
    <div className="px-4 relative z-40">
      <div 
        ref={scrollContainerRef}
        className={`flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLoading}
            className="flex-shrink-0 px-4 py-2 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl text-white/70 hover:text-white/90 text-sm transition-all hover:scale-105 disabled:opacity-50 select-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}