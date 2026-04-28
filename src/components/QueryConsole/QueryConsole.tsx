import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { Play, Trash2, History, Clock, Table2, CheckCircle } from 'lucide-react';

// Config & Hooks
import { THEMES, SQLITENAV_THEME, MIDNIGHT_THEME } from '../../config/editorThemes';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import { createSqlCompletionProvider } from '../../utils/sqlAutocompletion';

// Components
import QueryResults from './QueryResults';
import QueryHistory from './QueryHistory';

import './QueryConsole.css';

export default function QueryConsole() {
  const { schema } = useStore();
  const {
    results, writeInfo, error, isRunning, execTime, history,
    execute, clear, setHistory
  } = useQueryExecution();

  // UI State
  const [sql, setSql] = useState('SELECT * FROM ');
  const [theme, setTheme] = useState('sqlitenav-dark');
  const [tab, setTab] = useState<'results' | 'history'>('results');
  const [splitRatio, setSplitRatio] = useState(50);
  
  // Refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  /* ----- Actions ----- */
  const runQuery = useCallback(() => {
    const query = editorRef.current?.getValue()?.trim();
    if (!query) return;
    setTab('results');
    execute(query);
  }, [execute]);

  const handleClear = () => {
    editorRef.current?.setValue('');
    setSql('');
    clear();
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    monacoRef.current?.editor.setTheme(newTheme);
  };

  /* ----- Monaco Integration ----- */
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('sqlitenav-dark', SQLITENAV_THEME);
    monaco.editor.defineTheme('midnight', MIDNIGHT_THEME);
    monaco.editor.setTheme(theme);

    // Command: Ctrl+Enter
    editor.addAction({
      id: 'run-query',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: runQuery,
    });

    // Register our improved autocompletion
    const completionProvider = monaco.languages.registerCompletionItemProvider(
      'sql', 
      createSqlCompletionProvider(schema as any)
    );

    return () => completionProvider.dispose();
  };

  /* ----- Resizer Logic ----- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((e.clientY - rect.top) / rect.height) * 100;
      setSplitRatio(Math.max(20, Math.min(80, ratio)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="query-console" ref={containerRef}>
      {/* ================= EDITOR SECTION ================= */}
      <div className="qc-editor-section" style={{ height: `${splitRatio}%` }}>
        <div className="qc-toolbar">
          <button className="qc-run-btn" onClick={runQuery} disabled={isRunning}>
            <Play size={13} />
            {isRunning ? 'Running…' : 'Run'}
          </button>
          <span className="qc-shortcut">Ctrl + Enter</span>

          <div className="qc-spacer" />

          <select 
            className="qc-theme-select" 
            value={theme} 
            onChange={e => handleThemeChange(e.target.value)}
          >
            {THEMES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button className="qc-clear-btn" onClick={handleClear}>
            <Trash2 size={12} /> Clear
          </button>
        </div>

        <div className="qc-editor-wrapper">
          <Editor
            defaultLanguage="sql"
            defaultValue={sql}
            theme={theme}
            onChange={v => setSql(v ?? '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineHeight: 22,
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              renderLineHighlight: 'line',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              tabSize: 2,
              automaticLayout: true,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
          />
        </div>
      </div>

      {/* ================= DIVIDER ================= */}
      <div
        className={`qc-divider${dragging.current ? ' dragging' : ''}`}
        onMouseDown={() => { dragging.current = true; }}
      />

      {/* ================= RESULTS SECTION ================= */}
      <div className="qc-results-section" style={{ height: `${100 - splitRatio}%` }}>
        <div className="qc-results-header">
          <button
            className={`qc-tab${tab === 'results' ? ' active' : ''}`}
            onClick={() => setTab('results')}
          >
            Results
          </button>
          <button
            className={`qc-tab${tab === 'history' ? ' active' : ''}`}
            onClick={() => setTab('history')}
          >
            <History size={11} /> History
          </button>

          <div className="qc-spacer" />

          {execTime != null && (
            <span className="qc-results-badge time">
              <Clock size={11} /> {execTime < 1 ? '<1' : Math.round(execTime)}ms
            </span>
          )}
          {results && (
            <span className="qc-results-badge rows">
              <Table2 size={11} /> {results.length} rows
            </span>
          )}
          {writeInfo && (
            <span className="qc-results-badge success">
              <CheckCircle size={11} /> {writeInfo.changes ?? 0} affected
            </span>
          )}
        </div>

        <div className="qc-results-body">
          {tab === 'history' ? (
            <QueryHistory 
              history={history} 
              onSelect={(h) => {
                editorRef.current?.setValue(h);
                setTab('results');
              }} 
            />
          ) : (
            <QueryResults 
              results={results} 
              writeInfo={writeInfo} 
              error={error} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
