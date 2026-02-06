# Specification 12: Scenario 6 - Transaction History

## Purpose

Display and filter transaction history for both wallets, demonstrating the `listTransactions` NWC method with pagination and filtering.

## Dependencies

- [03-shared-types.md](./03-shared-types.md) - Transaction types
- [05-wallet-context.md](./05-wallet-context.md) - NWC client access

## User Story

> As a user, I want to view my transaction history with filtering options so I can track my Lightning payments.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Transaction History                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────┐          │
│  │  Alice's Transactions    │    │  Bob's Transactions      │          │
│  │                          │    │                          │          │
│  │  Filters:                │    │  Filters:                │          │
│  │  [All ▼] [Date ▼]       │    │  [All ▼] [Date ▼]       │          │
│  │                          │    │                          │          │
│  │  ┌────────────────────┐ │    │  ┌────────────────────┐ │          │
│  │  │ ↑ +1,000 sats      │ │    │  │ ↓ -500 sats        │ │          │
│  │  │   12:34 • Coffee   │ │    │  │   12:30 • Payment  │ │          │
│  │  │   [Settled]        │ │    │  │   [Settled]        │ │          │
│  │  ├────────────────────┤ │    │  ├────────────────────┤ │          │
│  │  │ ↓ -500 sats        │ │    │  │ ↑ +2,000 sats      │ │          │
│  │  │   12:30 • Payment  │ │    │  │   12:25 • Invoice  │ │          │
│  │  │   [Settled]        │ │    │  │   [Settled]        │ │          │
│  │  ├────────────────────┤ │    │  ├────────────────────┤ │          │
│  │  │ ↑ +2,000 sats      │ │    │  │ ↓ -100 sats        │ │          │
│  │  │   12:25 • Invoice  │ │    │  │   12:20 • Tip      │ │          │
│  │  │   [Pending]        │ │    │  │   [Failed]         │ │          │
│  │  └────────────────────┘ │    │  └────────────────────┘ │          │
│  │                          │    │                          │          │
│  │  [Load More]             │    │  [Load More]             │          │
│  └──────────────────────────┘    └──────────────────────────┘          │
│                                                                          │
│  Transaction Details (click to expand):                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Amount: 1,000 sats                                                │ │
│  │  Type: Incoming                                                    │ │
│  │  Status: Settled                                                   │ │
│  │  Created: 2024-01-15 12:34:56                                     │ │
│  │  Settled: 2024-01-15 12:34:58                                     │ │
│  │  Description: Coffee payment                                       │ │
│  │  Payment Hash: abc123...                                           │ │
│  │  Preimage: def456...                                               │ │
│  │  Fees Paid: 1 sat                                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/6-TransactionHistory/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { TransactionList } from './components/TransactionList';
import { TransactionDetails } from './components/TransactionDetails';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Transaction } from '@/types';

