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
    <nav className="w-full bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-between items-center space-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const IconComponent = iconMap[tab.id];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-between space-y-1 p-2 transition-all duration-200 flex-1 ${
                isActive 
                  ? 'text-teal-400 scale-110' 
                  : 'text-white/60 hover:text-white/80 hover:scale-105'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className="flex items-center justify-center self-center">
                <IconComponent size={22} />
              </div>
              <span className="text-xs font-medium text-center self-center">{tab.name}</span>
              {isActive && (
                <div className="w-1 h-1 bg-teal-400 rounded-full flex-shrink-0 self-center" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}