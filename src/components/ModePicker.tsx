import React, { useState } from 'react';
import { X, Volume2, VolumeX, Mic, Clock, MessageCircle, Play, Headphones } from 'lucide-react';

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
  
  // Define available session modes
  const availableModes: Mode[] = [
    {
      id: 'voice-interactive',
      name: 'Voice Interactive',
      description: 'Full conversation with Libero using voice and text',
      icon: <Mic size={20} className="text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/20',
      features: ['AI conversation', 'Voice input', 'Personalized guidance', 'Real-time adaptation']
    },
    {
      id: 'guided-audio',
      name: 'Guided Audio',
      description: 'Listen to Libero\'s guidance with minimal interaction',
      icon: <Headphones size={20} className="text-purple-400" />,
      color: 'from-purple-500/20 to-indigo-500/20',
      features: ['Audio guidance', 'Structured protocol', 'Background music', 'Focus mode']
    },
    {
      id: 'silent-meditation',
      name: 'Silent Focus',
      description: 'Text-based guidance for quiet environments',
      icon: <MessageCircle size={20} className="text-blue-400" />,
      color: 'from-blue-500/20 to-slate-500/20',
      features: ['Text instructions', 'Visual cues', 'Silent practice', 'Workplace friendly']
    }
  ];

  // Define available durations
  const availableDurations = [
    { id: '5', name: '5m', description: 'Quick' },
    { id: '10', name: '10m', description: 'Short' },
    { id: '15', name: '15m', description: 'Standard' },
    { id: '20', name: '20m', description: 'Deep' },
    { id: '30', name: '30m', description: 'Extended' }
  ];

  // Set default mode
  React.useEffect(() => {
    if (!selectedMode && availableModes.length > 0) {
      setSelectedMode(availableModes[0]); // Default to voice interactive
    }
  }, [selectedMode]);
  
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
        <div className="space-y-3 mb-6">
          <h3 className="text-white/80 text-sm font-medium mb-3">Session Mode</h3>
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

        {/* Duration Selection */}
        <div className="mb-6">
          <h3 className="text-white/80 text-sm font-medium mb-3">Duration</h3>
          <div className="grid grid-cols-5 gap-2">
            {availableDurations.map((duration) => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
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

        {/* Mode Description */}
        {selectedMode && (
          <div className={`mb-6 p-4 rounded-xl bg-gradient-to-br ${selectedMode.color} border border-white/20`}>
            <h4 className="text-white font-medium mb-2">Selected: {selectedMode.name}</h4>
            <p className="text-white/80 text-sm mb-3">{selectedMode.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedMode.features.map((feature, i) => (
                <span key={i} className="px-2 py-1 bg-black/20 text-white/70 text-xs rounded-full border border-white/10">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Session Preview */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-white font-medium mb-3">Session Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Mode</span>
              <span className="text-white">{selectedMode?.name || 'None selected'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Duration</span>
              <span className="text-white">{selectedDuration} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Interaction</span>
              <span className="text-white">
                {selectedMode?.id === 'voice-interactive' ? 'Voice + Text' :
                 selectedMode?.id === 'guided-audio' ? 'Audio Only' :
                 selectedMode?.id === 'silent-meditation' ? 'Text Only' : 'Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Tips for selected mode */}
        {selectedMode && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
            <h4 className="text-white font-medium mb-2">💡 Tips for {selectedMode.name}</h4>
            <ul className="space-y-1 text-white/80 text-sm">
              {selectedMode.id === 'voice-interactive' && (
                <>
                  <li>• Ensure microphone permissions are enabled</li>
                  <li>• Find a private space where you can speak freely</li>
                  <li>• Have headphones ready for best audio experience</li>
                </>
              )}
              {selectedMode.id === 'guided-audio' && (
                <>
                  <li>• Use headphones for immersive experience</li>
                  <li>• Close your eyes and focus on the guidance</li>
                  <li>• Allow yourself to drift with the audio</li>
                </>
              )}
              {selectedMode.id === 'silent-meditation' && (
                <>
                  <li>• Perfect for office or public spaces</li>
                  <li>• Follow visual breathing cues</li>
                  <li>• Read text instructions mindfully</li>
                </>
              )}
            </ul>
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
            disabled={!selectedMode}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Begin Session
          </button>
        </div>
      </div>
    </div>
  );
}