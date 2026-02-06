# Specification 13: Scenario 7 - Nostr Zap

## Purpose

Demonstrate social tipping on Nostr using Lightning zaps. Alice zaps Bob's Nostr note, which creates a special zap invoice with Nostr metadata.

## Dependencies

- [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) - Lightning Address payment
- [05-wallet-context.md](./05-wallet-context.md) - NWC client access

## User Story

> As a developer building Nostr applications, I want to understand how Lightning zaps work so I can implement social tipping in my app.

---

## How Zaps Work

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Nostr Zap Flow                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Bob publishes a note on Nostr                                       │
│     - Note has an event ID (e tag)                                      │
│     - Bob's npub is the author (p tag)                                  │
│     - Bob has a Lightning Address in his profile                        │
│                                                                          │
│  2. Alice wants to zap (tip) the note                                   │
│     - Alice creates a zap request event (kind 9734)                     │
│     - Includes: amount, comment, relays, p tag, e tag                   │
│     - Signs it with her Nostr key                                       │
│                                                                          │
│  3. Zap request is sent to Bob's LNURL server                          │
│     - Server returns a zap invoice with embedded zap request            │
│                                                                          │
│  4. Alice pays the invoice                                               │
│     - Bob's wallet receives payment                                      │
│     - Wallet publishes zap receipt (kind 9735) to Nostr relays         │
│                                                                          │
│  5. Clients see zap on the note                                         │
│     - Zap receipt proves Alice zapped Bob's note                        │
│     - Shows amount and optional comment                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/7-NostrZap/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { MockNostrNote } from './components/MockNostrNote';
import { ZapForm } from './components/ZapForm';
import { ZapResult } from './components/ZapResult';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { MockNostrNote as MockNoteType, PaymentResult } from '@/types';

// Demo note for Bob
const DEMO_NOTE: MockNoteType = {
  id: 'note1abc123def456',
  pubkey: 'npub1bob123...',
  content: 'Just set up my Lightning wallet! Anyone want to test zaps? ⚡',
  created_at: Math.floor(Date.now() / 1000) - 3600,
  author: {
    name: 'Bob',
    picture: undefined,
  },
};

export default function NostrZapPage() {
  const [zapResult, setZapResult] = useState<PaymentResult | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleZapSuccess = (result: PaymentResult) => {
    setZapResult(result);
    addLog('Zap sent successfully!', 'success');
  };

  const handleReset = () => {
    setZapResult(null);
  };

  return (
    <ScenarioPage
      title="Nostr Zap"
      description="Alice zaps Bob's Nostr note with a Lightning payment. Zaps are social tips with cryptographic proof."
      aliceContent={
        aliceWallet.status === 'connected' && (
          zapResult ? (
            <ZapResult result={zapResult} onReset={handleReset} />
          ) : (
            <ZapForm
              note={DEMO_NOTE}
              recipientAddress={bobWallet.info?.lud16}
              onZapSuccess={handleZapSuccess}
              onLog={addLog}
            />
          )
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <MockNostrNote note={DEMO_NOTE} lightningAddress={bobWallet.info?.lud16} />
        )
      }
      logs={entries}
    >
      {/* Educational content */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-3">How Zaps Work</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900 mb-1">Zap Request (kind 9734)</div>
            <p className="text-purple-700">
              A signed Nostr event containing the zap amount, comment, and
              references to the note being zapped.
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900 mb-1">Zap Receipt (kind 9735)</div>
            <p className="text-purple-700">
              Published after payment, proving the zap happened. Contains
              the original request and payment proof.
            </p>
          </div>
        </div>
      </div>
    </ScenarioPage>
  );
}
```

---

## Components

### MockNostrNote

**File**: `src/pages/7-NostrZap/components/MockNostrNote.tsx`

```typescript
import { Badge, CopyButton } from '@/components/ui';
import type { MockNostrNote as MockNoteType } from '@/types';

interface MockNostrNoteProps {
  note: MockNoteType;
  lightningAddress?: string;
}

export function MockNostrNote({ note, lightningAddress }: MockNostrNoteProps) {
  const timeAgo = formatTimeAgo(note.created_at);

  return (
    <div className="space-y-4">
      {/* Note card */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        {/* Author header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
            <span className="text-purple-700 font-medium">
              {note.author.name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium text-purple-900">{note.author.name}</div>
            <div className="text-xs text-purple-600">{timeAgo}</div>
          </div>
        </div>

        {/* Note content */}
        <p className="text-purple-900 mb-3">{note.content}</p>

        {/* Note ID */}
        <div className="flex items-center gap-2 text-xs text-purple-600">
          <span>Note ID: {note.id.slice(0, 20)}...</span>
          <CopyButton value={note.id} />
        </div>
      </div>

      {/* Lightning Address info */}
      {lightningAddress ? (
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">Lightning Address:</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{lightningAddress}</code>
            <CopyButton value={lightningAddress} />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No Lightning Address found. Bob needs to set one up to receive zaps.
          </p>
        </div>
      )}

      {/* Zap indicator placeholder */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>⚡ 0 zaps</span>
        <span>💬 0 replies</span>
        <span>🔁 0 reposts</span>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

### ZapForm

**File**: `src/pages/7-NostrZap/components/ZapForm.tsx`

```typescript
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useZap } from '@/hooks/useZap';
import type { MockNostrNote, PaymentResult } from '@/types';

interface ZapFormProps {
  note: MockNostrNote;
  recipientAddress?: string;
  onZapSuccess: (result: PaymentResult) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const QUICK_AMOUNTS = [21, 100, 500, 1000];
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

export function ZapForm({ note, recipientAddress, onZapSuccess, onLog }: ZapFormProps) {
  const [amount, setAmount] = useState('21');
  const [comment, setComment] = useState('');
  const { sendZap, loading, error } = useZap('alice');

  const handleZap = async () => {
    if (!recipientAddress) {
      onLog('Recipient has no Lightning Address', 'error');
      return;
    }

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < 1) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog(`Sending ${amountSats} sat zap to ${note.author.name}...`, 'info');

    try {
      const result = await sendZap({
        recipientAddress,
        amount: amountSats,
        recipientPubkey: note.pubkey,
        eventId: note.id,
        relays: DEFAULT_RELAYS,
        comment: comment || undefined,
      });
      onZapSuccess(result);
    } catch (err) {
      onLog(`Zap failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick amount buttons */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Zap Amount
        </label>
        <div className="flex gap-2 mb-2">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(String(quickAmount))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                amount === String(quickAmount)
                  ? 'bg-bitcoin text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚡ {quickAmount}
            </button>
          ))}
        </div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          placeholder="Custom amount"
        />
      </div>

      {/* Comment */}
      <Input
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Great post! ⚡"
        maxLength={280}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleZap}
        loading={loading}
        disabled={!recipientAddress}
        className="w-full"
      >
        ⚡ Zap {amount} sats
      </Button>

      {/* Info box */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
        <strong>Note:</strong> In a real Nostr client, zaps would be signed with your
        Nostr private key and published as zap receipts to relays.
      </div>
    </div>
  );
}
```

### ZapResult

**File**: `src/pages/7-NostrZap/components/ZapResult.tsx`

```typescript
import { Button, Badge, CopyButton } from '@/components/ui';
import type { PaymentResult } from '@/types';

