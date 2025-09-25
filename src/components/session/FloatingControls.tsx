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
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
      <div className="space-y-3">
        {/* Main Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className={`w-20 h-16 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-105 flex items-center justify-center shadow-2xl ${
            isPlaying 
              ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/20 border-orange-400/80 text-orange-300 shadow-orange-500/40' 
              : 'bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/80 text-green-300 shadow-green-500/40'
          }`}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>

        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="w-16 h-12 rounded-xl bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all shadow-xl"
        >
          <SkipBack size={20} className="text-white/80" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="w-16 h-12 rounded-xl bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all shadow-xl"
        >
          <SkipForward size={20} className="text-white/80" />
        </button>

        {/* Volume Toggle */}
        <button
          onClick={onToggleVoice}
          className={`w-16 h-12 rounded-xl backdrop-blur-xl border transition-all hover:scale-105 flex items-center justify-center shadow-xl ${
            isVoiceEnabled 
              ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/60 text-green-300 shadow-green-500/30' 
              : 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-400/60 text-red-300 shadow-red-500/30'
          }`}
        >
          {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </div>
  );
}