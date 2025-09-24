// Reusable Glass Card Component
import React from 'react';
import { THEME } from '../../config/theme';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'muted';
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  onClick 
}: GlassCardProps) {
  const baseClasses = "backdrop-blur-xl border rounded-xl";
  
  const variantClasses = {
    default: 'bg-white/5 border-white/20',
    premium: 'bg-gradient-to-br from-teal-500/10 to-purple-500/10 border-teal-500/30',
    muted: 'bg-white/3 border-white/10'
  };

  const hoverClasses = hover ? 'hover:scale-105 hover:bg-white/8 transition-all duration-300 cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}