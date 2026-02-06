import { useState, useCallback } from 'react';
import { useNWCClient } from './useNWCClient';
import type { WalletId, CreateInvoiceRequest, AsyncState } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface UseInvoiceReturn {
  invoice: Nip47Transaction | null;
  loading: boolean;
  error: string | null;
  createInvoice: (request: CreateInvoiceRequest) => Promise<Nip47Transaction>;
  reset: () => void;
}

export function useInvoice(walletId: WalletId): UseInvoiceReturn {
  const client = useNWCClient(walletId);
  const [state, setState] = useState<AsyncState<Nip47Transaction>>({
    data: null,
    loading: false,
    error: null,
  });

  const createInvoice = useCallback(
    async (request: CreateInvoiceRequest): Promise<Nip47Transaction> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setState({ data: null, loading: true, error: null });

      try {
        const invoice = await client.makeInvoice({
          amount: request.amount,
          description: request.description,
          expiry: request.expiry,
        });

        setState({ data: invoice, loading: false, error: null });
        return invoice;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create invoice';
        setState({ data: null, loading: false, error: message });
        throw error;
      }
    },
    [client]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    invoice: state.data,
    loading: state.loading,
    error: state.error,
    createInvoice,
    reset,
  };
}
