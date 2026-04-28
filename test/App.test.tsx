import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../src/App';
import { useStore } from '../src/store/useStore';

// Mock the store
vi.mock('../src/store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('App Component', () => {
  it('renders empty state correctly', () => {
    (useStore as any).mockReturnValue({
      connectionString: null,
      schema: [],
      activeTableName: null,
      activeTableData: [],
      currentPage: 1,
      pageSize: 50,
      totalRows: 0,
      setPage: vi.fn(),
      setConnection: vi.fn(),
      refreshSchema: vi.fn(),
      setActiveTable: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Antigravity Studio')).toBeDefined();
    expect(screen.getByText('No database opened')).toBeDefined();
  });

  it('renders schema and tables when database is open', () => {
    (useStore as any).mockReturnValue({
      connectionString: '/path/to/test.db',
      schema: [
        { name: 'users', type: 'table' },
        { name: 'products', type: 'table' }
      ],
      activeTableName: null,
      activeTableData: [],
      currentPage: 1,
      pageSize: 50,
      totalRows: 0,
      setPage: vi.fn(),
      setConnection: vi.fn(),
      refreshSchema: vi.fn(),
      setActiveTable: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('test.db')).toBeDefined();
    expect(screen.getByText('users')).toBeDefined();
    expect(screen.getByText('products')).toBeDefined();
  });
});
