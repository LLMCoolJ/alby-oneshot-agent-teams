import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useInvoice } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface CreateInvoiceFormProps {
  onInvoiceCreated: (invoice: Nip47Transaction) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function CreateInvoiceForm({ onInvoiceCreated, onLog }: CreateInvoiceFormProps) {
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('');
  const { createInvoice, loading, error } = useInvoice('bob');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < CONSTANTS.MIN_PAYMENT_SATS) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog('Creating invoice...', 'info');

    try {
      const invoice = await createInvoice({
        amount: amountSats * CONSTANTS.MILLISATS_PER_SAT, // millisats
        description: description || 'Lightning Demo Payment',
      });
      onInvoiceCreated(invoice);
    } catch (err) {
      onLog(`Failed to create invoice: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-invoice-form">
      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="1000"
        data-testid="create-invoice-amount"
      />
      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this payment for?"
        data-testid="create-invoice-description"
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full" data-testid="create-invoice-button">
        Create Invoice
      </Button>
    </form>
  );
}
