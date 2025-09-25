import React, { useState } from 'react';
import { X, Volume2, VolumeX, Mic, Clock } from 'lucide-react';

export interface Mode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

interface ModePickerProps {
  onSelect: (mode: { mode: Mode; duration: string }) => void;
  onClose: () => void;
}

export default function ModePicker({ onSelect, onClose }: ModePickerProps) {
  const [selectedMode, setSelectedMode] = React.useState<Mode | null>(null);
  const [selectedDuration, setSelectedDuration] = React.useState('10');
  const [availableModes, setAvailableModes] = useState<Mode[]>([]);
  const [availableDurations, setAvailableDurations] = useState<any[]>([]);

  const handleSelect = () => {
    if (selectedMode) {
      onSelect({ mode: selectedMode, duration: selectedDuration });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">Voice, silent, or hands-free</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Mode Selection */}
        {availableModes.length > 0 ? (
          <div className="space-y-3 mb-6">
            <h3 className="text-white/80 text-sm font-medium mb-3">Mode</h3>
            {availableModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode)}
                className={`w-full p-4 rounded-xl bg-gradient-to-br ${mode.color} border transition-all duration-200 hover:scale-105 ${
                  selectedMode?.id === mode.id 
                    ? 'border-white/40 ring-2 ring-teal-400/30' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                    {mode.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-semibold text-base mb-1">{mode.name}</h4>
                    <p className="text-white/70 text-sm mb-2">{mode.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {mode.features.map((feature, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
              <Volume2 size={24} className="text-teal-400" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">No Modes Available</h3>
            <p className="text-white/70 text-sm">Session modes will be loaded dynamically</p>
          </div>
        )}

        {/* Duration Selection */}
        {availableDurations.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-white/80 text-sm font-medium mb-3">Duration</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableDurations.map((duration) => (
                <button
                  key={duration.id}
                  onClick={() => setSelectedDuration(duration.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    selectedDuration === duration.id
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                  }`}
                >
                  <div className="text-center">
                    <Clock size={16} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">{duration.name}</div>
                    <div className="text-xs opacity-70">{duration.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-white/80 text-sm font-medium mb-3">Duration</h3>
            <div className="text-center py-6">
              <p className="text-white/60 text-sm">Duration options will be loaded dynamically</p>
              <div className="mt-4">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-teal-400/50"
                />
                <span className="text-white/60 text-sm ml-2">minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedMode && availableModes.length > 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableModes.length > 0 ? 'Select Mode' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}