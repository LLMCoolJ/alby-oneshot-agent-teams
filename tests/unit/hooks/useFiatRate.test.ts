import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFiatRate } from '@/hooks/useFiatRate';

vi.mock('@getalby/lightning-tools/fiat', () => ({
  getFiatValue: vi.fn().mockResolvedValue(42),
  getFormattedFiatValue: vi.fn().mockResolvedValue('$0.42'),
}));

describe('useFiatRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches fiat value for positive satoshi amount', async () => {
    const { result } = renderHook(() => useFiatRate(100));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fiatValue).toBe(42);
    expect(result.current.formattedFiat).toBe('$0.42');
    expect(result.current.error).toBeNull();
  });

  it('returns zero values for zero satoshi', async () => {
    const { result } = renderHook(() => useFiatRate(0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fiatValue).toBe(0);
    expect(result.current.formattedFiat).toBe('$0.00');
  });

  it('returns zero values for negative satoshi', async () => {
    const { result } = renderHook(() => useFiatRate(-10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fiatValue).toBe(0);
    expect(result.current.formattedFiat).toBe('$0.00');
  });

  it('passes correct params to getFiatValue', async () => {
    const { getFiatValue, getFormattedFiatValue } = await import('@getalby/lightning-tools/fiat');

    renderHook(() => useFiatRate(500, 'EUR'));

    await waitFor(() => {
      expect(getFiatValue).toHaveBeenCalledWith({ satoshi: 500, currency: 'EUR' });
      expect(getFormattedFiatValue).toHaveBeenCalledWith({
        satoshi: 500,
        currency: 'EUR',
        locale: 'en-US',
      });
    });
  });

  it('defaults currency to USD', async () => {
    const { getFiatValue } = await import('@getalby/lightning-tools/fiat');

    renderHook(() => useFiatRate(100));

    await waitFor(() => {
      expect(getFiatValue).toHaveBeenCalledWith({ satoshi: 100, currency: 'USD' });
    });
  });

  it('handles fetch error', async () => {
    const { getFiatValue } = await import('@getalby/lightning-tools/fiat');
    vi.mocked(getFiatValue).mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useFiatRate(100));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch fiat rate');
    consoleSpy.mockRestore();
  });

  it('starts in loading state for positive amounts', () => {
    const { result } = renderHook(() => useFiatRate(100));
    expect(result.current.loading).toBe(true);
  });
});
