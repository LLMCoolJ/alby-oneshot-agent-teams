import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useLightningAddressPayment } from '@/hooks';

interface QuickPayButtonsProps {
  recipientAddress?: string;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const QUICK_AMOUNTS = [100, 500, 1000];

export function QuickPayButtons({ recipientAddress, onLog }: QuickPayButtonsProps) {
  const [address, setAddress] = useState(recipientAddress || '');
  const [sendingAmount, setSendingAmount] = useState<number | null>(null);
  const { payToAddress, loading, error } = useLightningAddressPayment('alice');

  const handleQuickPay = async (amount: number) => {
    if (!address) {
      onLog('Please enter a Lightning Address', 'error');
      return;
    }

    setSendingAmount(amount);
    onLog(`Sending ${amount} sats to ${address}...`, 'info');

    try {
      await payToAddress({ address, amount });
      onLog(`Sent ${amount} sats successfully!`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setSendingAmount(null);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Recipient Lightning Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="bob@testnet.getalby.com"
        hint="Enter Bob's Lightning Address to send payments"
        data-testid="address-input"
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Quick Pay
        </label>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              onClick={() => handleQuickPay(amount)}
              loading={sendingAmount === amount}
              disabled={loading || !address}
              data-testid={`quick-pay-${amount}`}
            >
              {amount} sats
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Try it out!</h4>
        <p className="text-xs text-blue-700">
          Click the buttons above to send payments to Bob. If Bob is subscribed
          to notifications, they'll see the payments appear in real-time.
        </p>
      </div>
    </div>
  );
}
