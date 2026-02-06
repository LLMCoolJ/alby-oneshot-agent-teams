import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

const { mockUnsubscribe, mockSubscribeNotifications, mockUseNWCClient, mockRefreshBalance } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  const mockSubscribeNotifications = vi.fn().mockResolvedValue(mockUnsubscribe);
  const mockUseNWCClient = vi.fn().mockReturnValue({
    subscribeNotifications: mockSubscribeNotifications,
  });
  const mockRefreshBalance = vi.fn();
  return { mockUnsubscribe, mockSubscribeNotifications, mockUseNWCClient, mockRefreshBalance };
});

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: mockUseNWCClient,
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: mockRefreshBalance,
  }),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribeNotifications.mockResolvedValue(mockUnsubscribe);
    mockUseNWCClient.mockReturnValue({
      subscribeNotifications: mockSubscribeNotifications,
    });
  });

  it('starts unsubscribed', () => {
    const { result } = renderHook(() => useNotifications('bob'));
    expect(result.current.isSubscribed).toBe(false);
  });

  it('starts with no error', () => {
    const { result } = renderHook(() => useNotifications('bob'));
    expect(result.current.error).toBeNull();
  });

  it('subscribes successfully', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications('bob', { onNotification })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(mockSubscribeNotifications).toHaveBeenCalled();
  });

  it('passes notification types to client.subscribeNotifications', async () => {
    const { result } = renderHook(() =>
      useNotifications('bob', { notificationTypes: ['payment_received'] })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeNotifications).toHaveBeenCalledWith(
      expect.any(Function),
      ['payment_received']
    );
  });

  it('unsubscribes successfully', async () => {
    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    act(() => {
      result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('does not call unsubscribe on unmount if not subscribed', () => {
    const { unmount } = renderHook(() => useNotifications('bob'));

    unmount();

    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('sets error when client is null', async () => {
    mockUseNWCClient.mockReturnValue(null);

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Wallet not connected');
    expect(result.current.isSubscribed).toBe(false);
  });

  it('does not call subscribeNotifications when client is null', async () => {
    mockUseNWCClient.mockReturnValue(null);

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeNotifications).not.toHaveBeenCalled();
  });

  it('sets error and throws when subscribe fails', async () => {
    mockSubscribeNotifications.mockRejectedValue(new Error('Subscription failed'));

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await expect(result.current.subscribe()).rejects.toThrow('Subscription failed');
    });

    expect(result.current.error).toBe('Subscription failed');
    expect(result.current.isSubscribed).toBe(false);
  });

  it('sets generic error message for non-Error throws', async () => {
    mockSubscribeNotifications.mockRejectedValue('unknown failure');

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      try {
        await result.current.subscribe();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Failed to subscribe');
  });

  it('clears error on successful subscribe', async () => {
    // First subscribe fails
    mockSubscribeNotifications.mockRejectedValueOnce(new Error('Fail'));

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      try {
        await result.current.subscribe();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Fail');

    // Second subscribe succeeds
    mockSubscribeNotifications.mockResolvedValueOnce(mockUnsubscribe);

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isSubscribed).toBe(true);
  });

  it('calls onNotification callback when notification received', async () => {
    const onNotification = vi.fn();
    let capturedCallback: (notification: unknown) => void;

    mockSubscribeNotifications.mockImplementation((callback: (notification: unknown) => void) => {
      capturedCallback = callback;
      return Promise.resolve(mockUnsubscribe);
    });

    const { result } = renderHook(() =>
      useNotifications('bob', { onNotification })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    // Simulate an incoming notification
    act(() => {
      capturedCallback!({
        notification_type: 'payment_received',
        notification: {
          payment_hash: 'hash123',
          type: 'incoming',
          state: 'settled',
          amount: 500000,
          fees_paid: 0,
          description: 'test payment',
          invoice: 'lnbc...',
          preimage: 'preimage123',
          created_at: 1700000000,
          settled_at: 1700000001,
          expires_at: null,
          metadata: null,
        },
      });
    });

    expect(onNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'payment_received',
      transaction: expect.objectContaining({
        id: 'hash123',
        amount: 500000,
      }),
    }));
  });

  it('refreshes balance on payment_received notification', async () => {
    let capturedCallback: (notification: unknown) => void;

    mockSubscribeNotifications.mockImplementation((callback: (notification: unknown) => void) => {
      capturedCallback = callback;
      return Promise.resolve(mockUnsubscribe);
    });

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    act(() => {
      capturedCallback!({
        notification_type: 'payment_received',
        notification: {
          payment_hash: 'hash456',
          type: 'incoming',
          state: 'settled',
          amount: 1000000,
          fees_paid: 0,
          description: '',
          invoice: 'lnbc...',
          preimage: 'preimage456',
          created_at: 1700000000,
          settled_at: 1700000001,
          expires_at: null,
          metadata: null,
        },
      });
    });

    expect(mockRefreshBalance).toHaveBeenCalled();
  });

  it('refreshes balance on payment_sent notification', async () => {
    let capturedCallback: (notification: unknown) => void;

    mockSubscribeNotifications.mockImplementation((callback: (notification: unknown) => void) => {
      capturedCallback = callback;
      return Promise.resolve(mockUnsubscribe);
    });

    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    act(() => {
      capturedCallback!({
        notification_type: 'payment_sent',
        notification: {
          payment_hash: 'hash789',
          type: 'outgoing',
          state: 'settled',
          amount: 2000000,
          fees_paid: 100,
          description: '',
          invoice: 'lnbc...',
          preimage: 'preimage789',
          created_at: 1700000000,
          settled_at: 1700000001,
          expires_at: null,
          metadata: null,
        },
      });
    });

    expect(mockRefreshBalance).toHaveBeenCalled();
  });
});
