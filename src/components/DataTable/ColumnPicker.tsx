import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface ColumnPickerProps {
  allColumns: string[];
  visible: string[];
  onChange: (cols: string[]) => void;
  onClose: () => void;
}

export default function ColumnPicker({
  allColumns,
  visible,
  onChange,
  onClose,
}: ColumnPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggle = (col: string) => {
    if (visible.includes(col)) {
      if (visible.length <= 1) return; // keep at least 1
      onChange(visible.filter(c => c !== col));
    } else {
      onChange([...visible, col]);
    }
  };

  return (
    <div className="col-picker" ref={ref}>
      <div className="col-picker-title">Toggle columns</div>
      {allColumns.map(col => {
        const checked = visible.includes(col);
        return (
          <div key={col} className="col-picker-item" onClick={() => toggle(col)}>
            <span className={`col-picker-check${checked ? ' checked' : ''}`}>
              {checked && <Check size={10} />}
            </span>
            {col}
          </div>
        );
      })}
      <div className="col-picker-divider" />
      <div className="col-picker-actions">
        <button className="col-picker-btn" onClick={() => onChange(allColumns)}>Show all</button>
        <button className="col-picker-btn" onClick={() => onChange(allColumns.slice(0, 8))}>Reset</button>
      </div>
    </div>
  );
}
