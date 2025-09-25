import React from 'react';

interface SessionProgressProps {
  currentSegment: number;
  totalSegments: number;
  bufferedAhead: number;
}

export default function SessionProgress({ 
  currentSegment, 
  totalSegments, 
  bufferedAhead 
}: SessionProgressProps) {
  return (
    <div className="absolute bottom-20 left-4 right-4 z-30">
      <div className="text-center">
        <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 inline-block">
          <span className="text-white/70 text-sm">
            Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
          </span>
        </div>
      </div>
    </div>
  );
}