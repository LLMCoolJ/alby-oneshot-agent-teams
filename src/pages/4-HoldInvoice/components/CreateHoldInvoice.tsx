import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useHoldInvoice } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { HoldInvoice } from '@/types';

interface CreateHoldInvoiceProps {
  onCreated: (invoice: HoldInvoice) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function CreateHoldInvoice({ onCreated, onLog }: CreateHoldInvoiceProps) {
  const [amount, setAmount] = useState('5000');
  const [description, setDescription] = useState('');
  const { createHoldInvoice, loading, error } = useHoldInvoice('bob');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < CONSTANTS.MIN_PAYMENT_SATS) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog('Generating preimage and payment hash...', 'info');

    try {
      const holdInvoice = await createHoldInvoice({
        amount: amountSats * CONSTANTS.MILLISATS_PER_SAT,
        description: description || 'Hold Invoice Demo',
      });
      onCreated(holdInvoice);
    } catch (err) {
      onLog(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-hold-invoice-form">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Hold invoices allow conditional payments.
          You control when to release or refund the funds.
        </p>
      </div>

      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={CONSTANTS.MIN_PAYMENT_SATS}
        placeholder="5000"
        required
        data-testid="hold-invoice-amount"
      />

      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Escrow for..."
        data-testid="hold-invoice-description"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full" data-testid="create-hold-invoice-button">
        Create Hold Invoice
      </Button>
    </form>
  );
}
