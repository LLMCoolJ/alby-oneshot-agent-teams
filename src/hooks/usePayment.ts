import { useState, useCallback } from 'react';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, PaymentResult, AsyncState } from '@/types';

interface UsePaymentReturn {
  result: PaymentResult | null;
  loading: boolean;
  error: string | null;
  payInvoice: (invoice: string) => Promise<PaymentResult>;
  reset: () => void;
}

export function usePayment(walletId: WalletId): UsePaymentReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [state, setState] = useState<AsyncState<PaymentResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const payInvoice = useCallback(
    async (invoice: string): Promise<PaymentResult> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setState({ data: null, loading: true, error: null });

      try {
        const response = await client.payInvoice({ invoice });
        const result: PaymentResult = {
          preimage: response.preimage,
          feesPaid: response.fees_paid,
        };

        setState({ data: result, loading: false, error: null });

        // Refresh balance after payment
        await refreshBalance();

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment failed';
        setState({ data: null, loading: false, error: message });
        throw error;
      }
    },
    [client, refreshBalance]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    result: state.data,
    loading: state.loading,
    error: state.error,
    payInvoice,
    reset,
  };
}
