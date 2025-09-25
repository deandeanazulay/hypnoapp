import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface FloatingControlsProps {
  isPlaying: boolean;
  isVoiceEnabled: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onToggleVoice: () => void;
}

export default function FloatingControls({
  isPlaying,
  isVoiceEnabled,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onToggleVoice
}: FloatingControlsProps) {
  return (
    <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30">
      <div className="space-y-3">
        {/* Main Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className={`w-16 h-16 rounded-full backdrop-blur-xl border-2 transition-all hover:scale-110 flex items-center justify-center shadow-2xl ${
            isPlaying 
              ? 'bg-orange-500/20 border-orange-500/60 text-orange-400 shadow-orange-500/30' 
              : 'bg-green-500/20 border-green-500/60 text-green-400 shadow-green-500/30'
          }`}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>

        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all shadow-xl"
        >
          <SkipBack size={20} className="text-white/80" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all shadow-xl"
        >
          <SkipForward size={20} className="text-white/80" />
        </button>

        {/* Volume Toggle */}
        <button
          onClick={onToggleVoice}
          className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center shadow-xl ${
            isVoiceEnabled 
              ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/20' 
              : 'bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/20'
          }`}
        >
          {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </div>
  );
}