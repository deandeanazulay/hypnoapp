import React from 'react';
import { Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex justify-between items-center px-6 py-4 pt-12">
      <div className="w-8" /> {/* Spacer */}
      <h1 className="text-white text-lg font-semibold tracking-wide">
        UI OF THE MIND
      </h1>
      <button className="text-white/80 hover:text-white transition-colors">
        <Search size={24} />
      </button>
    </header>
  );
}