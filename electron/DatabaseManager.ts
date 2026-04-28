import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

export class DatabaseManager {
  private db: Database.Database | null = null;
  public currentDbPath: string | null = null;

  constructor() {}

  public connect(dbPath: string): void {
    if (this.db) {
      this.db.close();
    }
    this.db = new Database(dbPath, { fileMustExist: false });
    this.currentDbPath = dbPath;
  }

  public disconnect(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.currentDbPath = null;
    }
  }

  public getSchema(): any {
    if (!this.db) throw new Error('Database not connected');
    
    const tables = this.db.prepare(`
      SELECT name, type, sql 
      FROM sqlite_master 
      WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
    `).all();

    const schema = tables.map((t: any) => {
      const columns = this.db!.prepare(`PRAGMA table_info("${t.name}")`).all();
      const indexes = this.db!.prepare(`PRAGMA index_list("${t.name}")`).all();
      return {
        name: t.name,
        type: t.type,
        sql: t.sql,
        columns,
        indexes
      };
    });

    return schema;
  }

  public executeQuery(query: string, params: any[] = []): any {
    if (!this.db) throw new Error('Database not connected');
    
    // Rudimentary check for SELECT vs others to return rows vs changes
    const isSelect = query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA');
    
    try {
      const stmt = this.db.prepare(query);
      if (isSelect) {
        return { success: true, data: stmt.all(...params) };
      } else {
        const info = stmt.run(...params);
        return { success: true, info };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Count rows in a table, optionally filtered by a search term across all columns.
   */
  public getTableRowCount(tableName: string, search?: string): number {
    if (!this.db) throw new Error('Database not connected');

    if (search && search.trim()) {
      const columns = this.db.prepare(`PRAGMA table_info("${tableName}")`).all() as any[];
      const whereClauses = columns.map(c => `"${c.name}" LIKE ?`);
      const searchParam = `%${search.trim()}%`;
      const params = columns.map(() => searchParam);
      const stmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM "${tableName}" WHERE ${whereClauses.join(' OR ')}`
      );
      return (stmt.get(...params) as any).count;
    }

    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return (stmt.get() as any).count;
  }

  /**
   * Fetch paginated table data with optional sort and search.
   */
  public getTableData(
    tableName: string,
    limit: number = 50,
    offset: number = 0,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    search?: string,
  ): any {
    if (!this.db) throw new Error('Database not connected');

    let query = `SELECT * FROM "${tableName}"`;
    const params: any[] = [];

    // Search filter across all columns
    if (search && search.trim()) {
      const columns = this.db.prepare(`PRAGMA table_info("${tableName}")`).all() as any[];
      const whereClauses = columns.map(c => `"${c.name}" LIKE ?`);
      const searchParam = `%${search.trim()}%`;
      params.push(...columns.map(() => searchParam));
      query += ` WHERE ${whereClauses.join(' OR ')}`;
    }

    // Sort
    if (sortColumn) {
      const dir = sortDirection === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY "${sortColumn}" ${dir}`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  public updateRow(tableName: string, primaryKeyColumn: string, primaryKeyValue: any, changes: Record<string, any>): any {
    if (!this.db) throw new Error('Database not connected');
    
    const keys = Object.keys(changes);
    if (keys.length === 0) return { success: true, info: { changes: 0 } };

    const setClause = keys.map(k => `"${k}" = ?`).join(', ');
    const values = keys.map(k => changes[k]);
    
    values.push(primaryKeyValue);

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE "${primaryKeyColumn}" = ?`;
    
    try {
      const stmt = this.db.prepare(query);
      const info = stmt.run(...values);
      return { success: true, info };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Generic Insert
  public insertRow(tableName: string, data: Record<string, any>): any {
    if (!this.db) throw new Error('Database not connected');
    const keys = Object.keys(data);
    const columns = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => data[k]);

    try {
      const stmt = this.db.prepare(`INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`);
      const info = stmt.run(...values);
      return { success: true, info };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Generic Delete
  public deleteRow(tableName: string, primaryKeyColumn: string, primaryKeyValue: any): any {
    if (!this.db) throw new Error('Database not connected');
    try {
      const stmt = this.db.prepare(`DELETE FROM "${tableName}" WHERE "${primaryKeyColumn}" = ?`);
      const info = stmt.run(primaryKeyValue);
      return { success: true, info };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Introspect all foreign-key relationships across every user table.
   * Returns an array of { fromTable, fromColumn, toTable, toColumn, onUpdate, onDelete }.
   */
  public getRelations(): any[] {
    if (!this.db) throw new Error('Database not connected');

    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    `).all() as any[];

    const relations: any[] = [];
    for (const t of tables) {
      const fks = this.db.prepare(`PRAGMA foreign_key_list("${t.name}")`).all() as any[];
      for (const fk of fks) {
        relations.push({
          fromTable: t.name,
          fromColumn: fk.from,
          toTable: fk.table,
          toColumn: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete,
        });
      }
    }
    return relations;
  }
}
