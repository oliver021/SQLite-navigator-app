import { useState, useCallback } from 'react';

export type ResultData = any[] | null;
export type WriteInfo = any | null;

export function useQueryExecution() {
  const [results, setResults] = useState<ResultData>(null);
  const [writeInfo, setWriteInfo] = useState<WriteInfo>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const execute = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsRunning(true);
    setError(null);
    setResults(null);
    setWriteInfo(null);

    const t0 = performance.now();
    try {
      const res = await window.sqlitenav.executeQuery(query);
      setExecTime(performance.now() - t0);
      
      if (res.success) {
        if (Array.isArray(res.data)) {
          setResults(res.data);
        } else {
          setWriteInfo(res.info);
        }
      } else {
        setError(res.error ?? 'Unknown error');
      }
    } catch (err: any) {
      setExecTime(performance.now() - t0);
      setError(err.message);
    } finally {
      setIsRunning(false);
    }

    setHistory(prev => [query, ...prev.filter(h => h !== query)].slice(0, 30));
  }, []);

  const clear = useCallback(() => {
    setResults(null);
    setWriteInfo(null);
    setError(null);
    setExecTime(null);
  }, []);

  return {
    results,
    writeInfo,
    error,
    isRunning,
    execTime,
    history,
    execute,
    clear,
    setHistory
  };
}
