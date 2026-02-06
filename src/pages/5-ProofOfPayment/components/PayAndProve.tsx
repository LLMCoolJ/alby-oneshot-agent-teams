import { useState } from 'react';
import { Button, Badge, CopyButton } from '@/components/ui';
import { usePayment } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface PayAndProveProps {
  invoice: Nip47Transaction;
  onPreimageReceived: (preimage: string) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayAndProve({ invoice, onPreimageReceived, onLog }: PayAndProveProps) {
  const [preimage, setPreimage] = useState<string | null>(null);
  const { payInvoice, loading, error } = usePayment('alice');
  const amountSats = Math.floor(invoice.amount / CONSTANTS.MILLISATS_PER_SAT); // sats

  const handlePay = async () => {
    onLog('Paying invoice...', 'info');
    try {
      const result = await payInvoice(invoice.invoice);
      setPreimage(result.preimage);
      onPreimageReceived(result.preimage);
      onLog(`Payment successful! Received preimage: ${result.preimage.slice(0, 16)}...`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Invoice summary */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Amount:</span>
          <span className="font-medium">{amountSats.toLocaleString()} sats</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-600">Payment Hash:</span>
          <span className="font-mono text-xs">{invoice.payment_hash.slice(0, 20)}...</span>
        </div>
      </div>

      {!preimage ? (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handlePay} loading={loading} className="w-full" data-testid="pay-invoice">
            Pay Invoice
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="success">Payment Complete</Badge>
            </div>
            <p className="text-sm text-green-700 mb-2">
              You received the preimage as proof of payment:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white rounded border text-xs font-mono break-all" data-testid="preimage-value">
                {preimage}
              </code>
              <CopyButton value={preimage} />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>This preimage is your proof.</strong> Anyone can verify
              that SHA-256(preimage) equals the payment hash in the invoice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
