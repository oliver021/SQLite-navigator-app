const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sqlitenav', {
  openDialog: () => ipcRenderer.invoke('ag:openDialog'),
  getSchema: () => ipcRenderer.invoke('ag:getSchema'),
  getTableRowCount: (tableName: string, search?: string) => ipcRenderer.invoke('ag:getTableRowCount', tableName, search),
  getTableData: (tableName: string, limit?: number, offset?: number, sortColumn?: string, sortDirection?: string, search?: string) =>
    ipcRenderer.invoke('ag:getTableData', tableName, limit, offset, sortColumn, sortDirection, search),
  executeQuery: (query: string, params?: any[]) => ipcRenderer.invoke('ag:executeQuery', query, params),
  updateRow: (tableName: string, pkColumn: string, pkValue: any, changes: any) => ipcRenderer.invoke('ag:updateRow', tableName, pkColumn, pkValue, changes),
  insertRow: (tableName: string, data: any) => ipcRenderer.invoke('ag:insertRow', tableName, data),
  deleteRow: (tableName: string, pkColumn: string, pkValue: any) => ipcRenderer.invoke('ag:deleteRow', tableName, pkColumn, pkValue),
  getRelations: () => ipcRenderer.invoke('ag:getRelations'),
});
