import React from 'react';

interface Story {
  id: string;
  label: string;
  color: string;
  glowColor: string;
}

const stories: Story[] = [
  { id: 'calm', label: 'Calm', color: 'from-teal-400 to-cyan-400', glowColor: 'shadow-teal-400/50' },
  { id: 'focus', label: 'Focus', color: 'from-teal-400 to-cyan-400', glowColor: 'shadow-teal-400/50' },
  { id: 'stress', label: 'Stress', color: 'from-orange-400 to-amber-400', glowColor: 'shadow-orange-400/50' },
  { id: 'joy', label: 'Joy', color: 'from-amber-400 to-yellow-400', glowColor: 'shadow-amber-400/50' },
  { id: 'curiosity', label: 'Curiosity', color: 'from-teal-400 to-cyan-400', glowColor: 'shadow-teal-400/50' }
];

export default function StoriesRow() {
  return (
    <div className="px-4 py-1">
      <div className="flex justify-center items-center space-x-4">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1">
            <div 
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${story.color} p-1 cursor-pointer transition-all duration-300 hover:scale-105 ${story.glowColor} shadow-lg border border-white/20`}
              style={{
                boxShadow: `0 0 15px ${story.glowColor.includes('teal') ? '#14b8a6' : '#f59e0b'}60, inset 0 0 10px rgba(255,255,255,0.1)`
              }}
            >
              <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${story.color} opacity-80`} />
              </div>
            </div>
            <span className="text-white text-xs sm:text-xs font-semibold tracking-wide">{story.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}