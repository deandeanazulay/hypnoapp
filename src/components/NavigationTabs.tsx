import React from 'react';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { TABS, TabId } from '../types/Navigation';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const iconMap = {
  home: Home,
  explore: Search,
  create: Plus,
  favorites: Heart,
  profile: User
};

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
  };

  return (
    <nav className="w-full bg-black/95 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 py-3 relative z-[100] shadow-lg shadow-black/20 safe-area-bottom" style={{ 
      paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))',
      position: 'sticky',
      bottom: 0
    }}>
      <div className="flex justify-between items-center space-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const IconComponent = iconMap[tab.id];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 p-3 sm:p-3 transition-all duration-300 flex-1 relative ${
                isActive 
                  ? 'text-teal-400 transform scale-105' 
                  : 'text-white/50 hover:text-white/70 active:scale-95'
              }`}
              style={{ minWidth: '52px', minHeight: '52px', touchAction: 'manipulation' }}
            >
              <div className="flex items-center justify-center self-center relative">
                <IconComponent size={isActive ? 24 : 22} className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`} />
                {/* Active indicator background */}
                {isActive && (
                  <div className="absolute inset-0 bg-teal-400/10 rounded-full scale-150 animate-pulse" />
                )}
              </div>
              <span className={`text-xs font-medium text-center self-center transition-all duration-300 ${
                isActive ? 'opacity-100 font-semibold' : 'opacity-70'
              }`}>
                {tab.name}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-6 h-0.5 bg-teal-400 rounded-full flex-shrink-0 self-center animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}