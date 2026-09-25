import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TablePagination = ({ 
  currentPage, 
  totalPages, 
  rowsPerPage, 
  setPage, 
  setRowsPerPage, 
  totalItems 
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/10">
      <div className="flex items-center text-xs md:text-sm text-slate-400">
        <span>Tampilkan</span>
        <select 
          value={rowsPerPage} 
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          className="mx-2 bg-slate-800 text-slate-200 border border-white/10 rounded px-2 py-1 outline-none cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>dari {totalItems} data</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs md:text-sm text-slate-300 font-medium">
          Hal {currentPage} / {totalPages || 1}
        </span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
