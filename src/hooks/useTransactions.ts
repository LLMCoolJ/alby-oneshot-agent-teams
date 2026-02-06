import { useState, useCallback, useEffect } from 'react';
import { useNWCClient } from './useNWCClient';
import { CONSTANTS } from '@/types';
import type { WalletId, Transaction, TransactionFilter } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface UseTransactionsOptions extends TransactionFilter {}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

function mapTransaction(tx: Nip47Transaction): Transaction {
  return {
    id: tx.payment_hash,
    type: tx.type,
    state: tx.state,
    amount: tx.amount, // millisats
    feesPaid: tx.fees_paid, // millisats
    description: tx.description,
    invoice: tx.invoice,
    preimage: tx.preimage || null,
    paymentHash: tx.payment_hash,
    createdAt: new Date(tx.created_at * 1000),
    settledAt: tx.settled_at ? new Date(tx.settled_at * 1000) : null,
    expiresAt: tx.expires_at ? new Date(tx.expires_at * 1000) : null,
    metadata: tx.metadata ? {
      comment: tx.metadata.comment,
      payerData: tx.metadata.payer_data,
      recipientData: tx.metadata.recipient_data,
      nostr: tx.metadata.nostr,
    } : undefined,
  };
}

export function useTransactions(
  walletId: WalletId,
  options: UseTransactionsOptions = {}
): UseTransactionsReturn {
  const client = useNWCClient(walletId);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = options.limit ?? CONSTANTS.DEFAULT_PAGE_SIZE;

  const fetchTransactions = useCallback(
    async (reset: boolean = false) => {
      if (!client) return;

      setLoading(true);
      setError(null);

      try {
        const response = await client.listTransactions({
          type: options.type,
          from: options.from ? Math.floor(options.from.getTime() / 1000) : undefined,
          until: options.until ? Math.floor(options.until.getTime() / 1000) : undefined,
          limit,
          offset: reset ? 0 : offset,
        });

        const mapped = response.transactions.map(mapTransaction);

        if (reset) {
          setTransactions(mapped);
          setOffset(mapped.length);
        } else {
          setTransactions((prev) => [...prev, ...mapped]);
          setOffset((prev) => prev + mapped.length);
        }

        setHasMore(mapped.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    },
    [client, options.type, options.from, options.until, limit, offset]
  );

  // Initial fetch
  useEffect(() => {
    if (client) {
      fetchTransactions(true);
    }
  }, [client, options.type]);

  const loadMore = useCallback(async () => {
    await fetchTransactions(false);
  }, [fetchTransactions]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
