import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePayment } from '@/hooks/usePayment';

const { mockPayInvoice, mockRefreshBalance, mockUseNWCClient } = vi.hoisted(() => ({
  mockPayInvoice: vi.fn().mockResolvedValue({ preimage: 'preimage123', fees_paid: 100 }),
  mockRefreshBalance: vi.fn().mockResolvedValue(undefined),
  mockUseNWCClient: vi.fn(),
}));

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: mockUseNWCClient,
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: mockRefreshBalance,
  }),
}));

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNWCClient.mockReturnValue({
      payInvoice: mockPayInvoice,
    });
  });

  it('starts with initial state', () => {
    const { result } = renderHook(() => usePayment('alice'));
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('pays invoice successfully', async () => {
    const { result } = renderHook(() => usePayment('alice'));

    let payResult: any;
    await act(async () => {
      payResult = await result.current.payInvoice('lnbc...');
    });

    expect(result.current.result).toEqual({ preimage: 'preimage123', feesPaid: 100 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(payResult).toEqual({ preimage: 'preimage123', feesPaid: 100 });
  });

  it('calls client payInvoice with correct params', async () => {
    const { result } = renderHook(() => usePayment('alice'));

    await act(async () => {
      await result.current.payInvoice('lnbc_test_invoice');
    });

    expect(mockPayInvoice).toHaveBeenCalledWith({ invoice: 'lnbc_test_invoice' });
  });

  it('refreshes balance after successful payment', async () => {
    const { result } = renderHook(() => usePayment('alice'));

    await act(async () => {
      await result.current.payInvoice('lnbc...');
    });

    expect(mockRefreshBalance).toHaveBeenCalled();
  });

  it('handles payment error', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Insufficient balance'));

    const { result } = renderHook(() => usePayment('alice'));

    await act(async () => {
      try {
        await result.current.payInvoice('lnbc...');
      } catch (e) {
        // expected
      }
    });

    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Insufficient balance');
  });

  it('handles non-Error thrown during payment', async () => {
    mockPayInvoice.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => usePayment('alice'));

    await act(async () => {
      try {
        await result.current.payInvoice('lnbc...');
      } catch (e) {
        // expected
      }
    });

    expect(result.current.error).toBe('Payment failed');
  });

  it('throws when wallet not connected', async () => {
    mockUseNWCClient.mockReturnValue(null);

    const { result } = renderHook(() => usePayment('alice'));

    await expect(
      act(async () => {
        await result.current.payInvoice('lnbc...');
      })
    ).rejects.toThrow('Wallet not connected');
  });

  it('reset clears state', async () => {
    const { result } = renderHook(() => usePayment('alice'));

    await act(async () => {
      await result.current.payInvoice('lnbc...');
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading during payment', async () => {
    let resolvePayment: (v: any) => void;
    mockPayInvoice.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePayment = resolve; })
    );

    const { result } = renderHook(() => usePayment('alice'));

    let promise: Promise<any>;
    act(() => {
      promise = result.current.payInvoice('lnbc...');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePayment!({ preimage: 'preimage123', fees_paid: 0 });
      await promise!;
    });

    expect(result.current.loading).toBe(false);
  });
});
