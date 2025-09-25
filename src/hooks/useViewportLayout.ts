// useViewportLayout.ts - iOS Safari viewport fix
import { useEffect } from 'react';

export function setLayoutVars() {
  const hud = document.querySelector('[data-hud]') || document.querySelector('.global-hud');
  const tabs = document.querySelector('[data-tabs]') || document.querySelector('nav[style*="--total-nav-height"]');
  const vv = (window as any).visualViewport;

  const hudH = hud ? (hud as HTMLElement).offsetHeight : 0;
  const tabsH = tabs ? (tabs as HTMLElement).offsetHeight : 64; // fallback to known nav height
  const vvh = vv ? vv.height : window.innerHeight;

  const root = document.documentElement.style;
  root.setProperty('--hud-h', hudH + 'px');
  root.setProperty('--tabs-h', tabsH + 'px');
  root.setProperty('--vvh', vvh + 'px');
  
  // Debug logging for iOS issues
  if (import.meta.env.DEV) {
    console.log('Layout vars set:', { hudH, tabsH, vvh });
  }
}

export function initLayoutWatchers() {
  setLayoutVars();
  window.addEventListener('resize', setLayoutVars);
  window.addEventListener('orientationchange', setLayoutVars);
  (window as any).visualViewport?.addEventListener('resize', setLayoutVars);
}

export function useViewportLayout() {
  useEffect(() => {
    initLayoutWatchers();
    
    return () => {
      window.removeEventListener('resize', setLayoutVars);
      window.removeEventListener('orientationchange', setLayoutVars);
      (window as any).visualViewport?.removeEventListener('resize', setLayoutVars);
    };
  }, []);
}