import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function ModalShell({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className = '' 
}: ModalShellProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div className={`relative bg-black/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-purple-500/20 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-white text-2xl font-light">{title}</h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-6 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}