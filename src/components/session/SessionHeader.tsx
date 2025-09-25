import React from 'react';
import { X, Wifi } from 'lucide-react';

interface SessionHeaderProps {
  sessionTitle: string;
  currentSegment: number;
  totalSegments: number;
  bufferedAhead: number;
  onClose: () => void;
}

export default function SessionHeader({ 
  sessionTitle, 
  currentSegment, 
  totalSegments, 
  bufferedAhead, 
  onClose 
}: SessionHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl border-b border-white/20">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-white font-medium text-lg">{sessionTitle}</h1>
          <p className="text-white/60 text-sm">Segment {currentSegment} of {totalSegments}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-white font-medium text-sm">{currentSegment}/{totalSegments}</div>
          <div className="text-white/60 text-xs flex items-center space-x-1">
            <span>{bufferedAhead} buffered</span>
            <Wifi size={10} className="text-green-400" />
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
        >
          <X size={16} className="text-white/80" />
        </button>
      </div>
    </div>
  );
}