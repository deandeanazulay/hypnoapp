// Reusable Glass Card Component
import React from 'react';
import { LIBERO_BRAND } from '../../config/theme';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'muted' | 'brand';
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
  const baseClasses = "backdrop-blur-xl border transition-all duration-240";
  
  const variantClasses = {
    default: 'bg-white/5 border-white/20 rounded-xl',
    premium: 'bg-gradient-to-br from-teal-500/10 to-purple-500/10 border-teal-500/30 rounded-xl',
    muted: 'bg-white/3 border-white/10 rounded-xl',
    brand: `rounded-[${LIBERO_BRAND.radius.card}]`
  };

  const getBrandStyle = () => {
    if (variant === 'brand') {
      return {
        background: LIBERO_BRAND.colors.surface1,
        borderColor: `${LIBERO_BRAND.colors.divider}40`,
        boxShadow: hover ? LIBERO_BRAND.elevation.e2 : LIBERO_BRAND.elevation.e1
      };
    }
    return {};
  };

  const hoverClasses = hover ? 'hover:scale-105 cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      style={getBrandStyle()}
      onClick={onClick}
    >
      {children}
    </div>
  );
}