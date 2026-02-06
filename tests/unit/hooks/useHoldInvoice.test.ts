import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoldInvoice } from '@/hooks/useHoldInvoice';

// Use vi.hoisted so mocks are available when vi.mock factory runs (hoisted)
const {
  mockMakeHoldInvoice,
  mockSettleHoldInvoice,
  mockCancelHoldInvoice,
  mockUseNWCClient,
} = vi.hoisted(() => ({
  mockMakeHoldInvoice: vi.fn().mockResolvedValue({ invoice: 'lnbc...' }),
  mockSettleHoldInvoice: vi.fn().mockResolvedValue({}),
  mockCancelHoldInvoice: vi.fn().mockResolvedValue({}),
  mockUseNWCClient: vi.fn(),
}));

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: mockUseNWCClient,
}));

describe('useHoldInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNWCClient.mockReturnValue({
      makeHoldInvoice: mockMakeHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
    });
  });

  describe('createHoldInvoice', () => {
    it('creates hold invoice with generated preimage', async () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      let holdInvoice: Awaited<ReturnType<typeof result.current.createHoldInvoice>> | undefined;
      await act(async () => {
        holdInvoice = await result.current.createHoldInvoice({
          amount: 1000000,
          description: 'Test',
        });
      });

      expect(holdInvoice).toHaveProperty('preimage');
      expect(holdInvoice).toHaveProperty('paymentHash');
      expect(holdInvoice?.state).toBe('created');
    });

    it('returns invoice string from client response', async () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      let holdInvoice: Awaited<ReturnType<typeof result.current.createHoldInvoice>> | undefined;
      await act(async () => {
        holdInvoice = await result.current.createHoldInvoice({
          amount: 5000000,
          description: 'Test invoice',
        });
      });

      expect(holdInvoice?.invoice).toBe('lnbc...');
      expect(holdInvoice?.amount).toBe(5000000);
    });

    it('passes amount, description, and payment_hash to client', async () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        await result.current.createHoldInvoice({
          amount: 1000000,
          description: 'Test',
        });
      });

      expect(mockMakeHoldInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000000,
          description: 'Test',
          payment_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        })
      );
    });

    it('throws when wallet not connected', async () => {
      mockUseNWCClient.mockReturnValue(null);
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await expect(
        act(async () => {
          await result.current.createHoldInvoice({
            amount: 1000000,
            description: 'Test',
          });
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('sets error and re-throws on creation failure', async () => {
      mockMakeHoldInvoice.mockRejectedValue(new Error('Invoice creation failed'));
      const { result } = renderHook(() => useHoldInvoice('bob'));

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.createHoldInvoice({
            amount: 1000000,
            description: 'Test',
          });
        } catch (e) {
          caughtError = e as Error;
        }
      });

      expect(caughtError?.message).toBe('Invoice creation failed');
      expect(result.current.error).toBe('Invoice creation failed');
      expect(result.current.loading).toBe(false);
    });

    it('sets generic error for non-Error thrown values', async () => {
      mockMakeHoldInvoice.mockRejectedValue('something broke');
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.createHoldInvoice({
            amount: 1000000,
            description: 'Test',
          });
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('Failed to create hold invoice');
    });
  });

  describe('settleHoldInvoice', () => {
    it('settles hold invoice with preimage', async () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        await result.current.settleHoldInvoice('preimage123');
      });

      expect(mockSettleHoldInvoice).toHaveBeenCalledWith({ preimage: 'preimage123' });
    });

    it('throws when wallet not connected', async () => {
      mockUseNWCClient.mockReturnValue(null);
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await expect(
        act(async () => {
          await result.current.settleHoldInvoice('preimage123');
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('sets error on settle failure', async () => {
      mockSettleHoldInvoice.mockRejectedValue(new Error('Settle failed'));
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.settleHoldInvoice('preimage123');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('Settle failed');
      expect(result.current.loading).toBe(false);
    });

    it('sets generic error for non-Error thrown values on settle', async () => {
      mockSettleHoldInvoice.mockRejectedValue('settle broke');
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.settleHoldInvoice('preimage123');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('Failed to settle');
    });
  });

  describe('cancelHoldInvoice', () => {
    it('cancels hold invoice with payment hash', async () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        await result.current.cancelHoldInvoice('hash123');
      });

      expect(mockCancelHoldInvoice).toHaveBeenCalledWith({ payment_hash: 'hash123' });
    });

    it('throws when wallet not connected', async () => {
      mockUseNWCClient.mockReturnValue(null);
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await expect(
        act(async () => {
          await result.current.cancelHoldInvoice('hash123');
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('sets error on cancel failure', async () => {
      mockCancelHoldInvoice.mockRejectedValue(new Error('Cancel failed'));
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.cancelHoldInvoice('hash123');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('Cancel failed');
      expect(result.current.loading).toBe(false);
    });

    it('sets generic error for non-Error thrown values on cancel', async () => {
      mockCancelHoldInvoice.mockRejectedValue('cancel broke');
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.cancelHoldInvoice('hash123');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('Failed to cancel');
    });
  });

  describe('initial state', () => {
    it('starts with loading false and error null', () => {
      const { result } = renderHook(() => useHoldInvoice('bob'));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error reset', () => {
    it('clears error on next successful operation', async () => {
      mockMakeHoldInvoice.mockRejectedValueOnce(new Error('First failure'));
      const { result } = renderHook(() => useHoldInvoice('bob'));

      await act(async () => {
        try {
          await result.current.createHoldInvoice({ amount: 1000, description: 'Test' });
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('First failure');

      // Next call should clear the error
      mockMakeHoldInvoice.mockResolvedValueOnce({ invoice: 'lnbc...' });
      await act(async () => {
        await result.current.createHoldInvoice({ amount: 1000, description: 'Test' });
      });

      expect(result.current.error).toBeNull();
    });
  });
});
