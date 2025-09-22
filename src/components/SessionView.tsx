import React from 'react';
import UnifiedSessionWorld from './UnifiedSessionWorld';

interface SessionViewProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function SessionView({ onComplete, onCancel }: SessionViewProps) {
  return (
    <UnifiedSessionWorld 
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}