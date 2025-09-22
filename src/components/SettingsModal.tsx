import React from 'react';
import { X, Volume2, Bell, Smartphone, Moon, Zap } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/60"
      onClick={handleBackdropClick}
    >
      <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">Settings</h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Volume2 size={16} className="mr-2" />
              Audio
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Voice Guidance</span>
                <div className="w-10 h-6 bg-teal-500/20 rounded-full border border-teal-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-teal-400 rounded-full ml-auto" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Background Sounds</span>
                <div className="w-10 h-6 bg-white/10 rounded-full border border-white/20 flex items-center px-1">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Voice Volume</span>
                <div className="flex-1 mx-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="80"
                    className="w-full h-1 bg-white/20 rounded-full appearance-none slider"
                  />
                </div>
                <span className="text-white/60 text-xs">80%</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Bell size={16} className="mr-2" />
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Session Reminders</span>
                <div className="w-10 h-6 bg-orange-500/20 rounded-full border border-orange-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-orange-400 rounded-full ml-auto" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Achievement Alerts</span>
                <div className="w-10 h-6 bg-yellow-500/20 rounded-full border border-yellow-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Zap size={16} className="mr-2" />
              Experience
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Afterglow Effects</span>
                <div className="w-10 h-6 bg-purple-500/20 rounded-full border border-purple-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-purple-400 rounded-full ml-auto" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Haptic Feedback</span>
                <div className="w-10 h-6 bg-white/10 rounded-full border border-white/20 flex items-center px-1">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Auto-Save Sessions</span>
                <div className="w-10 h-6 bg-teal-500/20 rounded-full border border-teal-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-teal-400 rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Smartphone size={16} className="mr-2" />
              Privacy
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Analytics</span>
                <div className="w-10 h-6 bg-white/10 rounded-full border border-white/20 flex items-center px-1">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Session Recording</span>
                <div className="w-10 h-6 bg-red-500/20 rounded-full border border-red-500/40 flex items-center px-1">
                  <div className="w-4 h-4 bg-red-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300">
              Reset All
            </button>
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}