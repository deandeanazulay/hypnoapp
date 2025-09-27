import React from 'react';

interface ChatSuggestionsProps {
  onSuggestionSelect: (suggestion: string) => void;
  egoState: string;
}

export default function ChatSuggestions({ onSuggestionSelect, egoState }: ChatSuggestionsProps) {
  const getSuggestions = () => {
    const baseSuggestions = [
      'I feel stressed',
      'Help me focus',
      'I want to relax',
      'I need confidence'
    ];

    const egoSpecificSuggestions: { [key: string]: string[] } = {
      guardian: ['I need protection', 'Help me feel safe', 'I want stability'],
      rebel: ['I want to break free', 'Help me overcome limits', 'I need courage'],
      healer: ['I need healing', 'Help me restore myself', 'I want peace'],
      explorer: ['I want to discover', 'Help me find direction', 'I need adventure'],
      mystic: ['I seek wisdom', 'Help me connect', 'I want understanding'],
      sage: ['I need guidance', 'Help me learn', 'I want clarity'],
      child: ['I want to play', 'Help me find joy', 'I need wonder'],
      performer: ['I want to express', 'Help me shine', 'I need creativity'],
      shadow: ['I want integration', 'Help me accept myself', 'I need wholeness']
    };

    const specific = egoSpecificSuggestions[egoState] || [];
    return [...baseSuggestions, ...specific.slice(0, 2)];
  };

  const suggestions = getSuggestions();

  return (
    <div 
      className="fixed left-0 right-0 z-40 px-4"
      style={{ bottom: 'calc(var(--total-nav-height, 64px) + 6px)' }}
    >
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-md mx-auto">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionSelect(suggestion)}
            className="flex-shrink-0 px-3 py-2 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}