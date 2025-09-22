import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationTabs from '../components/NavigationTabs';
import { TabId } from '../types/Navigation';

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export default function AppShell({ activeTab, onTabChange }: AppShellProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="flex h-full flex-col">
        {/* Content region */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
        
        {/* Bottom Navigation */}
        <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </div>
    </div>
  );
}