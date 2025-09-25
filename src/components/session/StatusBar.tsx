import React from 'react';

interface StatusBarProps {
  isPlaying: boolean;
  currentSegment: number;
  totalSegments: number;
}

export default function StatusBar({ isPlaying, currentSegment, totalSegments }: StatusBarProps) {
  return (
    <div className="flex justify-center px-6 py-3">
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20 shadow-2xl">
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