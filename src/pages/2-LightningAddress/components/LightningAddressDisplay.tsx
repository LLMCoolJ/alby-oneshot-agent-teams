import { CopyButton } from '@/components/ui';
import { useWallet } from '@/hooks';

export function LightningAddressDisplay() {
  const bobWallet = useWallet('bob');
  const lightningAddress = bobWallet.info?.lud16;

  if (!lightningAddress) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          No Lightning Address found for this wallet. The wallet may not support LNURL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          My Lightning Address
        </label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 p-3 bg-slate-50 rounded-lg font-mono text-sm"
            data-testid="address-display"
          >
            {lightningAddress}
          </div>
          <CopyButton value={lightningAddress} />
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">How it works</h4>
        <p className="text-xs text-blue-700">
          A Lightning Address works like an email. When someone pays it, the system
          automatically fetches payment details and creates an invoice on your behalf.
        </p>
      </div>
    </div>
  );
}
