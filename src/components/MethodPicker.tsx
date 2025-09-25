import React, { useState, useEffect } from 'react';
import { X, Zap, Waves, Book, Eye, Wind, Clock } from 'lucide-react';
import { HYPNOSIS_PROTOCOLS, HypnosisProtocol } from '../data/protocols';

export interface Method {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  induction: string;
  deepening: string;
  installation: string;
  exit: string;
  duration: number;
  protocol?: HypnosisProtocol;
}

interface MethodPickerProps {
  selectedGoal: any;
  onSelect: (method: Method) => void;
  onClose: () => void;
}

export default function MethodPicker({ selectedGoal, onSelect, onClose }: MethodPickerProps) {
  const [availableMethods, setAvailableMethods] = useState<Method[]>([]);

  useEffect(() => {
    // Generate methods from protocols related to the selected goal
    const generateMethods = () => {
      let relevantProtocols: HypnosisProtocol[] = [];

      // Find protocols related to the goal
      if (selectedGoal?.relatedProtocols) {
        relevantProtocols = HYPNOSIS_PROTOCOLS.filter(p => 
          selectedGoal.relatedProtocols.includes(p.id)
        );
      } else {
        // If no specific protocols, show beginner-friendly options
        relevantProtocols = HYPNOSIS_PROTOCOLS.filter(p => 
          p.difficulty === 'beginner' || p.isRecommended
        );
      }

      // Convert protocols to methods
      const methods: Method[] = relevantProtocols.map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        description: protocol.description,
        icon: getMethodIcon(protocol),
        color: getMethodColor(protocol),
        induction: protocol.script.induction.substring(0, 100) + '...',
        deepening: protocol.script.deepening.substring(0, 100) + '...',
        installation: protocol.script.suggestions.substring(0, 100) + '...',
        exit: protocol.script.emergence.substring(0, 100) + '...',
        duration: protocol.duration,
        protocol
      }));

      setAvailableMethods(methods);
    };

    generateMethods();
  }, [selectedGoal]);

  const getMethodIcon = (protocol: HypnosisProtocol) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'progressive-relaxation-basic': <Waves size={20} className="text-blue-400" />,
      'rapid-stress-release': <Zap size={20} className="text-yellow-400" />,
      'bedtime-ritual': <Eye size={20} className="text-purple-400" />,
      'self-confidence-builder': <Book size={20} className="text-orange-400" />,
      'anxiety-relief': <Wind size={20} className="text-green-400" />
    };
    return iconMap[protocol.id] || <Book size={20} className="text-white" />;
  };

  const getMethodColor = (protocol: HypnosisProtocol) => {
    const colorMap: { [key: string]: string } = {
      'stress-relief': 'from-blue-500/20 to-cyan-500/20',
      'sleep': 'from-indigo-500/20 to-purple-500/20',
      'confidence': 'from-orange-500/20 to-amber-500/20',
      'habits': 'from-green-500/20 to-teal-500/20',
      'pain-management': 'from-red-500/20 to-pink-500/20',
      'phobias': 'from-purple-500/20 to-indigo-500/20',
      'performance': 'from-yellow-500/20 to-orange-500/20',
      'emotional-healing': 'from-emerald-500/20 to-green-500/20'
    };
    return colorMap[protocol.category] || 'from-white/10 to-gray-500/10';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">Choose Your Method</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {selectedGoal && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
            <p className="text-teal-400 text-sm">
              <span className="font-medium">Goal:</span> {selectedGoal.name}
            </p>
          </div>
        )}

        {availableMethods.length > 0 ? (
          <div className="space-y-3">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => onSelect(method)}
                className={`w-full p-4 rounded-xl bg-gradient-to-br ${method.color} border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                    {method.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-base">{method.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-white/60" />
                        <span className="text-white/60 text-sm">{method.duration}m</span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{method.description}</p>
                    
                    {method.protocol && (
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(method.protocol.difficulty)}`}>
                          {method.protocol.difficulty}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {method.protocol.benefits.slice(0, 2).map((benefit, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-black/30 text-white/60 rounded-full">
                              {benefit.split(' ').slice(0, 2).join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Book size={24} className="text-purple-400" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Loading Methods...</h3>
            <p className="text-white/70 text-sm">Finding the best approaches for your goal</p>
          </div>
        )}

        {selectedGoal && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm text-center">
              Methods are matched to your goal: <span className="text-white font-medium">{selectedGoal.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}