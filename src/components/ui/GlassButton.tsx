// Reusable Glass Button Component
import React from 'react';
import { LIBERO_BRAND } from '../../config/theme';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export default function GlassButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button'
}: GlassButtonProps) {
  const baseClasses = "font-semibold transition-all duration-240 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black shadow-lg shadow-teal-400/25 rounded-lg',
    secondary: 'bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg',
    ghost: 'text-white hover:bg-white/10 rounded-lg',
    brand: `text-black rounded-[${LIBERO_BRAND.radius.button}]`
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const getBrandStyle = () => {
    if (variant === 'brand') {
      return {
        background: `linear-gradient(135deg, ${LIBERO_BRAND.colors.liberoTeal}, ${LIBERO_BRAND.colors.iris})`,
        boxShadow: LIBERO_BRAND.gradients.ctaGlow,
        fontSize: LIBERO_BRAND.typography.buttonM.fontSize,
        fontWeight: LIBERO_BRAND.typography.buttonM.fontWeight,
        letterSpacing: LIBERO_BRAND.typography.buttonM.letterSpacing
      };
    }
    return {};
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={getBrandStyle()}
    >
      {children}
    </button>
  );
}