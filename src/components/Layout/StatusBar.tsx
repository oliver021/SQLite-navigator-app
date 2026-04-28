interface StatusBarProps {
  connectionString: string | null;
  activeTableName: string | null;
  visibleColsCount: number;
  allColsCount: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}

export default function StatusBar({
  connectionString,
  activeTableName,
  visibleColsCount,
  allColsCount,
  sortColumn,
  sortDirection,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <span className={`status-dot-small ${connectionString ? 'online' : 'offline'}`} />
          {connectionString ? 'Connected' : 'No connection'}
        </span>
        {activeTableName && (
          <span className="status-item">
            {visibleColsCount}/{allColsCount} columns
          </span>
        )}
        {sortColumn && (
          <span className="status-item">
            Sorted: {sortColumn} {sortDirection}
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">SQLite Navigator v0.1.0</span>
      </div>
    </div>
  );
}
