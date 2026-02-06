import { useState, useEffect } from 'react';
import { Button, Badge, Spinner } from '@/components/ui';
import { useTransactions } from '@/hooks/useTransactions';
import { CONSTANTS } from '@/types';
import type { WalletId, Transaction } from '@/types';

interface TransactionListProps {
  walletId: WalletId;
  onSelectTransaction: (tx: Transaction) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

type FilterType = 'all' | 'incoming' | 'outgoing';

export function TransactionList({ walletId, onSelectTransaction, onLog }: TransactionListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useTransactions(walletId, {
    type: filter === 'all' ? undefined : filter,
    limit: 10,
  });

  useEffect(() => {
    onLog(`Loading ${walletId}'s transactions...`, 'info');
  }, []);

  const handleRefresh = async () => {
    onLog('Refreshing transactions...', 'info');
    try {
      await refresh();
      onLog('Transactions refreshed', 'success');
    } catch (err) {
      onLog(`Failed to refresh: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          data-testid={`${walletId}-filter`}
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="input-field text-sm py-1"
        >
          <option value="all">All</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          loading={loading}
          data-testid={`${walletId}-refresh`}
        >
          Refresh
        </Button>
      </div>

      {/* Transaction list */}
      {error && <p className="text-sm text-red-600" data-testid={`${walletId}-error`}>{error}</p>}

      {loading && transactions.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8" data-testid={`${walletId}-empty`}>
          No transactions found
        </p>
      ) : (
        <div className="space-y-2" data-testid={`${walletId}-transactions`}>
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onClick={() => onSelectTransaction(tx)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <Button
          variant="secondary"
          onClick={loadMore}
          loading={loading}
          className="w-full"
          data-testid={`${walletId}-load-more`}
        >
          Load More
        </Button>
      )}
    </div>
  );
}

function TransactionItem({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick: () => void;
}) {
  const amountSats = Math.floor(transaction.amount / CONSTANTS.MILLISATS_PER_SAT); // sats
  const isIncoming = transaction.type === 'incoming';
  const timeStr = transaction.createdAt.toLocaleTimeString();

  const statusBadge = {
    pending: <Badge variant="warning" size="sm">Pending</Badge>,
    settled: <Badge variant="success" size="sm">Settled</Badge>,
    failed: <Badge variant="error" size="sm">Failed</Badge>,
    accepted: <Badge variant="info" size="sm">Held</Badge>,
  }[transaction.state];

  return (
    <button
      onClick={onClick}
      data-testid={`transaction-${transaction.id}`}
      className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '\u2191' : '\u2193'}
          </span>
          <div>
            <div className={`font-medium ${isIncoming ? 'text-green-700' : 'text-red-700'}`}>
              {isIncoming ? '+' : '-'}{amountSats.toLocaleString()} sats
            </div>
            <div className="text-xs text-slate-500">
              {timeStr} {transaction.description ? `\u2022 ${transaction.description}` : '\u2022 No description'}
            </div>
          </div>
        </div>
        {statusBadge}
      </div>
    </button>
  );
}
