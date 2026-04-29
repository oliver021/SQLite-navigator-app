import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

export class DatabaseManager {
  private db: Database.Database | null = null;
  public currentDbPath: string | null = null;
  private inTransaction: boolean = false;

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
   * Explains the query plan for a given SQL string.
   */
  public explainQueryPlan(query: string): any[] {
    if (!this.db) throw new Error('Database not connected');
    try {
      return this.db.prepare(`EXPLAIN QUERY PLAN ${query}`).all();
    } catch (error: any) {
      throw new Error(`Failed to explain query: ${error.message}`);
    }
  }

  /* ==========================================================================
     TRANSACTIONS
     ========================================================================== */
  public beginTransaction(): void {
    if (!this.db) throw new Error('Database not connected');
    if (this.inTransaction) return;
    this.db.prepare('BEGIN TRANSACTION').run();
    this.inTransaction = true;
  }

  public commitTransaction(): void {
    if (!this.db || !this.inTransaction) return;
    this.db.prepare('COMMIT').run();
    this.inTransaction = false;
  }

  public rollbackTransaction(): void {
    if (!this.db || !this.inTransaction) return;
    this.db.prepare('ROLLBACK').run();
    this.inTransaction = false;
  }

  public getTransactionStatus(): boolean {
    return this.inTransaction;
  }

  /* ==========================================================================
     MAINTENANCE & STATS
     ========================================================================== */
  public getDatabaseStats(): any {
    if (!this.db || !this.currentDbPath) throw new Error('Database not connected');
    
    const journalMode = this.db.prepare('PRAGMA journal_mode').get() as any;
    const synchronous = this.db.prepare('PRAGMA synchronous').get() as any;
    const foreignKeys = this.db.prepare('PRAGMA foreign_keys').get() as any;
    const pageSize = this.db.prepare('PRAGMA page_size').get() as any;
    const pageCount = this.db.prepare('PRAGMA page_count').get() as any;
    
    return {
      path: this.currentDbPath,
      sizeBytes: pageSize['page_size'] * pageCount['page_count'],
      journalMode: journalMode['journal_mode'],
      synchronous: synchronous['synchronous'],
      foreignKeys: foreignKeys['foreign_keys'],
      pageSize: pageSize['page_size'],
      pageCount: pageCount['page_count']
    };
  }

  public runMaintenance(task: 'vacuum' | 'optimize' | 'integrity'): any {
    if (!this.db) throw new Error('Database not connected');
    switch (task) {
      case 'vacuum': return this.db.prepare('VACUUM').run();
      case 'optimize': return this.db.prepare('PRAGMA optimize').run();
      case 'integrity': return this.db.prepare('PRAGMA integrity_check').all();
    }
  }

  /**
   * Helper to build WHERE clause from search term and advanced filters.
   */
  private buildWhereClause(tableName: string, search?: string, filters: any[] = []): { clause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];

    // 1. Global search (OR across all columns)
    if (search && search.trim()) {
      const columns = this.db!.prepare(`PRAGMA table_info("${tableName}")`).all() as any[];
      const searchClauses = columns.map(c => `"${c.name}" LIKE ?`);
      const searchParam = `%${search.trim()}%`;
      clauses.push(`(${searchClauses.join(' OR ')})`);
      params.push(...columns.map(() => searchParam));
    }

    // 2. Advanced filters (AND between rules)
    if (filters && filters.length > 0) {
      for (const f of filters) {
        const { column, operator, value } = f;
        if (!column || !operator) continue;

        let sqlOp = operator;
        let sqlVal = value;

        // Map operator aliases if needed
        switch (operator) {
          case 'contains': sqlOp = 'LIKE'; sqlVal = `%${value}%`; break;
          case 'starts':   sqlOp = 'LIKE'; sqlVal = `${value}%`; break;
          case 'ends':     sqlOp = 'LIKE'; sqlVal = `%${value}`; break;
          case 'null':     sqlOp = 'IS NULL'; sqlVal = undefined; break;
          case 'not_null': sqlOp = 'IS NOT NULL'; sqlVal = undefined; break;
        }

        if (sqlOp === 'IS NULL' || sqlOp === 'IS NOT NULL') {
          clauses.push(`"${column}" ${sqlOp}`);
        } else {
          clauses.push(`"${column}" ${sqlOp} ?`);
          params.push(sqlVal);
        }
      }
    }

    return {
      clause: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
      params
    };
  }

  /**
   * Count rows in a table, optionally filtered by a search term across all columns or specific filters.
   */
  public getTableRowCount(tableName: string, search?: string, filters: any[] = []): number {
    if (!this.db) throw new Error('Database not connected');

    const { clause, params } = this.buildWhereClause(tableName, search, filters);
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"${clause}`);
    return (stmt.get(...params) as any).count;
  }

  /**
   * Fetch paginated table data with optional sort, search, and filters.
   */
  public getTableData(
    tableName: string,
    limit: number = 50,
    offset: number = 0,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    search?: string,
    filters: any[] = [],
  ): any {
    if (!this.db) throw new Error('Database not connected');

    const { clause, params } = this.buildWhereClause(tableName, search, filters);
    let query = `SELECT * FROM "${tableName}"${clause}`;

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
