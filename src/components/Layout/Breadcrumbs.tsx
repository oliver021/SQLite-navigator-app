import { Database, TerminalSquare, GitBranch, Table2 } from 'lucide-react';

interface BreadcrumbsProps {
  connectionString: string | null;
  activeView: 'data' | 'query' | 'schema-graph' | 'maintenance';
  activeTableName: string | null;
}

export default function Breadcrumbs({
  connectionString,
  activeView,
  activeTableName,
}: BreadcrumbsProps) {
  if (!connectionString) {
    return <span className="breadcrumb-empty">No database connected</span>;
  }

  const dbName = connectionString.split(/[/\\]/).pop();

  return (
    <div className="breadcrumbs">
      <span className="breadcrumb-chip db">
        <Database size={12} />
        {dbName}
      </span>
      {activeView === 'query' && (
        <>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-chip table">
            <TerminalSquare size={12} /> Query Console
          </span>
        </>
      )}
      {activeView === 'schema-graph' && (
        <>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-chip table">
            <GitBranch size={12} /> Schema Graph
          </span>
        </>
      )}
      {activeView === 'maintenance' && (
        <>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-chip table">
            <Table2 size={12} /> Maintenance
          </span>
        </>
      )}
      {activeView === 'data' && activeTableName && (
        <>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-chip table">
            <Table2 size={12} /> {activeTableName}
          </span>
        </>
      )}
    </div>
  );
}
