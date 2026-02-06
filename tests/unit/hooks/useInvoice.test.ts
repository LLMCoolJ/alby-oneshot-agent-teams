import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from '@/hooks/useInvoice';

const { mockMakeInvoice, mockUseNWCClient } = vi.hoisted(() => ({
  mockMakeInvoice: vi.fn().mockResolvedValue({ invoice: 'lnbc...' }),
  mockUseNWCClient: vi.fn(),
}));

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: mockUseNWCClient,
}));

describe('useInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNWCClient.mockReturnValue({
      makeInvoice: mockMakeInvoice,
    });
  });

  it('starts with initial state', () => {
    const { result } = renderHook(() => useInvoice('alice'));
    expect(result.current.invoice).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates invoice successfully', async () => {
    const { result } = renderHook(() => useInvoice('alice'));

    let invoice: any;
    await act(async () => {
      invoice = await result.current.createInvoice({
        amount: 1000,
        description: 'Test invoice',
      });
    });

    expect(result.current.invoice).toEqual({ invoice: 'lnbc...' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(invoice).toEqual({ invoice: 'lnbc...' });
  });

  it('passes correct params to makeInvoice', async () => {
    const { result } = renderHook(() => useInvoice('alice'));

    await act(async () => {
      await result.current.createInvoice({
        amount: 5000,
        description: 'Payment for coffee',
        expiry: 3600,
      });
    });

    expect(mockMakeInvoice).toHaveBeenCalledWith({
      amount: 5000,
      description: 'Payment for coffee',
      expiry: 3600,
    });
  });

  it('handles create invoice error', async () => {
    mockMakeInvoice.mockRejectedValueOnce(new Error('Invoice creation failed'));

    const { result } = renderHook(() => useInvoice('alice'));

    await act(async () => {
      try {
        await result.current.createInvoice({ amount: 1000 });
      } catch (e) {
        // expected
      }
    });

    expect(result.current.invoice).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invoice creation failed');
  });

  it('handles non-Error thrown during create', async () => {
    mockMakeInvoice.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useInvoice('alice'));

    await act(async () => {
      try {
        await result.current.createInvoice({ amount: 1000 });
      } catch (e) {
        // expected
      }
    });

    expect(result.current.error).toBe('Failed to create invoice');
  });

  it('throws when wallet not connected', async () => {
    mockUseNWCClient.mockReturnValue(null);

    const { result } = renderHook(() => useInvoice('alice'));

    await expect(
      act(async () => {
        await result.current.createInvoice({ amount: 1000 });
      })
    ).rejects.toThrow('Wallet not connected');
  });

  it('reset clears state', async () => {
    const { result } = renderHook(() => useInvoice('alice'));

    await act(async () => {
      await result.current.createInvoice({ amount: 1000 });
    });

    expect(result.current.invoice).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.invoice).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading during invoice creation', async () => {
    let resolveInvoice: (v: any) => void;
    mockMakeInvoice.mockImplementationOnce(
      () => new Promise((resolve) => { resolveInvoice = resolve; })
    );

    const { result } = renderHook(() => useInvoice('alice'));

    let promise: Promise<any>;
    act(() => {
      promise = result.current.createInvoice({ amount: 1000 });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveInvoice!({ invoice: 'lnbc...' });
      await promise!;
    });

    expect(result.current.loading).toBe(false);
  });
});
