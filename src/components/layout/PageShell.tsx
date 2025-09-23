import React from 'react';

interface PageShellProps {
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const NAV_HEIGHT = 72; // Bottom nav height

export default function PageShell({ header, body, footer, className = '' }: PageShellProps) {
  return (
    <div 
      className={`flex flex-col ${className}`}
      style={{
        height: `calc(100vh - ${NAV_HEIGHT}px)`,
        overflowY: 'auto', // Allow vertical scrolling for the entire page content area
        maxHeight: `calc(100vh - ${NAV_HEIGHT}px)`,
      }}
    >
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      
      <div className="flex-1 min-h-0"> {/* Removed overflow-hidden here, let parent handle */}
        {body}
      </div>
      
      {footer && (
        <div className="flex-shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}