import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AIVoiceSystemProps {
  isActive?: boolean;
  sessionType?: string;
  onStateChange?: (state: any) => void;
  orbRef?: React.RefObject<any>;
}

const AIVoiceSystem: React.FC<AIVoiceSystemProps> = ({
  isActive = false,
  sessionType = 'meditation',
  onStateChange,
  orbRef
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isListening,
        isSpeaking,
        volume,
        transcript
      });
    }
  }, [isListening, isSpeaking, volume, transcript, onStateChange]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (orbRef?.current) {
      orbRef.current.setListening?.(!isListening);
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    if (orbRef?.current) {
      orbRef.current.setSpeaking?.(!isSpeaking);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">AI Voice Assistant</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          <button
            onClick={toggleSpeaking}
            className={`p-2 rounded-full transition-colors ${
              isSpeaking 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
      
      {transcript && (
        <div className="bg-gray-800 rounded p-2 mb-3">
          <p className="text-gray-300 text-sm">{transcript}</p>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <VolumeX size={14} className="text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <Volume2 size={14} className="text-gray-400" />
      </div>
      
      <div className="mt-2 text-xs text-gray-400 text-center">
        Session: {sessionType}
      </div>
    </div>
  );
};

export default AIVoiceSystem;