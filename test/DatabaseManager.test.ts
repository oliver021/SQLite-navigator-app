/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../electron/DatabaseManager';
import fs from 'fs';
import path from 'path';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  const testDbPath = path.join(__dirname, 'test.sqlite');

  beforeEach(() => {
    dbManager = new DatabaseManager();
    // Connect to a new test DB
    dbManager.connect(testDbPath);
    // Setup a simple table
    dbManager.executeQuery(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      );
    `);
  });

  afterEach(() => {
    dbManager.disconnect();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should get correct schema', () => {
    const schema = dbManager.getSchema();
    expect(schema).toBeDefined();
    expect(schema.length).toBe(1);
    expect(schema[0].name).toBe('users');
    expect(schema[0].columns.length).toBe(3);
    expect(schema[0].columns[0].name).toBe('id');
  });

  it('should insert and retrieve a row', () => {
    const insertResult = dbManager.insertRow('users', { name: 'Alice', email: 'alice@example.com' });
    expect(insertResult.success).toBe(true);

    const data = dbManager.getTableData('users');
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Alice');
  });

  it('should update a row', () => {
    dbManager.insertRow('users', { name: 'Bob', email: 'bob@example.com' });
    const updateResult = dbManager.updateRow('users', 'id', 1, { name: 'Bobby' });
    expect(updateResult.success).toBe(true);

    const data = dbManager.getTableData('users');
    expect(data[0].name).toBe('Bobby');
  });

  it('should delete a row', () => {
    dbManager.insertRow('users', { name: 'Charlie', email: 'charlie@example.com' });
    let data = dbManager.getTableData('users');
    expect(data.length).toBe(1);

    const deleteResult = dbManager.deleteRow('users', 'id', 1);
    expect(deleteResult.success).toBe(true);

    data = dbManager.getTableData('users');
    expect(data.length).toBe(0);
  });
});
