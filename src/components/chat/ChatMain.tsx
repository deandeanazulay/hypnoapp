import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ChatScreen from '../screens/ChatScreen';
import Orb from '../Orb';
import { useAppStore } from '../../store';
import { useOrbSize } from '../../hooks/useOrbSize';
import { OrbBackgroundContext } from '../layout/OrbBackgroundLayer';

/**
 * Main chat route entry point. This component wraps the legacy ChatScreen
 * so the shell overlay can host additional routes without changing the
 * existing chat implementation.
 */
export default function ChatMain() {
  const { activeEgoState } = useAppStore();
  const responsiveOrbSize = useOrbSize();
  const [orbSize, setOrbSize] = useState(responsiveOrbSize);
  const [orbTapHandler, setOrbTapHandler] = useState<(() => void) | null>(null);

  useEffect(() => {
    setOrbSize(responsiveOrbSize);
  }, [responsiveOrbSize]);

  const handleSetOrbTapHandler = useCallback((handler: (() => void) | null) => {
    setOrbTapHandler(() => handler);
  }, []);

  const contextValue = useMemo(
    () => ({
      orbSize,
      setOrbSize,
      setOrbTapHandler: handleSetOrbTapHandler,
    }),
    [handleSetOrbTapHandler, orbSize, setOrbSize]
  );

  const handleOrbTap = useCallback(() => {
    if (orbTapHandler) {
      orbTapHandler();
    }
  }, [orbTapHandler]);

  return (
    <OrbBackgroundContext.Provider value={contextValue}>
      <div className="relative h-full overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div
              className="relative rounded-full bg-teal-500/20 blur-[180px]"
              style={{
                width: Math.min(orbSize * 1.25, 520),
                height: Math.min(orbSize * 1.25, 520),
                transform: 'translateY(-33%)',
              }}
            />
          </div>

          <div
            className="absolute left-1/2 top-[18vh] -translate-x-1/2 -translate-y-1/2"
            style={{ width: orbSize, height: orbSize }}
          >
            <div className="pointer-events-auto relative" style={{ width: orbSize, height: orbSize }}>
              <div className="absolute inset-0 rounded-full bg-teal-400/15 blur-3xl" />
              <Orb
                size={orbSize}
                egoState={activeEgoState}
                variant="css"
                afterglow
                onTap={handleOrbTap}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex h-full flex-col">
          <ChatScreen />
        </div>
      </div>
    </OrbBackgroundContext.Provider>
  );
}
