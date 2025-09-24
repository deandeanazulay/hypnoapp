import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToasts } from '../../store';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const colorMap = {
  success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  error: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  warning: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
};

export default function ToastManager() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3">
      {toasts.map((toast, index) => {
        const Icon = iconMap[toast.type];
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            Icon={Icon}
            onRemove={() => removeToast(toast.id)}
            index={index}
          />
        );
      })}
    </div>
  );
}

interface ToastItemProps {
  toast: any;
  Icon: any;
  onRemove: () => void;
  index: number;
}

function ToastItem({ toast, Icon, onRemove, index }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [onRemove, toast.duration]);

  return (
    <div
      className={`glass-card w-80 p-4 bg-gradient-to-br ${colorMap[toast.type]} transform transition-all duration-300 animate-slide-in-right`}
      style={{
        animationDelay: `${index * 100}ms`,
        transform: `translateY(${index * -8}px)`
      }}
    >
      <div className="flex items-start space-x-3">
        <Icon size={20} className={`text-${toast.type === 'success' ? 'green' : toast.type === 'error' ? 'red' : toast.type === 'warning' ? 'yellow' : 'blue'}-400 flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${toast.type === 'success' ? 'green' : toast.type === 'error' ? 'red' : toast.type === 'warning' ? 'yellow' : 'blue'}-400 rounded-full`}
          style={{
            animation: `shrink ${toast.duration || 4000}ms linear`
          }}
        />
      </div>
    </div>
  );
}