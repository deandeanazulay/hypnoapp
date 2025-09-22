import React from 'react';
import { Home, Search, Plus, Heart, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 px-6 py-3 z-40">
      <div className="flex justify-between items-center">
        <button className="text-white p-3 hover:text-teal-400 transition-colors">
          <Home size={24} />
        </button>
        <button className="text-white/60 p-3 hover:text-white transition-colors">
          <Search size={24} />
        </button>
        <button className="text-white/60 p-3 hover:text-white transition-colors">
          <Plus size={24} />
        </button>
        <button className="text-white/60 p-3 hover:text-white transition-colors">
          <Heart size={24} />
        </button>
        <button className="text-white/60 p-3 hover:text-white transition-colors">
          <User size={24} />
        </button>
      </div>
    </nav>
  );
}