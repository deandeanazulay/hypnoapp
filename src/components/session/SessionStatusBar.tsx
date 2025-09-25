import React from 'react';

interface SessionStatusBarProps {
  isPlaying: boolean;
  currentSegment: number;
  totalSegments: number;
  phase: string;
}

export default function SessionStatusBar({ 
  isPlaying, 
  currentSegment, 
  totalSegments, 
  phase 
}: SessionStatusBarProps) {
  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="bg-black/80 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/20">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
          }`} />
          <span className="text-white/90 text-sm font-medium">
            {isPlaying ? 'Session active' : 'Session paused'} Segment {currentSegment}/{totalSegments}
          </span>
        </div>
      </div>
    </div>
  );
}