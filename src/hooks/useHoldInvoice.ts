import { useState, useCallback } from 'react';
import { useNWCClient } from './useNWCClient';
import { generatePreimageAndHash } from '@/lib/crypto';
import type { WalletId, HoldInvoice, CreateInvoiceRequest } from '@/types';

interface UseHoldInvoiceReturn {
  createHoldInvoice: (request: CreateInvoiceRequest) => Promise<HoldInvoice>;
  settleHoldInvoice: (preimage: string) => Promise<void>;
  cancelHoldInvoice: (paymentHash: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useHoldInvoice(walletId: WalletId): UseHoldInvoiceReturn {
  const client = useNWCClient(walletId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHoldInvoice = useCallback(
    async (request: CreateInvoiceRequest): Promise<HoldInvoice> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        // Generate preimage and hash
        const { preimage, paymentHash } = await generatePreimageAndHash();

        // Create hold invoice with the payment hash
        const response = await client.makeHoldInvoice({
          amount: request.amount,
          description: request.description,
          payment_hash: paymentHash,
        });

        return {
          invoice: response.invoice,
          paymentHash,
          preimage,
          state: 'created',
          amount: request.amount,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create hold invoice';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const settleHoldInvoice = useCallback(
    async (preimage: string): Promise<void> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        await client.settleHoldInvoice({ preimage });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to settle';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const cancelHoldInvoice = useCallback(
    async (paymentHash: string): Promise<void> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        await client.cancelHoldInvoice({ payment_hash: paymentHash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    createHoldInvoice,
    settleHoldInvoice,
    cancelHoldInvoice,
    loading,
    error,
  };
}
