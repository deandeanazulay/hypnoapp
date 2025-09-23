import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PagedGridProps {
  items: any[];
  cols: number;
  rows: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export default function PagedGrid({ items, cols, rows, renderItem, className = '' }: PagedGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = cols * rows;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const currentItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(totalPages - 1, page)));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Grid */}
      <div className="flex-1 min-h-0">
        <div 
          className="grid gap-4 h-full"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {currentItems.map((item, index) => renderItem(item, index))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-4 flex-shrink-0">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPage ? 'bg-teal-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}