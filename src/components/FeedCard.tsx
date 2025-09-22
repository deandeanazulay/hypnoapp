import React from 'react';
import { ChevronRight, Snowflake, Flame, AlertTriangle } from 'lucide-react';
import { useGameState } from './GameStateManager';

interface FeedCardProps {
  title: string;
  subtitle: string;
  icon: 'snowflake' | 'flame' | 'warning';
  color: string;
  requiredLevel?: number;
}

const iconMap = {
  snowflake: Snowflake,
  flame: Flame,
  warning: AlertTriangle
};

const colorMap = {
  teal: 'from-teal-400 to-cyan-400',
  orange: 'from-orange-400 to-amber-400',
  red: 'from-red-400 to-orange-400'
};

export default function FeedCard({ title, subtitle, icon, color, requiredLevel }: FeedCardProps) {
  const { user } = useGameState();
  const IconComponent = iconMap[icon];
  const gradientClass = colorMap[color as keyof typeof colorMap];
  const isLocked = requiredLevel && user.level < requiredLevel;
  
  return (
    <div className="mx-6 mb-4">
      <div className={`bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-all duration-300 ${
        isLocked ? 'opacity-50' : 'cursor-pointer hover:border-white/20 hover:scale-[1.02]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} p-2.5 flex items-center justify-center relative`}>
              {isLocked ? (
                <Lock size={18} className="text-black" />
              ) : (
                <IconComponent size={18} className="text-black" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{title}</h3>
              <p className="text-white/60 text-sm">{subtitle}</p>
            </div>
          </div>
          {!isLocked && <ChevronRight size={20} className="text-white/40" />}
        </div>
      </div>
    </div>
  );
}