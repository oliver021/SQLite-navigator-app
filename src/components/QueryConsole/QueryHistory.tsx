import { History } from 'lucide-react';

interface QueryHistoryProps {
  history: string[];
  onSelect: (sql: string) => void;
}

export default function QueryHistory({ history, onSelect }: QueryHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="qc-empty">
        <History size={28} />
        <span>No query history yet</span>
      </div>
    );
  }

  return (
    <div className="qc-history">
      {history.map((h, i) => (
        <button
          key={i}
          className="qc-history-item"
          title={h}
          onClick={() => onSelect(h)}
        >
          {h}
        </button>
      ))}
    </div>
  );
}
