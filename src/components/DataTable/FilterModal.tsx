import { useState } from 'react';
import { X, Plus, Trash2, Filter, AlertCircle } from 'lucide-react';

export interface FilterRule {
  column: string;
  operator: string;
  value: any;
}

interface FilterModalProps {
  columns: { name: string; type: string }[];
  filters: FilterRule[];
  onApply: (filters: FilterRule[]) => void;
  onClose: () => void;
}

const OPERATORS = [
  { value: '=', label: 'Equals', types: ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BOOLEAN'] },
  { value: '!=', label: 'Not Equals', types: ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BOOLEAN'] },
  { value: '>', label: 'Greater Than', types: ['INTEGER', 'REAL', 'NUMERIC'] },
  { value: '<', label: 'Less Than', types: ['INTEGER', 'REAL', 'NUMERIC'] },
  { value: '>=', label: 'Greater or Equal', types: ['INTEGER', 'REAL', 'NUMERIC'] },
  { value: '<=', label: 'Less or Equal', types: ['INTEGER', 'REAL', 'NUMERIC'] },
  { value: 'contains', label: 'Contains', types: ['TEXT'] },
  { value: 'starts', label: 'Starts With', types: ['TEXT'] },
  { value: 'ends', label: 'Ends With', types: ['TEXT'] },
  { value: 'null', label: 'Is Null', types: ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BOOLEAN'] },
  { value: 'not_null', label: 'Is Not Null', types: ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BOOLEAN'] },
];

export default function FilterModal({ columns, filters: initialFilters, onApply, onClose }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterRule[]>(
    initialFilters.length > 0 ? [...initialFilters] : [{ column: columns[0]?.name || '', operator: '=', value: '' }]
  );

  const addRule = () => {
    setLocalFilters([...localFilters, { column: columns[0]?.name || '', operator: '=', value: '' }]);
  };

  const removeRule = (idx: number) => {
    const next = localFilters.filter((_, i) => i !== idx);
    if (next.length === 0) {
      setLocalFilters([{ column: columns[0]?.name || '', operator: '=', value: '' }]);
    } else {
      setLocalFilters(next);
    }
  };

  const updateRule = (idx: number, updates: Partial<FilterRule>) => {
    const next = [...localFilters];
    next[idx] = { ...next[idx], ...updates };
    
    // If column changes, reset operator if not valid for new type
    if (updates.column) {
      const col = columns.find(c => c.name === updates.column);
      const colType = (col?.type || 'TEXT').toUpperCase();
      const validOps = OPERATORS.filter(op => op.types.some(t => colType.includes(t)));
      if (!validOps.some(op => op.value === next[idx].operator)) {
        next[idx].operator = validOps[0]?.value || '=';
      }
    }
    
    setLocalFilters(next);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box filter-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Filter size={18} className="icon-cyan" />
            <h3>Advanced Filters</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body filter-list">
          {localFilters.length === 0 && (
            <div className="empty-filters">
              <AlertCircle size={24} className="opacity-40" />
              <p>No filters active. Add a rule to start filtering.</p>
            </div>
          )}

          {localFilters.map((rule, idx) => {
            const col = columns.find(c => c.name === rule.column);
            const colType = (col?.type || 'TEXT').toUpperCase();
            const validOps = OPERATORS.filter(op => op.types.some(t => colType.includes(t)));

            return (
              <div key={idx} className="filter-rule-row">
                <select
                  className="filter-select col"
                  value={rule.column}
                  onChange={e => updateRule(idx, { column: e.target.value })}
                >
                  {columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="filter-select op"
                  value={rule.operator}
                  onChange={e => updateRule(idx, { operator: e.target.value })}
                >
                  {validOps.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {rule.operator !== 'null' && rule.operator !== 'not_null' && (
                  <input
                    className="filter-input"
                    type={colType.includes('INT') || colType.includes('REAL') ? 'number' : 'text'}
                    placeholder="Value..."
                    value={rule.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                  />
                )}

                <button className="filter-remove-btn" onClick={() => removeRule(idx)}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={addRule}>
            <Plus size={14} /> Add Rule
          </button>
          <div className="flex-spacer" />
          <button className="btn-ghost" onClick={() => onApply([])}>Clear All</button>
          <button className="btn-gradient" onClick={() => onApply(localFilters)}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
