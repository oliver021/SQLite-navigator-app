import { 
  ArrowUp, ArrowDown, ArrowUpDown, 
  Database, Pencil, Copy, Trash2 
} from 'lucide-react';

interface DataTableProps {
  isLoading: boolean;
  columns: any[];
  data: any[];
  pkCol: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  onSort: (col: string) => void;
  // Inline edit
  editCell: { rowIdx: number; col: string } | null;
  editValue: string;
  onStartEdit: (rowIdx: number, col: string, value: any) => void;
  onEditValueChange: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  // Actions
  onCopyRow: (row: any) => void;
  onDeleteRow: (row: any) => void;
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="skeleton-row">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j}>
              <div className="skeleton-cell" style={{ width: `${35 + Math.random() * 45}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable({
  isLoading,
  columns,
  data,
  pkCol,
  sortColumn,
  sortDirection,
  searchTerm,
  onSort,
  editCell,
  editValue,
  onStartEdit,
  onEditValueChange,
  onCommitEdit,
  onCancelEdit,
  onCopyRow,
  onDeleteRow,
}: DataTableProps) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col: any) => {
              const isSorted = sortColumn === col.name;
              return (
                <th
                  key={col.name}
                  className={`sortable${isSorted ? ' sorted' : ''}`}
                  onClick={() => onSort(col.name)}
                >
                  <span className="col-name">{col.name}</span>
                  <span className="type-badge">{col.type}</span>
                  <span className="sort-icon">
                    {isSorted
                      ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                      : <ArrowUpDown size={12} />
                    }
                  </span>
                </th>
              );
            })}
            {pkCol && <th style={{ width: 90, textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows columns={columns.length + (pkCol ? 1 : 0)} />
          ) : data.length > 0 ? (
            data.map((row, idx) => (
              <tr key={idx} className="fade-in" style={{ animationDelay: `${idx * 12}ms` }}>
                {columns.map((col: any) => {
                  const isEditing = editCell?.rowIdx === idx && editCell?.col === col.name;
                  if (isEditing) {
                    return (
                      <td key={col.name} className="editing">
                        <input
                          className="inline-edit-input"
                          value={editValue}
                          autoFocus
                          onChange={e => onEditValueChange(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') onCommitEdit();
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                          onBlur={() => onCommitEdit()}
                        />
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.name}
                      title={row[col.name] != null ? String(row[col.name]) : 'NULL'}
                      onDoubleClick={() => pkCol && onStartEdit(idx, col.name, row[col.name])}
                    >
                      {row[col.name] != null
                        ? <span className={pkCol ? 'cell-value cell-editable' : 'cell-value'}>{String(row[col.name])}</span>
                        : <span className="null-value">NULL</span>
                      }
                    </td>
                  );
                })}
                {pkCol && (
                  <td>
                    <div className="action-cell">
                      <button
                        className="action-btn edit"
                        title="Edit row"
                        onClick={() => {
                          const firstVisibleCol = columns[0]?.name;
                          if (firstVisibleCol) onStartEdit(idx, firstVisibleCol, row[firstVisibleCol]);
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="action-btn copy"
                        title="Copy row as JSON"
                        onClick={() => onCopyRow(row)}
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        className="action-btn danger"
                        title="Delete row"
                        onClick={() => onDeleteRow(row)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (pkCol ? 1 : 0)} className="empty-table-cell">
                <div className="empty-table-message">
                  <Database size={24} />
                  <span>{searchTerm ? 'No matching rows' : 'No data in this table'}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
