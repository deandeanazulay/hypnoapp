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
          className={`w-16 h-16 rounded-xl backdrop-blur-xl border-2 transition-all hover:scale-105 flex items-center justify-center shadow-2xl ${
            isPlaying 
              ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border-orange-400/60 text-orange-300' 
              : 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-400/60 text-green-300'
          }`}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="w-12 h-12 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all"
        >
          <SkipBack size={16} className="text-white/80" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="w-12 h-12 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all"
        >
          <SkipForward size={16} className="text-white/80" />
        </button>

        {/* Volume Toggle */}
        <button
          onClick={onToggleVoice}
          className={`w-12 h-12 rounded-xl backdrop-blur-xl border transition-all hover:scale-105 flex items-center justify-center ${
            isVoiceEnabled 
              ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-400/40 text-green-400' 
              : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-400/40 text-red-400'
          }`}
        >
          {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </div>
  );
}