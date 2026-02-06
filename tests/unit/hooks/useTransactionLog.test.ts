import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionLog } from '@/hooks/useTransactionLog';

// Ensure crypto.randomUUID is available (setup.ts stubs crypto without randomUUID)
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  (crypto as any).randomUUID = () => `test-uuid-${++uuidCounter}`;
});

describe('useTransactionLog', () => {
  it('returns empty entries initially', () => {
    const { result } = renderHook(() => useTransactionLog());
    expect(result.current.entries).toEqual([]);
  });

  it('returns addLog function', () => {
    const { result } = renderHook(() => useTransactionLog());
    expect(typeof result.current.addLog).toBe('function');
  });

  it('returns clearLogs function', () => {
    const { result } = renderHook(() => useTransactionLog());
    expect(typeof result.current.clearLogs).toBe('function');
  });

  it('adds a log entry with default type info', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Test message');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].message).toBe('Test message');
    expect(result.current.entries[0].type).toBe('info');
  });

  it('adds a log entry with specified type', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Payment failed', 'error');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].type).toBe('error');
  });

  it('adds a log entry with success type', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Payment sent', 'success');
    });

    expect(result.current.entries[0].type).toBe('success');
  });

  it('adds a log entry with warning type', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Low balance', 'warning');
    });

    expect(result.current.entries[0].type).toBe('warning');
  });

  it('adds a log entry with details', () => {
    const { result } = renderHook(() => useTransactionLog());
    const details = { amount: 1000, preimage: 'abc123' };

    act(() => {
      result.current.addLog('Payment details', 'info', details);
    });

    expect(result.current.entries[0].details).toEqual(details);
  });

  it('generates an id for each entry', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Test');
    });

    expect(result.current.entries[0].id).toBe('test-uuid-1');
  });

  it('adds a timestamp to each entry', () => {
    const { result } = renderHook(() => useTransactionLog());
    const before = new Date();

    act(() => {
      result.current.addLog('Test');
    });

    const after = new Date();
    const entryTime = result.current.entries[0].timestamp.getTime();
    expect(entryTime).toBeGreaterThanOrEqual(before.getTime());
    expect(entryTime).toBeLessThanOrEqual(after.getTime());
  });

  it('prepends new entries (newest first)', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('First');
    });
    act(() => {
      result.current.addLog('Second');
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].message).toBe('Second');
    expect(result.current.entries[1].message).toBe('First');
  });

  it('clears all logs', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Entry 1');
      result.current.addLog('Entry 2');
      result.current.addLog('Entry 3');
    });

    expect(result.current.entries).toHaveLength(3);

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.entries).toEqual([]);
  });

  it('can add entries after clearing', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('Before clear');
    });
    act(() => {
      result.current.clearLogs();
    });
    act(() => {
      result.current.addLog('After clear');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].message).toBe('After clear');
  });

  it('maintains stable addLog reference across renders', () => {
    const { result, rerender } = renderHook(() => useTransactionLog());
    const firstAddLog = result.current.addLog;
    rerender();
    expect(result.current.addLog).toBe(firstAddLog);
  });

  it('maintains stable clearLogs reference across renders', () => {
    const { result, rerender } = renderHook(() => useTransactionLog());
    const firstClearLogs = result.current.clearLogs;
    rerender();
    expect(result.current.clearLogs).toBe(firstClearLogs);
  });

  it('entries without details have undefined details', () => {
    const { result } = renderHook(() => useTransactionLog());

    act(() => {
      result.current.addLog('No details');
    });

    expect(result.current.entries[0].details).toBeUndefined();
  });
});
