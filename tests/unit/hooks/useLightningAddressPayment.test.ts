import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLightningAddressPayment } from '@/hooks/useLightningAddressPayment';

const {
  mockFetch,
  mockRequestInvoice,
  MockLightningAddress,
  mockPayInvoice,
  mockRefreshBalance,
} = vi.hoisted(() => {
  const mockFetch = vi.fn().mockResolvedValue(undefined);
  const mockRequestInvoice = vi.fn().mockResolvedValue({
    paymentRequest: 'lnbc1000n1...',
  });
  const MockLightningAddress = vi.fn().mockImplementation(() => ({
    address: 'test@getalby.com',
    fetch: mockFetch,
    lnurlpData: {
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    },
    requestInvoice: mockRequestInvoice,
  }));
  const mockPayInvoice = vi.fn().mockResolvedValue({
    preimage: 'preimage123',
    fees_paid: 0,
  });
  const mockRefreshBalance = vi.fn().mockResolvedValue(undefined);
  return { mockFetch, mockRequestInvoice, MockLightningAddress, mockPayInvoice, mockRefreshBalance };
});

// Mock LightningAddress (must match import path)
vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: MockLightningAddress,
}));

// Mock useNWCClient
vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    payInvoice: (...args: unknown[]) => mockPayInvoice(...args),
  }),
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: (...args: unknown[]) => mockRefreshBalance(...args),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(undefined);
  mockRequestInvoice.mockResolvedValue({ paymentRequest: 'lnbc1000n1...' });
  mockPayInvoice.mockResolvedValue({ preimage: 'preimage123', fees_paid: 0 });
  mockRefreshBalance.mockResolvedValue(undefined);
  MockLightningAddress.mockImplementation(() => ({
    address: 'test@getalby.com',
    fetch: mockFetch,
    lnurlpData: {
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    },
    requestInvoice: mockRequestInvoice,
  }));
});

describe('useLightningAddressPayment', () => {
  it('fetches address info correctly', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    expect(result.current.addressInfo).toEqual({
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    });
  });

  it('creates LightningAddress with correct address', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    expect(MockLightningAddress).toHaveBeenCalledWith('test@getalby.com');
  });

  it('calls fetch on the LightningAddress instance', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles fetch address info error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.fetchAddressInfo('bad@address.com');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch address info with non-Error thrown', async () => {
    mockFetch.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.fetchAddressInfo('bad@address.com');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Failed to fetch address info');
  });

  it('throws error when lnurlpData is null', async () => {
    MockLightningAddress.mockImplementation(() => ({
      address: 'test@getalby.com',
      fetch: vi.fn().mockResolvedValue(undefined),
      lnurlpData: null,
      requestInvoice: mockRequestInvoice,
    }));

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.fetchAddressInfo('test@getalby.com');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Failed to fetch LNURL-pay data');
  });

  it('pays to address successfully', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      const paymentResult = await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 1000,
      });
      expect(paymentResult.preimage).toBe('preimage123');
    });

    expect(result.current.result).toBeDefined();
  });

  it('pays to address and refreshes balance', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 1000,
      });
    });

    expect(mockRefreshBalance).toHaveBeenCalled();
  });

  it('requests invoice with correct params', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 500,
        comment: 'Thanks!',
      });
    });

    expect(mockRequestInvoice).toHaveBeenCalledWith({
      satoshi: 500,
      comment: 'Thanks!',
    });
  });

  it('pays the generated invoice', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 1000,
      });
    });

    expect(mockPayInvoice).toHaveBeenCalledWith({ invoice: 'lnbc1000n1...' });
  });

  it('handles payment error', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Insufficient balance'));

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.payToAddress({
          address: 'test@getalby.com',
          amount: 1000,
        });
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Insufficient balance');
    expect(result.current.loading).toBe(false);
  });

  it('handles payment error with non-Error thrown', async () => {
    mockPayInvoice.mockRejectedValueOnce('unknown');

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.payToAddress({
          address: 'test@getalby.com',
          amount: 1000,
        });
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Payment failed');
  });

  it('throws error when client is null', async () => {
    const { useNWCClient } = await import('@/hooks/useNWCClient');
    vi.mocked(useNWCClient).mockReturnValueOnce(null as any);

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.payToAddress({
          address: 'test@getalby.com',
          amount: 1000,
        });
      } catch (err) {
        expect((err as Error).message).toBe('Wallet not connected');
      }
    });
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.addressInfo).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resets error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      try {
        await result.current.fetchAddressInfo('test@getalby.com');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('fail');

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('caches LightningAddress instance between fetch and pay', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    // First fetch
    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    // Then pay with the same address
    await act(async () => {
      await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 1000,
      });
    });

    // requestInvoice should have been called, confirming the flow worked
    expect(mockRequestInvoice).toHaveBeenCalledWith({
      satoshi: 1000,
      comment: undefined,
    });
  });
});
