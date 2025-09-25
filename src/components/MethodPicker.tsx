import React from 'react';
import { X, Zap, Waves, Book, Eye, Wind } from 'lucide-react';

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
}

interface MethodPickerProps {
  selectedGoal: any;
  onSelect: (method: Method) => void;
  onClose: () => void;
}

export default function MethodPicker({ selectedGoal, onSelect, onClose }: MethodPickerProps) {
  const [methods, setMethods] = useState<Method[]>([]);

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

        {methods.length > 0 ? (
          <div className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => onSelect(method)}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                    {method.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-semibold text-base mb-1">{method.name}</h3>
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
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Zap size={24} className="text-purple-400" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">No Methods Available</h3>
            <p className="text-white/70 text-sm">Methods will be loaded dynamically</p>
          </div>
        )}

        {selectedGoal && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm text-center">
              Methods will be recommended based on your goal: {selectedGoal.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}