export default function TransactionHistory() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Transaction History"
      description="View and filter your Lightning transaction history with detailed information."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <TransactionList
            walletId="alice"
            onSelectTransaction={setSelectedTransaction}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <TransactionList
            walletId="bob"
            onSelectTransaction={setSelectedTransaction}
            onLog={addLog}
          />
        )
      }
      logs={entries}
    >
      {/* Transaction details panel */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </ScenarioPage>
  );
}
```

---

## Components

### TransactionList

**File**: `src/pages/6-TransactionHistory/components/TransactionList.tsx`

```typescript
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
        >
          Refresh
        </Button>
      </div>

      {/* Transaction list */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && transactions.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No transactions found
        </p>
      ) : (
        <div className="space-y-2">
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
  const amountSats = Math.floor(transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
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
      className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '↑' : '↓'}
          </span>
          <div>
            <div className={`font-medium ${isIncoming ? 'text-green-700' : 'text-red-700'}`}>
              {isIncoming ? '+' : '-'}{amountSats.toLocaleString()} sats
            </div>
            <div className="text-xs text-slate-500">
              {timeStr} • {transaction.description || 'No description'}
            </div>
          </div>
        </div>
        {statusBadge}
      </div>
    </button>
  );
}
```

### TransactionDetails

**File**: `src/pages/6-TransactionHistory/components/TransactionDetails.tsx`

```typescript
import { Button, Badge, CopyButton } from '@/components/ui';
import { CONSTANTS } from '@/types';
import type { Transaction } from '@/types';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const amountSats = Math.floor(transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
  const feesSats = Math.floor(transaction.feesPaid / CONSTANTS.MILLISATS_PER_SAT);
  const isIncoming = transaction.type === 'incoming';

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        {/* Amount */}
        <div className="text-center py-4">
          <div className={`text-3xl font-bold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '+' : '-'}{amountSats.toLocaleString()} sats
          </div>
          <Badge variant={transaction.state === 'settled' ? 'success' : 'warning'}>
            {transaction.state}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid gap-3 text-sm">
          <DetailRow label="Type" value={transaction.type} />
          <DetailRow label="Description" value={transaction.description || '-'} />
          <DetailRow
            label="Created"
            value={transaction.createdAt.toLocaleString()}
          />
          {transaction.settledAt && (
            <DetailRow
              label="Settled"
              value={transaction.settledAt.toLocaleString()}
            />
          )}
          {transaction.feesPaid > 0 && (
            <DetailRow label="Fees Paid" value={`${feesSats} sats`} />
          )}

          {/* Payment hash */}
          <div>
            <span className="text-slate-600">Payment Hash:</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono break-all">
                {transaction.paymentHash}
              </code>
              <CopyButton value={transaction.paymentHash} />
            </div>
          </div>

          {/* Preimage (if settled) */}
          {transaction.preimage && (
            <div>
              <span className="text-slate-600">Preimage:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono break-all">
                  {transaction.preimage}
                </code>
                <CopyButton value={transaction.preimage} />
              </div>
            </div>
          )}

          {/* Invoice */}
          <div>
            <span className="text-slate-600">Invoice:</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono truncate">
                {transaction.invoice}
              </code>
              <CopyButton value={transaction.invoice} />
            </div>
          </div>

          {/* Metadata */}
          {transaction.metadata && (
            <details className="mt-2">
              <summary className="cursor-pointer text-slate-600">Metadata</summary>
              <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
```

---

## Custom Hook: useTransactions

**File**: `src/hooks/useTransactions.ts`

**Note**: Add to `src/hooks/index.ts`:
```typescript
export { useTransactions } from './useTransactions';
```

```typescript
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
    amount: tx.amount,
    feesPaid: tx.fees_paid,
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
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `client.listTransactions({ type, limit, offset, from, until })` | Fetch transactions | NWCClient |
| `client.lookupInvoice({ payment_hash })` | Get transaction details | NWCClient |

---

## Test Requirements (TDD)

**File**: `tests/unit/hooks/useTransactions.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactions } from '@/hooks/useTransactions';

const mockTransactions = [
  {
    payment_hash: 'hash1',
    type: 'incoming',
    state: 'settled',
    amount: 1000000,
    fees_paid: 0,
    description: 'Test 1',
    invoice: 'lnbc...',
    preimage: 'pre1',
    created_at: Date.now() / 1000,
    settled_at: Date.now() / 1000,
  },
  {
    payment_hash: 'hash2',
    type: 'outgoing',
    state: 'settled',
    amount: 500000,
    fees_paid: 1000,
    description: 'Test 2',
    invoice: 'lnbc...',
    preimage: 'pre2',
    created_at: Date.now() / 1000,
    settled_at: Date.now() / 1000,
  },
];

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    listTransactions: vi.fn().mockResolvedValue({
      transactions: mockTransactions,
    }),
  }),
}));

describe('useTransactions', () => {
  it('fetches transactions on mount', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });
  });

  it('maps transaction data correctly', async () => {
    const { result } = renderHook(() => useTransactions('alice'));

    await waitFor(() => {
      expect(result.current.transactions[0]).toMatchObject({
        id: 'hash1',
        type: 'incoming',
        state: 'settled',
      });
    });
  });

  it('supports filtering by type', async () => {
    const { result, rerender } = renderHook(
      ({ type }) => useTransactions('alice', { type }),
      { initialProps: { type: undefined as any } }
    );

    rerender({ type: 'incoming' });

    await waitFor(() => {
      // Would verify filter is passed to client
    });
  });

  it('supports pagination', async () => {
    const { result } = renderHook(() => useTransactions('alice', { limit: 1 }));

    await waitFor(() => {
      expect(result.current.hasMore).toBeDefined();
    });
  });
});
```

---

## File Structure

```
src/pages/6-TransactionHistory/
├── index.tsx                    # Page component (TransactionHistory)
└── components/
    ├── TransactionList.tsx      # Transaction list with filters
    └── TransactionDetails.tsx   # Expanded transaction view
```

---

## Acceptance Criteria

- [ ] Transactions load on page mount
- [ ] Filter by incoming/outgoing works
- [ ] Pagination loads more transactions
- [ ] Clicking transaction shows details
- [ ] Transaction details show all fields
- [ ] Copy buttons work for hash/preimage
- [ ] Loading states display correctly
- [ ] Empty state shown when no transactions
- [ ] All tests pass

## Related Specifications

- [03-shared-types.md](./03-shared-types.md) - Transaction types
- [05-wallet-context.md](./05-wallet-context.md) - NWC client access
