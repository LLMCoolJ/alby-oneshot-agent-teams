import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useLightningAddressPayment } from '@/hooks/useLightningAddressPayment';
import { isLightningAddress, CONSTANTS } from '@/types';

interface PayToAddressFormProps {
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayToAddressForm({ onLog }: PayToAddressFormProps) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('1000');
  const [comment, setComment] = useState('');
  const {
    payToAddress,
    loading,
    error,
    addressInfo,
    fetchAddressInfo,
    result,
    reset,
  } = useLightningAddressPayment('alice');

  const handleAddressBlur = async () => {
    if (isLightningAddress(address)) {
      onLog(`Fetching LNURL data for ${address}...`, 'info');
      try {
        await fetchAddressInfo(address);
        onLog('LNURL data fetched successfully', 'success');
      } catch (err) {
        onLog(`Failed to fetch address info: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLightningAddress(address)) {
      onLog('Invalid Lightning Address format', 'error');
      return;
    }

    const amountSats = parseInt(amount, 10); // sats
    if (isNaN(amountSats) || amountSats < CONSTANTS.MIN_PAYMENT_SATS) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog(`Paying ${amountSats} sats to ${address}...`, 'info');

    try {
      const paymentResult = await payToAddress({
        address,
        amount: amountSats, // sats
        comment: comment || undefined,
      });
      onLog(`Payment successful! Preimage: ${paymentResult.preimage.slice(0, 16)}...`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
          data-testid="success-message"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Payment Successful!</span>
          </div>
          <div className="text-sm text-green-700">
            <p>Paid to: {address}</p>
            <p>Amount: {amount} sats</p>
          </div>
        </div>
        <Button variant="secondary" onClick={reset} className="w-full">
          Make Another Payment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Lightning Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onBlur={handleAddressBlur}
        placeholder="bob@testnet.getalby.com"
        error={!address || isLightningAddress(address) ? undefined : 'Invalid format'}
        data-testid="address-input"
      />

      {addressInfo && (
        <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Min:</span>
            <span>{addressInfo.min.toLocaleString()} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Max:</span>
            <span>{addressInfo.max.toLocaleString()} sats</span>
          </div>
          {addressInfo.description && (
            <div className="pt-1 border-t">
              <span className="text-slate-600">{addressInfo.description}</span>
            </div>
          )}
        </div>
      )}

      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={addressInfo?.min ?? CONSTANTS.MIN_PAYMENT_SATS}
        max={addressInfo?.max}
        placeholder="1000"
        required
        data-testid="amount-input"
      />

      <Input
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Thanks for the coffee!"
        hint={addressInfo?.commentAllowed ? `Up to ${addressInfo.commentAllowed} characters` : 'Comments not supported'}
        disabled={!addressInfo?.commentAllowed}
        data-testid="comment-input"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={!address || !amount}
        className="w-full"
        data-testid="submit-button"
      >
        Pay Lightning Address
      </Button>
    </form>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
