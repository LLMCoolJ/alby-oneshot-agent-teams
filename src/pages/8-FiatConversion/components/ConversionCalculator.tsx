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
          data-testid="sats-input"
        />
        <span className="text-slate-400">{'\u2192'}</span>
        <div className="flex-1 p-2 bg-white rounded-lg border text-center" data-testid="sats-to-fiat-result">
          {satsToFiat ?? '\u2014'}
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
            data-testid="fiat-input"
          />
        </div>
        <span className="text-slate-400">{'\u2192'}</span>
        <div className="flex-1 p-2 bg-white rounded-lg border text-center" data-testid="fiat-to-sats-result">
          {fiatToSats !== null ? `${fiatToSats.toLocaleString()} sats` : '\u2014'}
        </div>
      </div>
    </div>
  );
}

function getCurrencySymbol(currency: FiatCurrency): string {
  const symbols: Record<FiatCurrency, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '\u00A5',
    CHF: 'Fr',
  };
  return symbols[currency] || currency;
}