interface ZapResultProps {
  result: PaymentResult;
  onReset: () => void;
}

export function ZapResult({ result, onReset }: ZapResultProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
        <span className="text-4xl">⚡</span>
        <h3 className="text-lg font-semibold text-purple-900 mt-2">Zap Sent!</h3>
        <p className="text-sm text-purple-700 mt-1">
          Your zap has been sent successfully.
        </p>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-2">
        <div>
          <span className="text-slate-600">Preimage (proof):</span>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 p-2 bg-white rounded border text-xs font-mono truncate">
              {result.preimage}
            </code>
            <CopyButton value={result.preimage} />
          </div>
        </div>
      </div>

      <Button variant="secondary" onClick={onReset} className="w-full">
        Send Another Zap
      </Button>
    </div>
  );
}
```

---

## Custom Hook: useZap

**File**: `src/hooks/useZap.ts`

**Note**: Add to `src/hooks/index.ts`:
```typescript
export { useZap } from './useZap';
```

```typescript
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
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `new LightningAddress(address)` | Create address instance | lightning-tools |
| `ln.fetch()` | Fetch LNURL data | lightning-tools |
| `ln.zapInvoice({ satoshi, comment, relays, p, e })` | Create zap invoice with Nostr metadata | lightning-tools |
| `client.payInvoice({ invoice })` | Pay the invoice | NWCClient |

---

## Test Requirements (TDD)

**File**: `tests/unit/hooks/useZap.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useZap } from '@/hooks/useZap';

vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue(undefined),
    zapInvoice: vi.fn().mockResolvedValue({
      paymentRequest: 'lnbc...',
    }),
  })),
}));

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    payInvoice: vi.fn().mockResolvedValue({
      preimage: 'preimage123',
      fees_paid: 0,
    }),
  }),
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: vi.fn(),
  }),
}));

describe('useZap', () => {
  it('sends zap with correct parameters', async () => {
    const { result } = renderHook(() => useZap('alice'));

    await act(async () => {
      const zapResult = await result.current.sendZap({
        recipientAddress: 'bob@getalby.com',
        recipientPubkey: 'npub123...',
        amount: 21,
        relays: ['wss://relay.damus.io'],
        comment: 'Great post!',
      });

      expect(zapResult.preimage).toBe('preimage123');
    });
  });

  it('handles missing wallet gracefully', async () => {
    vi.mocked(require('@/hooks/useNWCClient').useNWCClient).mockReturnValue(null);

    const { result } = renderHook(() => useZap('alice'));

    await expect(
      result.current.sendZap({
        recipientAddress: 'bob@getalby.com',
        recipientPubkey: 'npub123...',
        amount: 21,
        relays: [],
      })
    ).rejects.toThrow('Wallet not connected');
  });
});
```

---

## File Structure

```
src/pages/7-NostrZap/
├── index.tsx                  # Main page component
└── components/
    ├── MockNostrNote.tsx      # Mock Nostr note display
    ├── ZapForm.tsx            # Zap amount and comment form
    └── ZapResult.tsx          # Zap success display
```

---

## Acceptance Criteria

- [ ] Mock Nostr note displays correctly
- [ ] Quick amount buttons work
- [ ] Custom amount input works
- [ ] Comment field works (optional)
- [ ] Zap creates proper invoice with Nostr metadata
- [ ] Payment executes successfully
- [ ] Success state shows preimage
- [ ] Educational content explains zaps
- [ ] All tests pass

## Related Specifications

- [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) - Uses Lightning Address
- [05-wallet-context.md](./05-wallet-context.md) - NWC client access
