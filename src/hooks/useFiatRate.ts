import { useState, useEffect } from 'react';
import { getFiatValue, getFormattedFiatValue } from '@getalby/lightning-tools/fiat';

interface FiatRateResult {
  fiatValue: number | null;
  formattedFiat: string | null;
  loading: boolean;
  error: string | null;
}

export function useFiatRate(
  satoshi: number,
  currency: string = 'USD'
): FiatRateResult {
  const [fiatValue, setFiatValue] = useState<number | null>(null);
  const [formattedFiat, setFormattedFiat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (satoshi <= 0) {
      setFiatValue(0);
      setFormattedFiat('$0.00');
      setLoading(false);
      return;
    }

    const fetchRate = async () => {
      try {
        setLoading(true);

        const value = await getFiatValue({ satoshi, currency });
        const formatted = await getFormattedFiatValue({
          satoshi,
          currency,
          locale: 'en-US',
        });

        setFiatValue(value);
        setFormattedFiat(formatted);
        setError(null);
      } catch (err) {
        setError('Failed to fetch fiat rate');
        console.error('Fiat rate error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, [satoshi, currency]);

  return { fiatValue, formattedFiat, loading, error };
}
