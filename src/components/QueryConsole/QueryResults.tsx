import { Table2, CheckCircle, AlertCircle, Terminal } from 'lucide-react';

interface QueryResultsProps {
  results: any[] | null;
  writeInfo: any | null;
  error: string | null;
}

export default function QueryResults({ results, writeInfo, error }: QueryResultsProps) {
  const resultColumns = results && results.length > 0 ? Object.keys(results[0]) : [];

  if (error) {
    return (
      <div className="qc-error">
        <div className="qc-error-label">
          <AlertCircle size={14} /> Error
        </div>
        {error}
      </div>
    );
  }

  if (writeInfo && !error) {
    return (
      <div className="qc-write-result">
        <CheckCircle size={28} color="#34d399" />
        <span>
          Query executed successfully —{' '}
          <strong>{writeInfo.changes ?? 0}</strong> row(s) affected
        </span>
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <table className="qc-results-table">
        <thead>
          <tr>
            {resultColumns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, idx) => (
            <tr key={idx}>
              {resultColumns.map(col => (
                <td key={col} title={row[col] != null ? String(row[col]) : 'NULL'}>
                  {row[col] != null ? String(row[col]) : <span className="null-value">NULL</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (results && results.length === 0) {
    return (
      <div className="qc-empty">
        <Table2 size={28} />
        <span>Query returned 0 rows</span>
      </div>
    );
  }

  return (
    <div className="qc-empty">
      <Terminal size={28} />
      <span>Run a query to see results</span>
      <span style={{ fontSize: 11 }}>
        Use <strong>Ctrl+Enter</strong> or click Run
      </span>
    </div>
  );
}
