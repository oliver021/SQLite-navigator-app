import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from './DatabaseManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbManager = new DatabaseManager();
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers - The SQLiteNav Bridge
ipcMain.handle('ag:openDialog', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'SQLite Databases', extensions: ['db', 'sqlite', 'sqlite3'] }]
  });
  
  if (canceled || filePaths.length === 0) {
    return null;
  }
  
  const dbPath = filePaths[0];
  dbManager.connect(dbPath);
  return dbPath;
});

ipcMain.handle('ag:getSchema', () => {
  return dbManager.getSchema();
});

ipcMain.handle('ag:getTableRowCount', (_, tableName: string, search?: string) => {
  return dbManager.getTableRowCount(tableName, search);
});

ipcMain.handle('ag:getTableData', (
  _, tableName: string, limit?: number, offset?: number,
  sortColumn?: string, sortDirection?: 'asc' | 'desc', search?: string
) => {
  return dbManager.getTableData(tableName, limit, offset, sortColumn, sortDirection, search);
});

ipcMain.handle('ag:executeQuery', (_, query: string, params?: any[]) => {
  return dbManager.executeQuery(query, params);
});

ipcMain.handle('ag:updateRow', (_, tableName: string, primaryKeyColumn: string, primaryKeyValue: any, changes: any) => {
  return dbManager.updateRow(tableName, primaryKeyColumn, primaryKeyValue, changes);
});

ipcMain.handle('ag:insertRow', (_, tableName: string, data: any) => {
  return dbManager.insertRow(tableName, data);
});

ipcMain.handle('ag:deleteRow', (_, tableName: string, primaryKeyColumn: string, primaryKeyValue: any) => {
  return dbManager.deleteRow(tableName, primaryKeyColumn, primaryKeyValue);
});

ipcMain.handle('ag:getRelations', () => {
  return dbManager.getRelations();
});
