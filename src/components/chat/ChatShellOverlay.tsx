import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  NavigateOptions
} from 'react-router-dom';
import ChatMain from './ChatMain';
import ChatThreadPlaceholder from './ChatThreadPlaceholder';

interface ChatShellOverlayProps {
  onClose: () => void;
}

export function useChatNavigator() {
  const navigate = useNavigate();

  return React.useCallback(
    (to: string, options?: NavigateOptions) => {
      const trimmed = to?.trim?.() ?? '';

      if (trimmed === '' || trimmed === '.' || trimmed === '/') {
        navigate('/chat', options);
        return;
      }

      if (trimmed.startsWith('/chat')) {
        navigate(trimmed, options);
        return;
      }

      if (trimmed.startsWith('/')) {
        navigate(`/chat${trimmed}`, options);
        return;
      }

      navigate(`/chat/${trimmed}`, options);
    },
    [navigate]
  );
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
          <Route
            path="threads/:threadId"
            element={<ChatThreadPlaceholder />}
          />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}
