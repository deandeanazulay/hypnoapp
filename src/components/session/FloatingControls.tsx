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
    <div className="space-y-4">
        {/* Main Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className={`w-20 h-16 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-95 flex items-center justify-center shadow-2xl ${
            isPlaying 
              ? 'bg-gradient-to-br from-orange-500/30 to-red-500/20 border-orange-400/60 text-orange-300 shadow-orange-400/25' 
              : 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border-green-400/60 text-green-300 shadow-green-400/25'
          }`}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>

        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="w-16 h-12 rounded-2xl bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-95 transition-all shadow-lg hover:border-white/50"
        >
          <SkipBack size={18} className="text-white/80" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="w-16 h-12 rounded-2xl bg-gradient-to-br from-black/80 to-gray-900/60 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-95 transition-all shadow-lg hover:border-white/50"
        >
          <SkipForward size={18} className="text-white/80" />
        </button>

        {/* Volume Toggle */}
        <button
          onClick={onToggleVoice}
          className={`w-16 h-12 rounded-2xl backdrop-blur-xl border transition-all hover:scale-95 flex items-center justify-center shadow-lg ${
            isVoiceEnabled 
              ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/60 text-green-400 shadow-green-400/25' 
              : 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-400/60 text-red-400 shadow-red-400/25'
          }`}
        >
          {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
  );
}
  )
}