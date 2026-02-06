import { useState, useCallback } from 'react';
import type { LogEntry } from '@/types';

export function useTransactionLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const addLog = useCallback((
    message: string,
    type: LogEntry['type'] = 'info',
    details?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
      details,
    };
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const clearLogs = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addLog, clearLogs };
}
