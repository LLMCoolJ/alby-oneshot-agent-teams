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
          results.set(sats, '\u2014');
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
              data-testid={`reference-item-${sats}`}
            >
              <span className="font-medium">
                {'\u26A1'} {formatSats(sats)}
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
