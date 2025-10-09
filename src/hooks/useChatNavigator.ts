import React from 'react';
import { useNavigate, NavigateOptions } from 'react-router-dom';

export type ChatNavigationTarget = string;

export function useChatNavigator() {
  const navigate = useNavigate();

  return React.useCallback(
    (to: ChatNavigationTarget, options?: NavigateOptions) => {
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
