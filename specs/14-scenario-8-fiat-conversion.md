# Specification 14: Scenario 8 - Fiat Conversion

## Purpose

Display all amounts in both satoshis and fiat currency (USD, EUR, etc.) with real-time conversion rates.

## Dependencies

- [03-shared-types.md](./03-shared-types.md) - FiatCurrency, FiatPreferences types
- [05-wallet-context.md](./05-wallet-context.md) - useFiatRate hook

## User Story

> As a user new to Bitcoin, I want to see fiat equivalents of sats amounts so I can understand the value in familiar terms.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Fiat Conversion Demo                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Currency Settings:                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Display Currency: [USD ▼]                                       │   │
│  │  Current Rate: 1 BTC = $42,000                                  │   │
│  │  1 sat ≈ $0.00042                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────────┐    ┌────────────────────────────┐      │
│  │  Alice's Wallet            │    │  Bob's Wallet              │      │
│  │                            │    │                            │      │
│  │  Balance:                  │    │  Balance:                  │      │
│  │  250,000 sats             │    │  150,000 sats             │      │
│  │  ≈ $105.00                 │    │  ≈ $63.00                  │      │
│  │                            │    │                            │      │
│  │  Enter sats:               │    │  Enter sats:               │      │
│  │  [___________]  →  $0.00   │    │  [___________]  →  $0.00   │      │
│  │                            │    │                            │      │
│  │  Enter fiat:               │    │  Enter fiat:               │      │
│  │  $[__________]  →  0 sats  │    │  $[__________]  →  0 sats  │      │
│  │                            │    │                            │      │
│  └────────────────────────────┘    └────────────────────────────┘      │
│                                                                          │
│  Quick Reference:                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Common Amounts:                                                   │ │
│  │                                                                    │ │
│  │  ⚡ 1 sat      = $0.00042                                         │ │
│  │  ⚡ 100 sats   = $0.042                                           │ │
│  │  ⚡ 1,000 sats = $0.42                                            │ │
│  │  ⚡ 10K sats   = $4.20                                            │ │
│  │  ⚡ 100K sats  = $42.00                                           │ │
│  │  ⚡ 1M sats    = $420.00                                          │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/8-FiatConversion/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { CurrencySelector } from './components/CurrencySelector';
import { ConversionCalculator } from './components/ConversionCalculator';
import { QuickReference } from './components/QuickReference';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet, useBalance, useFiatRate } from '@/hooks';
import type { FiatCurrency } from '@/types';

export default function FiatConversionPage() {
  const [currency, setCurrency] = useState<FiatCurrency>('USD');
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');
  const { sats: aliceSats } = useBalance('alice');
  const { sats: bobSats } = useBalance('bob');

  const handleCurrencyChange = (newCurrency: FiatCurrency) => {
    setCurrency(newCurrency);
    addLog(`Currency changed to ${newCurrency}`, 'info');
  };

  return (
    <ScenarioPage
      title="Fiat Conversion"
      description="See Lightning amounts in both satoshis and fiat currency with real-time exchange rates."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <div className="space-y-4">
            <BalanceWithFiat sats={aliceSats} currency={currency} />
            <ConversionCalculator currency={currency} />
          </div>
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <div className="space-y-4">
            <BalanceWithFiat sats={bobSats} currency={currency} />
            <ConversionCalculator currency={currency} />
          </div>
        )
      }
      logs={entries}
    >
      {/* Currency settings */}
      <CurrencySelector
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
      />

      {/* Quick reference */}
      <QuickReference currency={currency} />
    </ScenarioPage>
  );
}

function BalanceWithFiat({ sats, currency }: { sats: number | null; currency: FiatCurrency }) {
  const { formattedFiat, loading } = useFiatRate(sats ?? 0, currency);

  return (
    <div className="text-center py-4">
      <div className="text-3xl font-bold text-slate-900">
        {sats?.toLocaleString() ?? '—'} sats
      </div>
      {loading ? (
        <div className="text-lg text-slate-500 animate-pulse">Loading...</div>
      ) : (
        <div className="text-lg text-slate-600">
          ≈ {formattedFiat ?? '—'}
        </div>
      )}
    </div>
  );
}
```

---

## Components

### CurrencySelector

**File**: `src/pages/8-FiatConversion/components/CurrencySelector.tsx`

```typescript
import { useFiatRate } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { FiatCurrency } from '@/types';

