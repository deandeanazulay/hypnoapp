import React from 'react';

export default function ChatThreadPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-white/80">
      <div>
        <h3 className="text-lg font-light">Thread view coming soon</h3>
        <p className="mt-2 text-sm text-white/60">
          Select a conversation thread to explore its messages here once the
          multi-threaded chat experience is ready.
        </p>
      </div>
    </div>
  );
}
