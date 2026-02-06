import { useFiatRate } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { FiatCurrency } from '@/types';

interface CurrencySelectorProps {
  currency: FiatCurrency;
  onCurrencyChange: (currency: FiatCurrency) => void;
}

const CURRENCIES: { value: FiatCurrency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '\u20AC' },
  { value: 'GBP', label: 'British Pound', symbol: '\u00A3' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '\u00A5' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
];

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  const { fiatValue: btcRate, loading } = useFiatRate(CONSTANTS.SATS_PER_BTC, currency);
  const satRate = btcRate ? btcRate / CONSTANTS.SATS_PER_BTC : null;

  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold mb-4">Currency Settings</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Currency selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Display Currency
          </label>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as FiatCurrency)}
            className="input-field"
            data-testid="currency-select"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.symbol} {c.label} ({c.value})
              </option>
            ))}
          </select>
        </div>

        {/* Current rate display */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">Current Exchange Rate</div>
          {loading ? (
            <div className="animate-pulse text-slate-400">Loading...</div>
          ) : btcRate ? (
            <>
              <div className="font-medium">
                1 BTC = {btcRate.toLocaleString(undefined, {
                  style: 'currency',
                  currency,
                })}
              </div>
              <div className="text-sm text-slate-500">
                1 sat ≈ {satRate?.toFixed(6)} {currency}
              </div>
            </>
          ) : (
            <div className="text-slate-400">Unable to fetch rate</div>
          )}
        </div>
      </div>
    </div>
  );
}
