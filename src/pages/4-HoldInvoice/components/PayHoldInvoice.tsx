import { useState } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import { usePayment } from '@/hooks';
import type { HoldInvoiceState } from '@/types';

interface PayHoldInvoiceProps {
  invoice: string;
  state: HoldInvoiceState;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayHoldInvoice({ invoice, state, onLog }: PayHoldInvoiceProps) {
  const [inputInvoice, setInputInvoice] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const { payInvoice, loading, error } = usePayment('alice');

  const handlePay = async () => {
    const invoiceToPay = inputInvoice || invoice;
    if (!invoiceToPay) {
      onLog('Please enter an invoice', 'error');
      return;
    }

    setIsPaying(true);
    onLog('Paying hold invoice...', 'info');

    try {
      // Note: For hold invoices, payInvoice will hang until settled/cancelled
      // We show a pending state in the UI
      await payInvoice(invoiceToPay);
      setHasPaid(true);
      onLog('Payment completed!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      // Check if it's a cancellation
      if (message.includes('cancel')) {
        onLog('Payment was cancelled - funds refunded', 'info');
      } else {
        onLog(`Payment failed: ${message}`, 'error');
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Payment Status:</span>
        {isPaying ? (
          <Badge variant="warning">Pending (Held)</Badge>
        ) : hasPaid ? (
          <Badge variant="success">Completed</Badge>
        ) : state === 'cancelled' ? (
          <Badge variant="error">Cancelled</Badge>
        ) : (
          <Badge variant="default">Not Paid</Badge>
        )}
      </div>

      {!hasPaid && state !== 'cancelled' && (
        <>
          <Input
            label="Hold Invoice"
            value={inputInvoice}
            onChange={(e) => setInputInvoice(e.target.value)}
            placeholder="Paste the hold invoice..."
            data-testid="pay-hold-invoice-input"
          />

          <Button
            onClick={handlePay}
            loading={loading || isPaying}
            disabled={hasPaid}
            className="w-full"
            data-testid="pay-hold-invoice-button"
          >
            {isPaying ? 'Waiting for settle/cancel...' : 'Pay Hold Invoice'}
          </Button>
        </>
      )}

      {isPaying && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Payment is held.</strong> Your funds are locked until
            the recipient settles or cancels the invoice.
          </p>
        </div>
      )}

      {error && !isPaying && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
