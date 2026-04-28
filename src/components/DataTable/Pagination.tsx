import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalRows <= 0) return null;

  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing {(currentPage - 1) * pageSize + 1}–
        {Math.min(currentPage * pageSize, totalRows)} of{' '}
        {totalRows.toLocaleString()}
      </div>
      <div className="pagination-controls">
        <select
          className="page-size-select"
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
        >
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <div className="page-buttons">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={14} />
          </button>
          <button className="page-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            <ChevronLeft size={14} />
          </button>
          <span className="page-indicator">
            {currentPage} <span className="page-separator">of</span> {totalPages}
          </span>
          <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
            <ChevronRight size={14} />
          </button>
          <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
