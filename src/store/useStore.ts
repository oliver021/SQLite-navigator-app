import { create } from 'zustand';

interface DatabaseState {
  connectionString: string | null;
  schema: any[];
  activeTableName: string | null;
  activeTableData: any[];
  activeQueryResults: any[];
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalRows: number;

  // Loading
  isLoading: boolean;

  // Sort
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';

  // Search
  searchTerm: string;

  // Column visibility – maps tableName -> Set of visible column names
  visibleColumnsMap: Record<string, string[]>;
  showAllColumns: boolean;

  // View mode
  activeView: 'data' | 'query' | 'schema-graph';

  setConnection: (connStr: string) => void;
  setSchema: (schema: any[]) => void;
  setActiveTable: (tableName: string) => void;
  setActiveTableData: (data: any[]) => void;
  setActiveQueryResults: (results: any[]) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: string | null, direction?: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  setVisibleColumns: (tableName: string, columns: string[]) => void;
  setShowAllColumns: (show: boolean) => void;
  setActiveView: (view: 'data' | 'query') => void;
  
  refreshSchema: () => Promise<void>;
  refreshTableData: () => Promise<void>;
}

const DEFAULT_VISIBLE_COUNT = 8;

export const useStore = create<DatabaseState>((set, get) => ({
  connectionString: null,
  schema: [],
  activeTableName: null,
  activeTableData: [],
  activeQueryResults: [],
  
  currentPage: 1,
  pageSize: 50,
  totalRows: 0,
  isLoading: false,

  sortColumn: null,
  sortDirection: 'asc',
  searchTerm: '',

  visibleColumnsMap: {},
  showAllColumns: false,
  activeView: 'data' as const,

  setConnection: (connStr) => set({ connectionString: connStr }),
  setSchema: (schema) => set({ schema }),

  setActiveTable: (tableName) => {
    const { visibleColumnsMap, schema } = get();
    // Initialise default visible columns for this table if not set
    if (!visibleColumnsMap[tableName]) {
      const tableDef = schema.find(t => t.name === tableName);
      if (tableDef) {
        const allCols: string[] = tableDef.columns.map((c: any) => c.name);
        const defaults = allCols.slice(0, DEFAULT_VISIBLE_COUNT);
        set({
          visibleColumnsMap: { ...visibleColumnsMap, [tableName]: defaults },
        });
      }
    }
    set({
      activeView: 'data',
      activeTableName: tableName,
      currentPage: 1,
      totalRows: 0,
      sortColumn: null,
      sortDirection: 'asc',
      searchTerm: '',
      showAllColumns: false,
    });
    get().refreshTableData();
  },

  setActiveTableData: (data) => set({ activeTableData: data }),
  setActiveQueryResults: (results) => set({ activeQueryResults: results }),

  setPage: (page) => {
    set({ currentPage: page });
    get().refreshTableData();
  },
  setPageSize: (size) => {
    set({ pageSize: size, currentPage: 1 });
    get().refreshTableData();
  },

  setSort: (column, direction) => {
    const { sortColumn, sortDirection } = get();
    if (column === sortColumn) {
      // Toggle direction or clear
      if (sortDirection === 'asc') {
        set({ sortDirection: 'desc', currentPage: 1 });
      } else {
        set({ sortColumn: null, sortDirection: 'asc', currentPage: 1 });
      }
    } else {
      set({ sortColumn: column, sortDirection: direction || 'asc', currentPage: 1 });
    }
    get().refreshTableData();
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term, currentPage: 1 });
    get().refreshTableData();
  },

  setVisibleColumns: (tableName, columns) => {
    const { visibleColumnsMap } = get();
    set({ visibleColumnsMap: { ...visibleColumnsMap, [tableName]: columns } });
  },

  setShowAllColumns: (show) => set({ showAllColumns: show }),
  setActiveView: (view) => set({ activeView: view }),

  refreshSchema: async () => {
    if (get().connectionString) {
      set({ isLoading: true });
      const schema = await window.sqlitenav.getSchema();
      set({
        schema,
        activeTableName: null,
        activeTableData: [],
        currentPage: 1,
        totalRows: 0,
        isLoading: false,
        sortColumn: null,
        sortDirection: 'asc',
        searchTerm: '',
        visibleColumnsMap: {},
        showAllColumns: false,
      });
    }
  },

  refreshTableData: async () => {
    const { activeTableName, currentPage, pageSize, sortColumn, sortDirection, searchTerm } = get();
    if (activeTableName) {
      set({ isLoading: true });
      const offset = (currentPage - 1) * pageSize;
      const search = searchTerm.trim() || undefined;
      
      const [data, count] = await Promise.all([
        window.sqlitenav.getTableData(activeTableName, pageSize, offset, sortColumn ?? undefined, sortDirection, search),
        window.sqlitenav.getTableRowCount(activeTableName, search),
      ]);
      
      set({ activeTableData: data, totalRows: count, isLoading: false });
    }
  },
}));
