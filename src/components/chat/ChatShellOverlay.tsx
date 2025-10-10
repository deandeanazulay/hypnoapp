import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatMain from './ChatMain';
import ChatThreadView from './ChatThreadView';
import ChatThreadList from './ChatThreadList';

interface ChatShellOverlayProps {
  onClose: () => void;
}

export default function ChatShellOverlay({ onClose }: ChatShellOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-white text-lg font-light">Libero Chat</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route index element={<ChatMain />} />
          <Route path="threads" element={<ChatThreadList />} />
          <Route path="threads/:threadId" element={<ChatThreadView />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}
