import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZap } from '@/hooks/useZap';

const {
  mockFetch,
  mockZapInvoice,
  MockLightningAddress,
  mockPayInvoice,
  mockRefreshBalance,
} = vi.hoisted(() => {
  const mockFetch = vi.fn().mockResolvedValue(undefined);
  const mockZapInvoice = vi.fn().mockResolvedValue({
    paymentRequest: 'lnbc...',
  });
  const MockLightningAddress = vi.fn().mockImplementation(() => ({
    fetch: mockFetch,
    zapInvoice: mockZapInvoice,
  }));
  const mockPayInvoice = vi.fn().mockResolvedValue({
    preimage: 'preimage123',
    fees_paid: 0,
  });
  const mockRefreshBalance = vi.fn().mockResolvedValue(undefined);
  return { mockFetch, mockZapInvoice, MockLightningAddress, mockPayInvoice, mockRefreshBalance };
});

// Mock LightningAddress
vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: MockLightningAddress,
}));

// Mock useNWCClient
vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    payInvoice: (...args: unknown[]) => mockPayInvoice(...args),
  }),
}));

// Mock useWalletActions
vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: (...args: unknown[]) => mockRefreshBalance(...args),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(undefined);
  mockZapInvoice.mockResolvedValue({ paymentRequest: 'lnbc...' });
  mockPayInvoice.mockResolvedValue({ preimage: 'preimage123', fees_paid: 0 });
  mockRefreshBalance.mockResolvedValue(undefined);
  MockLightningAddress.mockImplementation(() => ({
    fetch: mockFetch,
    zapInvoice: mockZapInvoice,
  }));
});

describe('useZap', () => {
  const defaultZapRequest = {
    recipientAddress: 'bob@getalby.com',
    recipientPubkey: 'npub1bob123...',
    amount: 21,
    relays: ['wss://relay.damus.io'],
    comment: 'Great post!',
    eventId: 'note1abc123def456',
  };

  it('sends zap with correct parameters', async () => {
    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      const zapResult = await result.current.sendZap(defaultZapRequest);

      expect(zapResult.preimage).toBe('preimage123');
      expect(zapResult.feesPaid).toBe(0);
    });

    // Verify LightningAddress was created with correct address
    expect(MockLightningAddress).toHaveBeenCalledWith('bob@getalby.com');
    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalled();
    // Verify zapInvoice was called with correct params
    expect(mockZapInvoice).toHaveBeenCalledWith({
      satoshi: 21,
      comment: 'Great post!',
      relays: ['wss://relay.damus.io'],
      p: 'npub1bob123...',
      e: 'note1abc123def456',
    });
    // Verify payInvoice was called with the invoice
    expect(mockPayInvoice).toHaveBeenCalledWith({ invoice: 'lnbc...' });
  });

  it('returns loading=true during zap', async () => {
    // Make payInvoice hang so we can observe loading state mid-flight
    let resolvePayment!: (value: { preimage: string; fees_paid: number }) => void;
    mockPayInvoice.mockReturnValue(
      new Promise((resolve) => {
        resolvePayment = resolve;
      })
    );

    const { result } = renderHook(() => useZap('alice'));

    expect(result.current.loading).toBe(false);

    let zapPromise!: Promise<unknown>;
    // Start the zap (but don't await it)
    await act(async () => {
      zapPromise = result.current.sendZap(defaultZapRequest);
      // Yield so React can process the setState(true)
      await Promise.resolve();
    });

    // loading should be true while payment is pending
    expect(result.current.loading).toBe(true);

    // Resolve the payment
    await act(async () => {
      resolvePayment({ preimage: 'preimage123', fees_paid: 0 });
      await zapPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('returns error on failure', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Insufficient balance'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Insufficient balance');
    expect(result.current.loading).toBe(false);
  });

  it('throws when wallet not connected (client null)', async () => {
    const { useNWCClient } = await import('@/hooks/useNWCClient');
    vi.mocked(useNWCClient).mockReturnValueOnce(null as any);

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
        expect.fail('Should have thrown');
      } catch (err) {
        expect((err as Error).message).toBe('Wallet not connected');
      }
    });
  });

  it('calls refreshBalance on success', async () => {
    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      await result.current.sendZap(defaultZapRequest);
    });

    expect(mockRefreshBalance).toHaveBeenCalled();
  });

  it('returns preimage and feesPaid in result', async () => {
    mockPayInvoice.mockResolvedValueOnce({ preimage: 'abc123preimage', fees_paid: 42 });

    const { result } = renderHook(() => useZap('alice'));

    let zapResult: { preimage: string; feesPaid: number } | undefined;
    await act(async () => {
      zapResult = await result.current.sendZap(defaultZapRequest);
    });

    expect(zapResult).toEqual({
      preimage: 'abc123preimage',
      feesPaid: 42,
    });
  });

  it('handles LightningAddress.fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch LNURL data'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Failed to fetch LNURL data');
    expect(result.current.loading).toBe(false);
  });

  it('handles zapInvoice failure', async () => {
    mockZapInvoice.mockRejectedValueOnce(new Error('Zap invoice creation failed'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Zap invoice creation failed');
    expect(result.current.loading).toBe(false);
  });

  it('handles payInvoice failure', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Payment route not found'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Payment route not found');
    expect(result.current.loading).toBe(false);
  });

  it('handles non-Error thrown values', async () => {
    mockPayInvoice.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Zap failed');
  });

  it('clears error on subsequent successful zap', async () => {
    // First, cause an error
    mockPayInvoice.mockRejectedValueOnce(new Error('First failure'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('First failure');

    // Now succeed
    await act(async () => {
      await result.current.sendZap(defaultZapRequest);
    });

    expect(result.current.error).toBeNull();
  });

  it('does not call refreshBalance on failure', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      try {
        await result.current.sendZap(defaultZapRequest);
      } catch {
        // expected
      }
    });

    expect(mockRefreshBalance).not.toHaveBeenCalled();
  });

  it('sends zap without optional comment', async () => {
    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      await result.current.sendZap({
        recipientAddress: 'bob@getalby.com',
        recipientPubkey: 'npub1bob123...',
        amount: 100,
        relays: ['wss://relay.damus.io', 'wss://nos.lol'],
      });
    });

    expect(mockZapInvoice).toHaveBeenCalledWith({
      satoshi: 100,
      comment: undefined,
      relays: ['wss://relay.damus.io', 'wss://nos.lol'],
      p: 'npub1bob123...',
      e: undefined,
    });
  });
});