interface CurrencySelectorProps {
  currency: FiatCurrency;
  onCurrencyChange: (currency: FiatCurrency) => void;
}

const CURRENCIES: { value: FiatCurrency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
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
```

### ConversionCalculator

**File**: `src/pages/8-FiatConversion/components/ConversionCalculator.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import { getFiatValue, getSatoshiValue } from '@getalby/lightning-tools/fiat';
import type { FiatCurrency } from '@/types';

interface ConversionCalculatorProps {
  currency: FiatCurrency;
}

export function ConversionCalculator({ currency }: ConversionCalculatorProps) {
  const [satsInput, setSatsInput] = useState('');
  const [fiatInput, setFiatInput] = useState('');
  const [satsToFiat, setSatsToFiat] = useState<string | null>(null);
  const [fiatToSats, setFiatToSats] = useState<number | null>(null);

  // Convert sats to fiat
  useEffect(() => {
    const convertSatsToFiat = async () => {
      const sats = parseInt(satsInput, 10);
      if (isNaN(sats) || sats <= 0) {
        setSatsToFiat(null);
        return;
      }

      try {
        const fiatValue = await getFiatValue({ satoshi: sats, currency });
        setSatsToFiat(fiatValue.toLocaleString(undefined, {
          style: 'currency',
          currency,
        }));
      } catch {
        setSatsToFiat(null);
      }
    };

    const timeout = setTimeout(convertSatsToFiat, 300);
    return () => clearTimeout(timeout);
  }, [satsInput, currency]);

  // Convert fiat to sats
  useEffect(() => {
    const convertFiatToSats = async () => {
      const fiat = parseFloat(fiatInput);
      if (isNaN(fiat) || fiat <= 0) {
        setFiatToSats(null);
        return;
      }

      try {
        const sats = await getSatoshiValue({ amount: fiat, currency });
        setFiatToSats(Math.round(sats));
      } catch {
        setFiatToSats(null);
      }
    };

    const timeout = setTimeout(convertFiatToSats, 300);
    return () => clearTimeout(timeout);
  }, [fiatInput, currency]);

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
      <h4 className="font-medium text-slate-900">Conversion Calculator</h4>

      {/* Sats to Fiat */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={satsInput}
          onChange={(e) => setSatsInput(e.target.value)}
          placeholder="Enter sats"
          className="flex-1"
        />
        <span className="text-slate-400">→</span>
        <div className="flex-1 p-2 bg-white rounded-lg border text-center">
          {satsToFiat ?? '—'}
        </div>
      </div>

      {/* Fiat to Sats */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {getCurrencySymbol(currency)}
          </span>
          <Input
            type="number"
            value={fiatInput}
            onChange={(e) => setFiatInput(e.target.value)}
            placeholder="Enter amount"
            className="pl-8"
          />
        </div>
        <span className="text-slate-400">→</span>
        <div className="flex-1 p-2 bg-white rounded-lg border text-center">
          {fiatToSats !== null ? `${fiatToSats.toLocaleString()} sats` : '—'}
        </div>
      </div>
    </div>
  );
}

function getCurrencySymbol(currency: FiatCurrency): string {
  const symbols: Record<FiatCurrency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'Fr',
  };
  return symbols[currency] || currency;
}
```

### QuickReference

**File**: `src/pages/8-FiatConversion/components/QuickReference.tsx`

```typescript
import { useEffect, useState } from 'react';
import { getFiatValue } from '@getalby/lightning-tools/fiat';
import type { FiatCurrency } from '@/types';

interface QuickReferenceProps {
  currency: FiatCurrency;
}

const REFERENCE_AMOUNTS = [1, 100, 1000, 10000, 100000, 1000000];

export function QuickReference({ currency }: QuickReferenceProps) {
  const [conversions, setConversions] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversions = async () => {
      setLoading(true);
      const results = new Map<number, string>();

      for (const sats of REFERENCE_AMOUNTS) {
        try {
          const fiat = await getFiatValue({ satoshi: sats, currency });
          results.set(sats, fiat.toLocaleString(undefined, {
            style: 'currency',
            currency,
            minimumFractionDigits: sats < 100 ? 6 : 2,
            maximumFractionDigits: sats < 100 ? 6 : 2,
          }));
        } catch {
          results.set(sats, '—');
        }
      }

      setConversions(results);
      setLoading(false);
    };

    fetchConversions();
  }, [currency]);

  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>

      {loading ? (
        <div className="animate-pulse text-slate-400 text-center py-4">
          Loading conversions...
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {REFERENCE_AMOUNTS.map((sats) => (
            <div
              key={sats}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <span className="font-medium">
                ⚡ {formatSats(sats)}
              </span>
              <span className="text-slate-600">
                = {conversions.get(sats)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Educational note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>Did you know?</strong> A satoshi (sat) is the smallest unit of Bitcoin.
        There are 100,000,000 sats in 1 BTC.
      </div>
    </div>
  );
}

function formatSats(sats: number): string {
  if (sats >= 1000000) return `${sats / 1000000}M sats`;
  if (sats >= 1000) return `${sats / 1000}K sats`;
  return `${sats} sat${sats !== 1 ? 's' : ''}`;
}
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `getFiatValue({ satoshi, currency })` | Convert sats to fiat | lightning-tools |
| `getSatoshiValue({ amount, currency })` | Convert fiat to sats | lightning-tools |
| `getFormattedFiatValue({ satoshi, currency, locale })` | Get formatted fiat string | lightning-tools |
| `getFiatBtcRate(currency)` | Get current BTC rate | lightning-tools |

---

## Test Requirements (TDD)

**File**: `tests/unit/pages/FiatConversion.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionCalculator } from '@/pages/8-FiatConversion/components/ConversionCalculator';
import { QuickReference } from '@/pages/8-FiatConversion/components/QuickReference';

vi.mock('@getalby/lightning-tools/fiat', () => ({
  getFiatValue: vi.fn().mockResolvedValue(42),
  getSatoshiValue: vi.fn().mockResolvedValue(1000),
}));

describe('ConversionCalculator', () => {
  it('converts sats to fiat', async () => {
    render(<ConversionCalculator currency="USD" />);

    const input = screen.getByPlaceholderText(/enter sats/i);
    await userEvent.type(input, '100000');

    await waitFor(() => {
      expect(screen.getByText(/\$42/)).toBeInTheDocument();
    });
  });

  it('converts fiat to sats', async () => {
    render(<ConversionCalculator currency="USD" />);

    const input = screen.getByPlaceholderText(/enter amount/i);
    await userEvent.type(input, '100');

    await waitFor(() => {
      expect(screen.getByText(/1,000 sats/)).toBeInTheDocument();
    });
  });
});

describe('QuickReference', () => {
  it('shows reference amounts', async () => {
    render(<QuickReference currency="USD" />);

    await waitFor(() => {
      expect(screen.getByText(/1 sat/)).toBeInTheDocument();
      expect(screen.getByText(/1K sats/)).toBeInTheDocument();
      expect(screen.getByText(/1M sats/)).toBeInTheDocument();
    });
  });
});
```

---

## File Structure

```
src/pages/8-FiatConversion/
├── index.tsx                  # Main page component
└── components/
    ├── CurrencySelector.tsx   # Currency dropdown and rate display
    ├── ConversionCalculator.tsx # Sats/fiat conversion inputs
    └── QuickReference.tsx     # Common amounts reference table
```

---

## Acceptance Criteria

- [ ] Currency selector changes display currency
- [ ] Current BTC rate is displayed
- [ ] Wallet balances show fiat equivalent
- [ ] Sats to fiat conversion works in real-time
- [ ] Fiat to sats conversion works in real-time
- [ ] Quick reference table loads
- [ ] All supported currencies work
- [ ] Loading states display correctly
- [ ] All tests pass

## Related Specifications

- [05-wallet-context.md](./05-wallet-context.md) - useFiatRate hook
- [04-shared-components.md](./04-shared-components.md) - BalanceDisplay with fiat
