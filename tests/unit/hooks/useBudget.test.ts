import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudget } from '@/hooks/useBudget';

const { mockGetBudget, mockUseNWCClient, mockUseWallet } = vi.hoisted(() => ({
  mockGetBudget: vi.fn().mockResolvedValue({
    total_budget: 1_000_000,
    used_budget: 500_000,
    renews_at: 1700000000,
    renewal_period: 'monthly',
  }),
  mockUseNWCClient: vi.fn(),
  mockUseWallet: vi.fn(),
}));

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: mockUseNWCClient,
}));

vi.mock('@/hooks/useWallet', () => ({
  useWallet: mockUseWallet,
}));

describe('useBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNWCClient.mockReturnValue({
      getBudget: mockGetBudget,
    });
    mockUseWallet.mockReturnValue({
      status: 'connected',
      balance: 100_000_000,
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
      info: null,
    });
  });

  it('fetches budget on mount when connected', async () => {
    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetBudget).toHaveBeenCalled();
    expect(result.current.totalBudget).toBe(1_000_000);
    expect(result.current.usedBudget).toBe(500_000);
    expect(result.current.remainingBudget).toBe(500_000);
    expect(result.current.available).toBe(true);
  });

  it('calculates renewsAt as Date', async () => {
    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.renewsAt).toEqual(new Date(1700000000 * 1000));
  });

  it('returns renewal period', async () => {
    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.renewalPeriod).toBe('monthly');
  });

  it('handles empty budget response (no budget set)', async () => {
    mockGetBudget.mockResolvedValueOnce({});

    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalBudget).toBeNull();
    expect(result.current.usedBudget).toBeNull();
    expect(result.current.remainingBudget).toBeNull();
    expect(result.current.available).toBe(false);
  });

  it('handles getBudget error', async () => {
    mockGetBudget.mockRejectedValueOnce(new Error('Not supported'));

    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not supported');
    expect(result.current.available).toBe(false);
  });

  it('handles non-Error thrown in getBudget', async () => {
    mockGetBudget.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch budget');
  });

  it('does not fetch when client is null', () => {
    mockUseNWCClient.mockReturnValue(null);
    mockUseWallet.mockReturnValue({
      status: 'disconnected',
      balance: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
      info: null,
    });

    renderHook(() => useBudget('alice'));

    expect(mockGetBudget).not.toHaveBeenCalled();
  });

  it('refresh can be called manually', async () => {
    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockGetBudget.mockResolvedValueOnce({
      total_budget: 2_000_000,
      used_budget: 1_000_000,
      renews_at: 1700000000,
      renewal_period: 'monthly',
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.totalBudget).toBe(2_000_000);
    expect(result.current.usedBudget).toBe(1_000_000);
    expect(result.current.remainingBudget).toBe(1_000_000);
  });

  it('returns null renewsAt when not set in response', async () => {
    mockGetBudget.mockResolvedValueOnce({
      total_budget: 1_000_000,
      used_budget: 500_000,
      renewal_period: 'monthly',
    });

    const { result } = renderHook(() => useBudget('alice'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.renewsAt).toBeNull();
  });
});
