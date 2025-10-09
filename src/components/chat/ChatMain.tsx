import React, { useEffect, useMemo } from 'react';
import ChatScreen from '../screens/ChatScreen';
import { useOrbSize } from '../../hooks/useOrbSize';
import { useOrbBackground } from '../layout/OrbBackgroundLayer';

/**
 * Main chat route entry point. This component wraps the legacy ChatScreen
 * so the shell overlay can host additional routes without changing the
 * existing chat implementation.
 */
export default function ChatMain() {
  const responsiveOrbSize = useOrbSize();
  const { orbSize, setOrbSize } = useOrbBackground();

  useEffect(() => {
    setOrbSize(responsiveOrbSize);
  }, [responsiveOrbSize, setOrbSize]);

  const haloDimensions = useMemo(() => {
    const size = Math.min(orbSize * 1.25, 520);

    return {
      width: size,
      height: size,
    };
  }, [orbSize]);

  const orbOverlayDimensions = useMemo(
    () => ({
      width: orbSize,
      height: orbSize,
    }),
    [orbSize]
  );

  return (
    <div className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div
            className="relative rounded-full bg-teal-500/20 blur-[180px]"
            style={{
              ...haloDimensions,
              transform: 'translateY(-33%)',
            }}
          />
        </div>

        <div
          className="absolute left-1/2 top-[18vh] -translate-x-1/2 -translate-y-1/2"
          style={orbOverlayDimensions}
        >
          <div className="absolute inset-0 rounded-full bg-teal-400/15 blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <ChatScreen />
      </div>
    </div>
  );
}
