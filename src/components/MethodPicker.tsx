import React from 'react';
import { X, Zap, Waves, Book, Eye, Wind } from 'lucide-react';

interface Method {
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
}

const methods: Method[] = [
  {
    id: 'rapid',
    name: 'Rapid (Elman)',
    description: 'Quick induction, hand drop, direct suggestions',
    icon: <Zap size={20} className="text-yellow-400" />,
    color: 'from-yellow-500/20 to-orange-500/20',
    induction: 'Elman rapid induction',
    deepening: 'Fractionation',
    installation: 'Direct suggestions',
    exit: 'Count up 1-5',
    duration: 10
  },
  {
    id: 'progressive',
    name: 'Progressive Relaxation',
    description: 'Classic PR, gentle, perfect for beginners',
    icon: <Waves size={20} className="text-teal-400" />,
    color: 'from-teal-500/20 to-cyan-500/20',
    induction: 'Progressive muscle relaxation',
    deepening: 'Body scan descent',
    installation: 'Gentle suggestions',
    exit: 'Gradual awakening',
    duration: 15
  },
  {
    id: 'book-balloon',
    name: 'Book & Balloon',
    description: 'Kinesthetic, great for analytical minds',
    icon: <Book size={20} className="text-purple-400" />,
    color: 'from-purple-500/20 to-blue-500/20',
    induction: 'Book & balloon visualization',
    deepening: 'Staircase descent',
    installation: 'Metaphorical suggestions',
    exit: 'Elevator up',
    duration: 12
  },
  {
    id: 'eye-fixation',
    name: 'Eye Fixation',
    description: 'Visual focus, orb-based, hypnotic spirals',
    icon: <Eye size={20} className="text-cyan-400" />,
    color: 'from-cyan-500/20 to-teal-500/20',
    induction: 'Orb fixation with spirals',
    deepening: 'Visual descent patterns',
    installation: 'Synchronized suggestions',
    exit: 'Gentle eye opening',
    duration: 12
  },
  {
    id: 'breath-work',
    name: 'Fractionated Breaths',
    description: 'Box breathing to breath holds, advanced',
    icon: <Wind size={20} className="text-green-400" />,
    color: 'from-green-500/20 to-teal-500/20',
    induction: 'Box breathing progression',
    deepening: 'Breath hold sequences',
    installation: 'Breath-anchored suggestions',
    exit: 'Natural breathing return',
    duration: 15
  }
];

interface MethodPickerProps {
  selectedGoal: any;
  onSelect: (method: Method) => void;
  onClose: () => void;
}

export default function MethodPicker({ selectedGoal, onSelect, onClose }: MethodPickerProps) {
  // Get recommended method based on goal
  const getRecommendedMethod = () => {
    if (!selectedGoal) return null;
    
    const recommendations: { [key: string]: string } = {
      'stress': 'progressive',
      'focus': 'rapid',
      'confidence': 'book-balloon',
      'sleep': 'progressive',
      'cravings': 'eye-fixation',
      'pain': 'progressive',
      'creative': 'breath-work'
    };
    
    return recommendations[selectedGoal.id] || 'progressive';
  };

  const recommendedId = getRecommendedMethod();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">How we'll do it</h2>
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

        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => onSelect(method)}
              className={`w-full p-4 rounded-xl bg-gradient-to-br ${method.color} border transition-all duration-200 hover:scale-105 ${
                method.id === recommendedId 
                  ? 'border-white/40 ring-2 ring-teal-400/30' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  {method.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-white font-semibold text-base">{method.name}</h3>
                    {method.id === recommendedId && (
                      <span className="px-2 py-0.5 bg-teal-400/20 text-teal-400 text-xs rounded-full border border-teal-400/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mb-2">{method.description}</p>
                  <div className="text-white/50 text-xs">
                    <div className="mb-1">{method.induction} → {method.deepening}</div>
                    <div>{method.installation} • {method.duration} min</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm text-center">
            Methods adapt automatically based on your selected ego state and goal
          </p>
        </div>
      </div>
    </div>
  );
}