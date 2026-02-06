import { useState, useCallback } from 'react';
import { LightningAddress } from '@getalby/lightning-tools/lnurl';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, ZapRequest, PaymentResult } from '@/types';

interface UseZapReturn {
  sendZap: (request: ZapRequest) => Promise<PaymentResult>;
  loading: boolean;
  error: string | null;
}

export function useZap(walletId: WalletId): UseZapReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendZap = useCallback(
    async (request: ZapRequest): Promise<PaymentResult> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        // Create LightningAddress instance
        const ln = new LightningAddress(request.recipientAddress);
        await ln.fetch();

        // Generate zap invoice with Nostr metadata
        // Note: In a real app, this would require a Nostr signer
        const invoice = await ln.zapInvoice({
          satoshi: request.amount,
          comment: request.comment,
          relays: request.relays,
          p: request.recipientPubkey,
          e: request.eventId,
        });

        // Pay the zap invoice
        const response = await client.payInvoice({ invoice: invoice.paymentRequest });

        const result: PaymentResult = {
          preimage: response.preimage,
          feesPaid: response.fees_paid,
        };

        await refreshBalance();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Zap failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, refreshBalance]
  );

  return {
    sendZap,
    loading,
    error,
  };
}
