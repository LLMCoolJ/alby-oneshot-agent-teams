import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTransactions } from '@/hooks/useTransactions';

const { mockListTransactions, mockTransactions } = vi.hoisted(() => {
  const mockListTransactions = vi.fn();
  const mockTransactions = [
    {
      payment_hash: 'hash1',
      type: 'incoming' as const,
      state: 'settled' as const,
      amount: 1000000, // millisats
      fees_paid: 0, // millisats
      description: 'Test 1',
      invoice: 'lnbc1000n1...',
      preimage: 'pre1',
      created_at: Math.floor(Date.now() / 1000),
      settled_at: Math.floor(Date.now() / 1000),
      expires_at: undefined,
      metadata: undefined,
    },
    {
      payment_hash: 'hash2',
      type: 'outgoing' as const,
      state: 'settled' as const,
      amount: 500000, // millisats
      fees_paid: 1000, // millisats
      description: 'Test 2',
      invoice: 'lnbc500n1...',
      preimage: 'pre2',
      created_at: Math.floor(Date.now() / 1000),
      settled_at: Math.floor(Date.now() / 1000),
      expires_at: undefined,
      metadata: undefined,
    },
  ];
  return { mockListTransactions, mockTransactions };
});

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    listTransactions: mockListTransactions,
  }),
}));

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTransactions.mockResolvedValue({
      transactions: mockTransactions,
    });
  });

  it('fetches transactions on mount', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maps transaction data correctly', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    const tx = result.current.transactions[0];
    expect(tx).toMatchObject({
      id: 'hash1',
      type: 'incoming',
      state: 'settled',
      amount: 1000000, // millisats
      feesPaid: 0, // millisats
      description: 'Test 1',
      paymentHash: 'hash1',
      preimage: 'pre1',
    });
    expect(tx.createdAt).toBeInstanceOf(Date);
    expect(tx.settledAt).toBeInstanceOf(Date);
  });

  it('maps outgoing transaction correctly', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    const tx = result.current.transactions[1];
    expect(tx).toMatchObject({
      id: 'hash2',
      type: 'outgoing',
      state: 'settled',
      amount: 500000, // millisats
      feesPaid: 1000, // millisats
    });
  });

  it('supports filtering by type', async () => {
    const { result, rerender } = renderHook(
      ({ type }) => useTransactions('alice', { type }),
      { initialProps: { type: undefined as 'incoming' | 'outgoing' | undefined } }
    );

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    rerender({ type: 'incoming' });

    await waitFor(() => {
      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'incoming' })
      );
    });
  });

  it('supports pagination with loadMore', async () => {
    mockListTransactions.mockResolvedValueOnce({
      transactions: [mockTransactions[0]],
    });

    const { result } = renderHook(() => useTransactions('alice', { limit: 1 }));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });

    expect(result.current.hasMore).toBe(true);

    mockListTransactions.mockResolvedValueOnce({
      transactions: [mockTransactions[1]],
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.transactions).toHaveLength(2);
  });

  it('sets hasMore to false when fewer results than limit returned', async () => {
    mockListTransactions.mockResolvedValueOnce({
      transactions: [mockTransactions[0]],
    });

    const { result } = renderHook(() => useTransactions('alice', { limit: 10 }));

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    mockListTransactions.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('handles non-Error exceptions', async () => {
    mockListTransactions.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch transactions');
    });
  });

  it('refresh resets and reloads', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    mockListTransactions.mockResolvedValueOnce({
      transactions: [mockTransactions[0]],
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });
  });

  it('handles null preimage', async () => {
    mockListTransactions.mockResolvedValueOnce({
      transactions: [{
        ...mockTransactions[0],
        preimage: undefined,
      }],
    });

    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions[0].preimage).toBeNull();
    });
  });

  it('returns empty transactions when client is null', async () => {
    const { useNWCClient } = await import('@/hooks/useNWCClient');
    vi.mocked(useNWCClient).mockReturnValueOnce(null);

    const { result } = renderHook(() => useTransactions('alice'));

    // Should not fetch and should stay empty
    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(mockListTransactions).not.toHaveBeenCalled();
  });

  it('returns loading=true during fetch', async () => {
    let resolvePromise!: (value: { transactions: typeof mockTransactions }) => void;
    mockListTransactions.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useTransactions('alice'));

    // loading should be true while waiting
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
    expect(result.current.transactions).toHaveLength(0);

    // Resolve the promise
    await act(async () => {
      resolvePromise({ transactions: mockTransactions });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.transactions).toHaveLength(2);
    });
  });

  it('loadMore passes correct offset to client.listTransactions', async () => {
    mockListTransactions
      .mockResolvedValueOnce({ transactions: [mockTransactions[0]] })
      .mockResolvedValueOnce({ transactions: [mockTransactions[1]] });

    const { result } = renderHook(() => useTransactions('alice', { limit: 1 }));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });

    // First call should have offset: 0 (reset=true)
    expect(mockListTransactions.mock.calls[0][0]).toMatchObject({
      offset: 0,
      limit: 1,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    // Second call should have offset: 1
    expect(mockListTransactions.mock.calls[1][0]).toMatchObject({
      offset: 1,
      limit: 1,
    });
  });

  it('handles empty transaction list', async () => {
    mockListTransactions.mockResolvedValue({ transactions: [] });

    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maps metadata correctly', async () => {
    mockListTransactions.mockResolvedValueOnce({
      transactions: [{
        ...mockTransactions[0],
        metadata: {
          comment: 'test comment',
          payer_data: { name: 'Alice' },
          recipient_data: { identifier: 'bob@example.com' },
          nostr: { pubkey: 'npub123', tags: [['p', 'abc']] },
        },
      }],
    });

    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions[0].metadata).toMatchObject({
        comment: 'test comment',
        payerData: { name: 'Alice' },
        recipientData: { identifier: 'bob@example.com' },
        nostr: { pubkey: 'npub123', tags: [['p', 'abc']] },
      });
    });
  });

  it('converts from/until dates to unix timestamps', async () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const until = new Date('2024-01-31T23:59:59Z');

    renderHook(() => useTransactions('alice', { from, until }));

    await waitFor(() => {
      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          from: Math.floor(from.getTime() / 1000),
          until: Math.floor(until.getTime() / 1000),
        })
      );
    });
  });

  it('uses DEFAULT_PAGE_SIZE when no limit specified', async () => {
    renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 })
      );
    });
  });
});
