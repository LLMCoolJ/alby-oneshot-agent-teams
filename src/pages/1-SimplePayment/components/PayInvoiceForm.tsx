import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { usePayment } from '@/hooks';
import { decodeInvoice } from '@getalby/lightning-tools/bolt11';
import type { PaymentResult } from '@/types';

interface PayInvoiceFormProps {
  onPaymentSuccess: (result: PaymentResult) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  disabled?: boolean;
}

export function PayInvoiceForm({ onPaymentSuccess, onLog, disabled }: PayInvoiceFormProps) {
  const [invoice, setInvoice] = useState('');
  const [decodedInfo, setDecodedInfo] = useState<{
    amount: number; // sats
    description: string | null;
  } | null>(null);
  const { payInvoice, loading, error } = usePayment('alice');

  // Decode invoice when pasted
  useEffect(() => {
    if (!invoice) {
      setDecodedInfo(null);
      return;
    }

    try {
      const decoded = decodeInvoice(invoice);
      if (decoded) {
        setDecodedInfo({
          amount: decoded.satoshi,
          description: decoded.description ?? null,
        });
      }
    } catch {
      setDecodedInfo(null);
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice.trim()) {
      onLog('Please enter an invoice', 'error');
      return;
    }

    onLog('Paying invoice...', 'info');

    try {
      const result = await payInvoice(invoice);
      onPaymentSuccess(result);
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="pay-invoice-form">
      <Input
        label="BOLT-11 Invoice"
        value={invoice}
        onChange={(e) => setInvoice(e.target.value)}
        placeholder="lnbc..."
        disabled={disabled}
        data-testid="pay-invoice-input"
      />

      {decodedInfo && (
        <div className="p-3 bg-slate-50 rounded-lg text-sm" data-testid="decoded-invoice-info">
          <div className="flex justify-between">
            <span className="text-slate-600">Amount:</span>
            <span className="font-medium">{decodedInfo.amount.toLocaleString()} sats</span>
          </div>
          {decodedInfo.description && (
            <div className="flex justify-between mt-1">
              <span className="text-slate-600">Description:</span>
              <span className="font-medium truncate ml-2">{decodedInfo.description}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={disabled || !invoice}
        className="w-full"
        data-testid="pay-invoice-button"
      >
        Pay Invoice
      </Button>
    </form>
  );
}
