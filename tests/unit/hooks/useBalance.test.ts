import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBalance } from '@/hooks/useBalance';

const { mockRefreshBalance, mockUseWallet } = vi.hoisted(() => ({
  mockRefreshBalance: vi.fn().mockResolvedValue(undefined),
  mockUseWallet: vi.fn().mockReturnValue({
    status: 'connected',
    balance: 100_000_000,
    error: null,
    id: 'alice',
    nwcUrl: 'nostr+walletconnect://test',
    info: null,
  }),
}));

vi.mock('@/hooks/useWallet', () => ({
  useWallet: mockUseWallet,
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: mockRefreshBalance,
  }),
}));

describe('useBalance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUseWallet.mockReturnValue({
      status: 'connected',
      balance: 100_000_000,
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
      info: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts millisats to sats correctly', () => {
    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.millisats).toBe(100_000_000);
    expect(result.current.sats).toBe(100_000);
  });

  it('returns null sats when balance is null', () => {
    mockUseWallet.mockReturnValue({
      status: 'disconnected',
      balance: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
      info: null,
    });

    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.sats).toBeNull();
    expect(result.current.millisats).toBeNull();
  });

  it('returns loading true when connecting', () => {
    mockUseWallet.mockReturnValue({
      status: 'connecting',
      balance: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
      info: null,
    });

    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.loading).toBe(true);
  });

  it('returns error from wallet state', () => {
    mockUseWallet.mockReturnValue({
      status: 'error',
      balance: null,
      error: 'Connection failed',
      id: 'alice',
      nwcUrl: null,
      info: null,
    });

    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.error).toBe('Connection failed');
  });

  it('provides refresh function', () => {
    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.refresh).toBe(mockRefreshBalance);
  });

  it('sets up polling when connected', () => {
    renderHook(() => useBalance('alice', { pollingInterval: 5000 }));

    expect(mockRefreshBalance).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(mockRefreshBalance).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(mockRefreshBalance).toHaveBeenCalledTimes(2);
  });

  it('does not set up polling when disconnected', () => {
    mockUseWallet.mockReturnValue({
      status: 'disconnected',
      balance: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
      info: null,
    });

    renderHook(() => useBalance('alice', { pollingInterval: 5000 }));

    vi.advanceTimersByTime(10000);
    expect(mockRefreshBalance).not.toHaveBeenCalled();
  });

  it('does not poll when pollingInterval is zero', () => {
    renderHook(() => useBalance('alice', { pollingInterval: 0 }));

    vi.advanceTimersByTime(60000);
    expect(mockRefreshBalance).not.toHaveBeenCalled();
  });

  it('floors sats conversion', () => {
    mockUseWallet.mockReturnValue({
      status: 'connected',
      balance: 1500, // 1.5 sats
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
      info: null,
    });

    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.sats).toBe(1);
  });
});
