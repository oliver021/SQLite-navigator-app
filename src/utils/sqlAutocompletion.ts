import * as monaco from 'monaco-editor';
import { SQL_KEYWORDS, SQL_FUNCTIONS } from '../config/sqlConstants';

interface SchemaItem {
  name: string;
  type: 'table' | 'view';
  columns: { name: string; type: string; pk?: number }[];
}

/**
 * Advanced context-aware autocompletion for SQLite
 */
export function createSqlCompletionProvider(schema: SchemaItem[]) {
  return {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.IPosition) => {
      const word = model.getWordUntilPosition(position);
      const fullText = model.getValue();
      const lines = fullText.split('\n');
      const currentLine = lines[position.lineNumber - 1];
      const textUntilPosition = currentLine.substring(0, position.column - 1);
      
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      // 1. Detect Context
      const isAfterFrom = /\bFROM\s+[a-zA-Z0-9_" ]*$/i.test(textUntilPosition);
      const isAfterJoin = /\bJOIN\s+[a-zA-Z0-9_" ]*$/i.test(textUntilPosition);
      const isAfterSelect = /\bSELECT\s+[^]*$/i.test(textUntilPosition) && !isAfterFrom;
      const isAfterDot = textUntilPosition.endsWith('.');

      // 2. Extract Tables and Aliases from the current query
      // Simple regex to find "FROM table AS alias" or "JOIN table alias"
      const tableMatches = [...fullText.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z0-9_"]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_"]+))?/gi)];
      const activeTables = tableMatches.map(m => ({
        name: m[1].replace(/"/g, ''),
        alias: m[2] ? m[2].replace(/"/g, '') : null
      }));

      // 3. Logic based on context
      
      // -- If after a dot (Table/Alias qualification) --
      if (isAfterDot) {
        const parts = textUntilPosition.split(/\s+/);
        const lastPart = parts[parts.length - 1];
        const prefix = lastPart.substring(0, lastPart.length - 1).replace(/"/g, ''); // table or alias
        
        // Find the real table name for this prefix
        const tableEntry = activeTables.find(t => t.alias === prefix || t.name === prefix) 
                         || { name: prefix }; // fallback to the prefix itself as table name
        
        const schemaTable = schema.find(t => t.name.toLowerCase() === tableEntry.name.toLowerCase());
        
        if (schemaTable) {
          schemaTable.columns.forEach(col => {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              range,
              detail: `${col.type}${col.pk ? ' (PK)' : ''}`,
              documentation: `Column in ${schemaTable.name}`,
              sortText: '0' // Priority
            });
          });
          return { suggestions };
        }
      }

      // -- If after FROM or JOIN (Suggest Tables) --
      if (isAfterFrom || isAfterJoin) {
        schema.forEach(t => {
          suggestions.push({
            label: t.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: t.name,
            range,
            detail: `${t.type} · ${t.columns.length} columns`,
            sortText: '0'
          });
        });
        return { suggestions };
      }

      // -- Default: Suggest Keywords, Functions, Tables, and Columns --
      
      // Keywords
      SQL_KEYWORDS.forEach(kw => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
          detail: 'Keyword',
          sortText: '2'
        });
      });

      // Functions
      SQL_FUNCTIONS.forEach(fn => {
        suggestions.push({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${fn}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Function',
          sortText: '3'
        });
      });

      // Tables
      schema.forEach(t => {
        suggestions.push({
          label: t.name,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: t.name,
          range,
          detail: t.type,
          sortText: '1'
        });
      });

      // Relevant Columns (if tables are detected in query)
      if (activeTables.length > 0) {
        activeTables.forEach(at => {
          const schemaTable = schema.find(t => t.name.toLowerCase() === at.name.toLowerCase());
          if (schemaTable) {
            schemaTable.columns.forEach(col => {
              const label = at.alias ? `${at.alias}.${col.name}` : col.name;
              suggestions.push({
                label: label,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: label,
                range,
                detail: `${schemaTable.name}.${col.type}`,
                sortText: '0'
              });
            });
          }
        });
      } else if (isAfterSelect) {
        // If SELECT but no FROM yet, suggest all columns from all tables (last resort)
        schema.forEach(t => {
          t.columns.forEach(col => {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              range,
              detail: `${t.name}.${col.type}`,
              sortText: '4'
            });
          });
        });
      }

      return { suggestions };
    },
  };
}
