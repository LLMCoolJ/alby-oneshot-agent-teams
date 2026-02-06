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
        {sats?.toLocaleString() ?? '\u2014'} sats
      </div>
      {loading ? (
        <div className="text-lg text-slate-500 animate-pulse">Loading...</div>
      ) : (
        <div className="text-lg text-slate-600">
          ≈ {formattedFiat ?? '\u2014'}
        </div>
      )}
    </div>
  );
}
