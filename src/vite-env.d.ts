/// <reference types="vite/client" />

interface Window {
  sqlitenav: {
    openDialog: () => Promise<string | null>;
    getSchema: () => Promise<any[]>;
    getTableRowCount: (tableName: string, search?: string, filters?: any[]) => Promise<number>;
    getTableData: (tableName: string, limit?: number, offset?: number, sortColumn?: string, sortDirection?: string, search?: string, filters?: any[]) => Promise<any[]>;
    executeQuery: (query: string, params?: any[]) => Promise<any>;
    updateRow: (tableName: string, pkColumn: string, pkValue: any, changes: any) => Promise<any>;
    insertRow: (tableName: string, data: any) => Promise<any>;
    deleteRow: (tableName: string, pkColumn: string, pkValue: any) => Promise<any>;
    getRelations: () => Promise<any[]>;
    
    // Advanced Features
    explainQueryPlan: (query: string) => Promise<any[]>;
    beginTransaction: () => Promise<void>;
    commitTransaction: () => Promise<void>;
    rollbackTransaction: () => Promise<void>;
    getTransactionStatus: () => Promise<boolean>;
    getDatabaseStats: () => Promise<any>;
    runMaintenance: (task: 'vacuum' | 'optimize' | 'integrity') => Promise<any>;
  };
}
