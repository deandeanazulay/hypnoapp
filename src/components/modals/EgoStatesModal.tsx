import React, { useState } from 'react';
import { Star, Lock, ChevronRight } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { EGO_STATES } from '../../types/EgoState';

interface EgoStatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EgoStatesModal({ isOpen, onClose }: EgoStatesModalProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Mock mastery data
  const masteryData = {
    guardian: { level: 5, sessions: 25, unlocked: true },
    rebel: { level: 3, sessions: 12, unlocked: true },
    healer: { level: 4, sessions: 18, unlocked: true },
    explorer: { level: 2, sessions: 8, unlocked: true },
    mystic: { level: 1, sessions: 3, unlocked: true },
    sage: { level: 0, sessions: 0, unlocked: false },
    child: { level: 3, sessions: 15, unlocked: true },
    performer: { level: 2, sessions: 9, unlocked: true },
    shadow: { level: 0, sessions: 0, unlocked: false },
    builder: { level: 1, sessions: 4, unlocked: true },
    seeker: { level: 0, sessions: 0, unlocked: false },
    lover: { level: 2, sessions: 7, unlocked: true },
    trickster: { level: 0, sessions: 0, unlocked: false },
    warrior: { level: 1, sessions: 5, unlocked: true },
    visionary: { level: 0, sessions: 0, unlocked: false }
  };

  const getMasteryRing = (level: number, unlocked: boolean) => {
    if (!unlocked) return 'ring-2 ring-gray-600/50';
    if (level >= 5) return 'ring-4 ring-yellow-400/80 shadow-lg shadow-yellow-400/50';
    if (level >= 3) return 'ring-3 ring-orange-400/70 shadow-lg shadow-orange-400/40';
    if (level >= 1) return 'ring-2 ring-teal-400/60 shadow-lg shadow-teal-400/30';
    return 'ring-1 ring-white/30';
  };

  const selectedStateData = selectedState ? EGO_STATES.find(s => s.id === selectedState) : null;
  const selectedMastery = selectedState ? masteryData[selectedState as keyof typeof masteryData] : null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Ego States Collection"
      className="md:max-w-6xl"
    >
      <div className="flex h-full space-x-6">
        {/* States Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-4 h-full">
            {EGO_STATES.map((state) => {
              const mastery = masteryData[state.id as keyof typeof masteryData];
              const isSelected = selectedState === state.id;
              
              return (
                <button
                  key={state.id}
                  onClick={() => setSelectedState(state.id)}
                  className={`bg-gradient-to-br ${state.color} rounded-xl p-4 border transition-all duration-300 hover:scale-105 flex flex-col items-center space-y-3 ${
                    isSelected ? 'border-white/40 shadow-xl' : 'border-white/20 hover:border-white/30'
                  } ${getMasteryRing(mastery.level, mastery.unlocked)}`}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center relative">
                    <span className="text-2xl">{state.icon}</span>
                    {!mastery.unlocked && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Lock size={16} className="text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-white font-medium text-sm text-center">{state.name}</h3>

                  {/* Mastery Level */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= mastery.level ? 'text-yellow-400 fill-current' : 'text-white/20'}
                      />
                    ))}
                  </div>

                  {/* Sessions Count */}
                  <div className="text-white/60 text-xs">
                    {mastery.sessions} sessions
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-1/3 border-l border-white/10 pl-6">
          {selectedStateData && selectedMastery ? (
            <div className="space-y-4">
              {/* Header */}
              <div className={`bg-gradient-to-br ${selectedStateData.color} rounded-xl p-4 border border-white/20`}>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">{selectedStateData.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{selectedStateData.name}</h3>
                    <p className="text-white/70 text-sm">{selectedStateData.role}</p>
                  </div>
                </div>
                
                {/* Mastery Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Mastery Level {selectedMastery.level}</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= selectedMastery.level ? 'text-yellow-400 fill-current' : 'text-white/20'}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedMastery.level / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-white/60 text-sm">{selectedMastery.sessions} sessions completed</p>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">Description</h4>
                <p className="text-white/70 text-sm mb-3">{selectedStateData.description}</p>
                
                <h4 className="text-white font-medium mb-2">Used For</h4>
                <div className="space-y-1">
                  {selectedStateData.usedFor.map((use, index) => (
                    <div key={index} className="text-white/60 text-sm flex items-center">
                      <span className="w-1 h-1 bg-teal-400 rounded-full mr-2" />
                      {use}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 font-medium hover:bg-teal-500/30 transition-all duration-300 flex items-center justify-between">
                  Set as Current
                  <ChevronRight size={16} />
                </button>
                
                {selectedMastery.unlocked && (
                  <button className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-400 font-medium hover:bg-purple-500/30 transition-all duration-300">
                    View Recommended Sessions
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Shield size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Select an ego state to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}