export const SQLITENAV_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword',          foreground: 'c084fc', fontStyle: 'bold' },
    { token: 'keyword.sql',      foreground: 'c084fc', fontStyle: 'bold' },
    { token: 'operator.sql',     foreground: '94a3b8' },
    { token: 'string',           foreground: '34d399' },
    { token: 'string.sql',       foreground: '34d399' },
    { token: 'number',           foreground: 'f59e0b' },
    { token: 'number.sql',       foreground: 'f59e0b' },
    { token: 'comment',          foreground: '4a5568', fontStyle: 'italic' },
    { token: 'predefined.sql',   foreground: '22d3ee' },
    { token: 'identifier',       foreground: 'e2e8f0' },
  ],
  colors: {
    'editor.background':                '#0c0c16',
    'editor.foreground':                '#e2e8f0',
    'editor.lineHighlightBackground':   '#14142a',
    'editor.selectionBackground':       '#7c3aed33',
    'editorCursor.foreground':          '#22d3ee',
    'editorLineNumber.foreground':      '#3a3a50',
    'editorLineNumber.activeForeground':'#94a3b8',
    'editorIndentGuide.background':     '#1a1a30',
    'editor.selectionHighlightBackground': '#7c3aed22',
    'editorSuggestWidget.background':   '#12121e',
    'editorSuggestWidget.border':       '#1a1a2e',
    'editorSuggestWidget.selectedBackground': '#7c3aed33',
    'editorWidget.background':          '#12121e',
    'input.background':                 '#0c0c16',
  },
};

export const MIDNIGHT_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword',    foreground: '60a5fa', fontStyle: 'bold' },
    { token: 'string',     foreground: 'a7f3d0' },
    { token: 'number',     foreground: 'fbbf24' },
    { token: 'comment',    foreground: '475569', fontStyle: 'italic' },
    { token: 'identifier', foreground: 'cbd5e1' },
  ],
  colors: {
    'editor.background':              '#080810',
    'editor.foreground':              '#cbd5e1',
    'editor.lineHighlightBackground': '#0f0f20',
    'editor.selectionBackground':     '#3b82f633',
    'editorCursor.foreground':        '#60a5fa',
    'editorLineNumber.foreground':    '#2a2a40',
  },
};

export const THEMES = [
  { value: 'sqlitenav-dark', label: 'SQLiteNav' },
  { value: 'midnight',         label: 'Midnight' },
  { value: 'vs-dark',          label: 'VS Dark' },
  { value: 'hc-black',         label: 'High Contrast' },
];
