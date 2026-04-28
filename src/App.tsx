import './App.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from './store/useStore';
import { Search, Columns3, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Hooks & Utils
import { useToast } from './hooks/useToast';
import { getPrimaryKey } from './utils/db';

// Components
import Sidebar from './components/Layout/Sidebar';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import DataTable from './components/DataTable/DataTable';
import Pagination from './components/DataTable/Pagination';
import EmptyState from './components/UI/EmptyState';
import StatusBar from './components/Layout/StatusBar';
import ConfirmDialog from './components/UI/ConfirmDialog';
import ColumnPicker from './components/DataTable/ColumnPicker';
import ToastContainer from './components/UI/ToastContainer';
import QueryConsole from './components/QueryConsole/QueryConsole';
import SchemaGraph from './components/SchemaGraph/SchemaGraph';

export default function App() {
  const {
    connectionString, schema, setConnection, refreshSchema,
    activeTableName, setActiveTable, activeTableData,
    currentPage, pageSize, totalRows,
    setPage, setPageSize, isLoading,
    sortColumn, sortDirection, setSort,
    searchTerm, setSearchTerm,
    visibleColumnsMap, setVisibleColumns, showAllColumns, setShowAllColumns,
    activeView, setActiveView,
  } = useStore();

  const { toasts, push: toast } = useToast();

  // Local UI state
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [editCell, setEditCell] = useState<{ rowIdx: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ pkCol: string; pkVal: any; label: string } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [localSearch, setLocalSearch] = useState('');

  const tables      = schema.filter(t => t.type === 'table');
  const views       = schema.filter(t => t.type === 'view');
  const tableDef    = schema.find(t => t.name === activeTableName);
  const allCols: any[] = tableDef?.columns ?? [];
  const allColNames = allCols.map((c: any) => c.name);
  const pkCol       = getPrimaryKey(allCols);

  // Visible columns
  const visibleNames = showAllColumns
    ? allColNames
    : (visibleColumnsMap[activeTableName ?? ''] ?? allColNames.slice(0, 8));
  const visibleCols = allCols.filter((c: any) => visibleNames.includes(c.name));

  // Reset local search when table changes
  useEffect(() => { setLocalSearch(searchTerm); }, [activeTableName, searchTerm]);

  const handleOpenDatabase = async () => {
    const dbPath = await window.sqlitenav.openDialog();
    if (dbPath) {
      setConnection(dbPath);
      await refreshSchema();
    }
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchTerm(value), 350);
  };

  // Inline edit logic
  const startEdit = (rowIdx: number, col: string, currentValue: any) => {
    setEditCell({ rowIdx, col });
    setEditValue(currentValue != null ? String(currentValue) : '');
  };

  const commitEdit = async () => {
    if (!editCell || !activeTableName || !pkCol) return;
    const row = activeTableData[editCell.rowIdx];
    const pkVal = row[pkCol];
    const newVal = editValue === '' ? null : editValue;

    const result = await window.sqlitenav.updateRow(
      activeTableName, pkCol, pkVal, { [editCell.col]: newVal },
    );
    setEditCell(null);
    if (result.success) {
      toast('Row updated', 'success');
      useStore.getState().refreshTableData();
    } else {
      toast(result.error || 'Update failed', 'error');
    }
  };

  // Actions
  const handleCopyRow = (row: any) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    toast('Row copied to clipboard', 'info');
  };

  const handleDeleteRow = async () => {
    if (!deleteTarget || !activeTableName) return;
    const result = await window.sqlitenav.deleteRow(
      activeTableName, deleteTarget.pkCol, deleteTarget.pkVal,
    );
    setDeleteTarget(null);
    if (result.success) {
      toast('Row deleted', 'success');
      useStore.getState().refreshTableData();
    } else {
      toast(result.error || 'Delete failed', 'error');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        connectionString={connectionString}
        onOpenDatabase={handleOpenDatabase}
        activeView={activeView}
        onViewChange={setActiveView}
        tables={tables}
        views={views}
        activeTableName={activeTableName}
        onTableSelect={setActiveTable}
      />

      <main className="main-content">
        <header className="toolbar">
          <Breadcrumbs
            connectionString={connectionString}
            activeView={activeView}
            activeTableName={activeTableName}
          />
        </header>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {activeView === 'query' ? (
              <motion.div
                key="query-console"
                className="table-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <QueryConsole />
              </motion.div>
            ) : activeView === 'schema-graph' ? (
              <motion.div
                key="schema-graph"
                className="table-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <SchemaGraph />
              </motion.div>
            ) : activeTableName ? (
              <motion.div
                key={activeTableName}
                className="table-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {/* Table Header / Toolbar */}
                <div className="table-info-bar">
                  <h2 className="table-title">{activeTableName}</h2>
                  <div className="table-meta">
                    <span className="row-count">
                      <Zap size={13} /> {totalRows.toLocaleString()} rows
                    </span>
                  </div>
                </div>

                <div className="table-toolbar">
                  <div className="search-box">
                    <Search size={14} />
                    <input
                      className="search-input"
                      placeholder="Search across all columns…"
                      value={localSearch}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                  </div>

                  <div className="col-picker-anchor">
                    <button
                      className={`icon-btn${colPickerOpen ? ' active' : ''}`}
                      title="Toggle columns"
                      onClick={() => setColPickerOpen(o => !o)}
                    >
                      <Columns3 size={15} />
                    </button>
                    {colPickerOpen && (
                      <ColumnPicker
                        allColumns={allColNames}
                        visible={visibleNames}
                        onChange={cols => {
                          if (activeTableName) setVisibleColumns(activeTableName, cols);
                          setShowAllColumns(false);
                        }}
                        onClose={() => setColPickerOpen(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Main Data Table */}
                <DataTable
                  isLoading={isLoading}
                  columns={visibleCols}
                  data={activeTableData}
                  pkCol={pkCol}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  searchTerm={searchTerm}
                  onSort={setSort}
                  editCell={editCell}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onEditValueChange={setEditValue}
                  onCommitEdit={commitEdit}
                  onCancelEdit={() => setEditCell(null)}
                  onCopyRow={handleCopyRow}
                  onDeleteRow={(row) => setDeleteTarget({
                    pkCol: pkCol!,
                    pkVal: row[pkCol!],
                    label: `${pkCol} = ${row[pkCol!]}`,
                  })}
                />

                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalRows={totalRows}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </motion.div>
            ) : (
              <EmptyState onOpenDatabase={handleOpenDatabase} />
            )}
          </AnimatePresence>
        </div>

        <StatusBar
          connectionString={connectionString}
          activeTableName={activeTableName}
          visibleColsCount={visibleCols.length}
          allColsCount={allCols.length}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Row"
          description={
            <>
              Are you sure you want to delete the row where{' '}
              <span className="modal-highlight">{deleteTarget.label}</span>?
              This action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={handleDeleteRow}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
