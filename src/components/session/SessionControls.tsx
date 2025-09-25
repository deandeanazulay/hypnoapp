import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings } from 'lucide-react';

interface SessionControlsProps {
  isPlaying: boolean;
  isVoiceEnabled: boolean;
  audioLevel: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onToggleVoice: () => void;
  onVolumeChange: (level: number) => void;
  onSettings?: () => void;
}

export default function SessionControls({
  isPlaying,
  isVoiceEnabled,
  audioLevel,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onToggleVoice,
  onVolumeChange,
  onSettings
}: SessionControlsProps) {
  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className={`w-14 h-14 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
          isPlaying 
            ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
            : 'bg-green-500/20 border-green-500/40 text-green-400'
        }`}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
      </button>

      {/* Skip Back */}
      <button
        onClick={onSkipBack}
        className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
      >
        <SkipBack size={18} className="text-white/80" />
      </button>

      {/* Skip Forward */}
      <button
        onClick={onSkipForward}
        className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
      >
        <SkipForward size={18} className="text-white/80" />
      </button>

      {/* Volume Control */}
      <button
        onClick={onToggleVoice}
        className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
          isVoiceEnabled 
            ? 'bg-green-500/20 border-green-500/40 text-green-400' 
            : 'bg-red-500/20 border-red-500/40 text-red-400'
        }`}
      >
        {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Settings */}
      {onSettings && (
        <button
          onClick={onSettings}
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
        >
          <Settings size={18} className="text-white/80" />
        </button>
      )}
    </div>
  );
}