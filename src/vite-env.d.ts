/// <reference types="vite/client" />

interface Window {
  sqlitenav: {
    openDialog: () => Promise<string | null>;
    getSchema: () => Promise<any[]>;
    getTableRowCount: (tableName: string, search?: string) => Promise<number>;
    getTableData: (tableName: string, limit?: number, offset?: number, sortColumn?: string, sortDirection?: string, search?: string) => Promise<any[]>;
    executeQuery: (query: string, params?: any[]) => Promise<any>;
    updateRow: (tableName: string, pkColumn: string, pkValue: any, changes: any) => Promise<any>;
    insertRow: (tableName: string, data: any) => Promise<any>;
    deleteRow: (tableName: string, pkColumn: string, pkValue: any) => Promise<any>;
    getRelations: () => Promise<any[]>;
  };
}
