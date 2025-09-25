import React from 'react';
import { X, Wifi } from 'lucide-react';
import { getEgoState } from '../../store';

interface SessionHeaderProps {
  sessionTitle: string;
  currentSegment: number;
  totalSegments: number;
  bufferedAhead: number;
  egoState: string;
  onClose: () => void;
}

export default function SessionHeader({ 
  sessionTitle, 
  currentSegment, 
  totalSegments, 
  bufferedAhead, 
  egoState,
  onClose 
}: SessionHeaderProps) {
  const currentEgoState = getEgoState(egoState as any);

  return (
    <div className="flex items-center justify-between p-4 bg-black/95 backdrop-blur-xl border-b border-white/10">
      {/* Left: Orb Icon + Session Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-400/30 border-2 border-teal-400/50 flex items-center justify-center">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-lg">{sessionTitle}</h1>
          <p className="text-white/60 text-sm">Segment {currentSegment} of {totalSegments}</p>
        </div>
      </div>
      
      {/* Right: Session Progress + Close */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-white font-semibold text-sm">{currentSegment}/{totalSegments}</div>
          <div className="text-white/60 text-xs">{bufferedAhead} buffered</div>
        </div>
        
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
        >
          <X size={18} className="text-white/80" />
        </button>
      </div>
    </div>
  );
}