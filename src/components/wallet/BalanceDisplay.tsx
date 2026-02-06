import { Spinner } from '@/components/ui';
import { useFiatRate } from '@/hooks';

interface BalanceDisplayProps {
  sats: number | null;
  loading?: boolean;
  showFiat?: boolean;
  currency?: string;
}

export function BalanceDisplay({
  sats,
  loading = false,
  showFiat = true,
  currency = 'USD',
}: BalanceDisplayProps) {
  const { formattedFiat } = useFiatRate(sats ?? 0, currency);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-slate-500">Loading balance...</span>
      </div>
    );
  }

  if (sats === null) {
    return <span className="text-slate-500">--</span>;
  }

  const formattedSats = sats.toLocaleString();

  return (
    <div className="space-y-1">
      <div data-testid="balance-sats" className="text-2xl font-bold text-slate-900">
        {formattedSats} <span className="text-lg font-normal text-slate-500">sats</span>
      </div>
      {showFiat && formattedFiat && (
        <div data-testid="balance-fiat" className="text-sm text-slate-500">
          {formattedFiat}
        </div>
      )}
    </div>
  );
}
