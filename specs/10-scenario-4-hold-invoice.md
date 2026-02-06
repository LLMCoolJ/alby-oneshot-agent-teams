# Specification 10: Scenario 4 - Hold Invoice (Escrow)

## Purpose

Demonstrate conditional payments using hold invoices. Alice's payment is locked until Bob either settles it (receives funds) or cancels it (refunds Alice).

## Dependencies

- [05-wallet-context.md](./05-wallet-context.md) - NWC client access
- [06-layout.md](./06-layout.md) - ScenarioPage template
- [09-scenario-3-notifications.md](./09-scenario-3-notifications.md) - Uses `hold_invoice_accepted` notifications

## User Story

> As a developer building an escrow system, I want to understand how hold invoices work so I can implement conditional payments where funds are released only when conditions are met.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Hold Invoice (Escrow)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: Bob creates hold invoice (generates preimage/hash)             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Amount: 5000] [Description: Escrow payment]                   │   │
│  │  [Create Hold Invoice]                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Step 2: Hold invoice displayed with QR                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Status: ⏳ CREATED                                              │   │
│  │  Payment Hash: a1b2c3...                                        │   │
│  │  [QR Code]                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Step 3: Alice pays the hold invoice                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Alice: [Paste invoice] [Pay]                                   │   │
│  │  ⏳ Payment pending... (funds locked)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Step 4: Status changes to ACCEPTED (funds held)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Status: 🔒 HELD                                                 │   │
│  │  Funds are locked. Bob can now:                                  │   │
│  │  [Settle (Receive Funds)]  [Cancel (Refund Alice)]              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Step 5a: Bob settles → receives funds                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Status: ✅ SETTLED                                              │   │
│  │  Bob received 5,000 sats. Preimage revealed.                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Step 5b: Bob cancels → Alice refunded                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Status: ❌ CANCELLED                                            │   │
│  │  Alice's payment was refunded.                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/4-HoldInvoice/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { CreateHoldInvoice } from './components/CreateHoldInvoice';
import { HoldInvoiceStatus } from './components/HoldInvoiceStatus';
import { PayHoldInvoice } from './components/PayHoldInvoice';
import { useTransactionLog, useWallet } from '@/hooks';
import type { HoldInvoice } from '@/types';

export default function HoldInvoice() {
  const [holdInvoice, setHoldInvoice] = useState<HoldInvoice | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleHoldInvoiceCreated = (invoice: HoldInvoice) => {
    setHoldInvoice(invoice);
    addLog(`Hold invoice created: ${invoice.amount / 1000} sats`, 'success');
  };

  const handleStateChange = (newState: HoldInvoice['state']) => {
    if (holdInvoice) {
      setHoldInvoice({ ...holdInvoice, state: newState });
      addLog(`Invoice state changed to: ${newState}`, 'info');
    }
  };

  const handleReset = () => {
    setHoldInvoice(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Hold Invoice (Escrow)"
      description="Conditional payments using hold invoices. Alice's payment is locked until Bob settles or cancels."
      aliceContent={
        aliceWallet.status === 'connected' && holdInvoice && (
          <PayHoldInvoice
            invoice={holdInvoice.invoice}
            state={holdInvoice.state}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          holdInvoice ? (
            <HoldInvoiceStatus
              holdInvoice={holdInvoice}
              onStateChange={handleStateChange}
              onReset={handleReset}
              onLog={addLog}
            />
          ) : (
            <CreateHoldInvoice
              onCreated={handleHoldInvoiceCreated}
              onLog={addLog}
            />
          )
        )
      }
      logs={entries}
    >
      {/* Explainer section */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-3">How Hold Invoices Work</h3>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">1. Create</div>
            <p className="text-slate-600">
              Bob generates a preimage and its hash. The hash is included in the invoice.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">2. Hold</div>
            <p className="text-slate-600">
              Alice pays, but funds are locked. Only Bob has the preimage to claim them.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">3. Settle/Cancel</div>
            <p className="text-slate-600">
              Bob reveals preimage to receive funds, or cancels to refund Alice.
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

### CreateHoldInvoice

**File**: `src/pages/4-HoldInvoice/components/CreateHoldInvoice.tsx`

```typescript
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
      />

      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Escrow for..."
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Create Hold Invoice
      </Button>
    </form>
  );
}
```

### HoldInvoiceStatus

**File**: `src/pages/4-HoldInvoice/components/HoldInvoiceStatus.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button, Badge, QRCode, CopyButton } from '@/components/ui';
import { useHoldInvoice, useNotifications } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { HoldInvoice, HoldInvoiceState } from '@/types';

interface HoldInvoiceStatusProps {
  holdInvoice: HoldInvoice;
  onStateChange: (state: HoldInvoiceState) => void;
  onReset: () => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const STATE_CONFIG: Record<HoldInvoiceState, {
  badge: { variant: 'info' | 'warning' | 'success' | 'error'; label: string };
  icon: string;
}> = {
  created: { badge: { variant: 'info', label: 'Created' }, icon: '⏳' },
  accepted: { badge: { variant: 'warning', label: 'Held' }, icon: '🔒' },
  settled: { badge: { variant: 'success', label: 'Settled' }, icon: '✅' },
  cancelled: { badge: { variant: 'error', label: 'Cancelled' }, icon: '❌' },
};

export function HoldInvoiceStatus({
  holdInvoice,
  onStateChange,
  onReset,
  onLog,
}: HoldInvoiceStatusProps) {
  const { settleHoldInvoice, cancelHoldInvoice, loading, error } = useHoldInvoice('bob');
  const amountSats = Math.floor(holdInvoice.amount / CONSTANTS.MILLISATS_PER_SAT);
  const config = STATE_CONFIG[holdInvoice.state];

  // Subscribe to hold_invoice_accepted notifications
  const { subscribe, unsubscribe, isSubscribed } = useNotifications('bob', {
    onNotification: (event) => {
      if (event.type === 'hold_invoice_accepted' &&
          event.transaction.paymentHash === holdInvoice.paymentHash) {
        onStateChange('accepted');
        onLog('Payment received and held!', 'success');
      }
    },
    notificationTypes: ['hold_invoice_accepted'],
  });

  // Auto-subscribe when component mounts
  useEffect(() => {
    if (holdInvoice.state === 'created') {
      subscribe();
    }
    return () => unsubscribe();
  }, [holdInvoice.state]);

  const handleSettle = async () => {
    onLog('Settling hold invoice (revealing preimage)...', 'info');
    try {
      await settleHoldInvoice(holdInvoice.preimage);
      onStateChange('settled');
      onLog('Invoice settled! Funds received.', 'success');
    } catch (err) {
      onLog(`Settle failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleCancel = async () => {
    onLog('Cancelling hold invoice (refunding payer)...', 'info');
    try {
      await cancelHoldInvoice(holdInvoice.paymentHash);
      onStateChange('cancelled');
      onLog('Invoice cancelled! Payer refunded.', 'success');
    } catch (err) {
      onLog(`Cancel failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <Badge variant={config.badge.variant}>{config.badge.label}</Badge>
        </div>
        <span className="text-lg font-bold">{amountSats.toLocaleString()} sats</span>
      </div>

      {/* QR Code for created state */}
      {holdInvoice.state === 'created' && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <QRCode value={holdInvoice.invoice} size={180} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={holdInvoice.invoice}
              readOnly
              className="input-field font-mono text-xs flex-1"
            />
            <CopyButton value={holdInvoice.invoice} />
          </div>
          <p className="text-sm text-slate-500 text-center">
            Waiting for payment... {isSubscribed && '(Listening)'}
          </p>
        </div>
      )}

      {/* Action buttons for accepted state */}
      {holdInvoice.state === 'accepted' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Payment is held. Choose an action:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSettle}
              loading={loading}
              className="w-full"
            >
              Settle (Receive)
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              loading={loading}
              className="w-full"
            >
              Cancel (Refund)
            </Button>
          </div>
        </div>
      )}

      {/* Final states */}
      {(holdInvoice.state === 'settled' || holdInvoice.state === 'cancelled') && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {holdInvoice.state === 'settled'
              ? 'Funds have been received successfully.'
              : 'Payment has been refunded to the payer.'}
          </p>
          <Button variant="secondary" onClick={onReset} className="w-full">
            Create New Hold Invoice
          </Button>
        </div>
      )}

      {/* Debug info */}
      <details className="text-xs">
        <summary className="text-slate-500 cursor-pointer">Technical Details</summary>
        <div className="mt-2 p-2 bg-slate-50 rounded font-mono space-y-1">
          <div>Payment Hash: {holdInvoice.paymentHash.slice(0, 32)}...</div>
          <div>Preimage: {holdInvoice.preimage.slice(0, 32)}...</div>
        </div>
      </details>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### PayHoldInvoice

**File**: `src/pages/4-HoldInvoice/components/PayHoldInvoice.tsx`

```typescript
import { useState } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import { usePayment } from '@/hooks';
import type { HoldInvoiceState } from '@/types';

interface PayHoldInvoiceProps {
  invoice: string;
  state: HoldInvoiceState;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayHoldInvoice({ invoice, state, onLog }: PayHoldInvoiceProps) {
  const [inputInvoice, setInputInvoice] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const { payInvoice, loading, error } = usePayment('alice');

  const handlePay = async () => {
    const invoiceToPay = inputInvoice || invoice;
    if (!invoiceToPay) {
      onLog('Please enter an invoice', 'error');
      return;
    }

    setIsPaying(true);
    onLog('Paying hold invoice...', 'info');

    try {
      // Note: For hold invoices, payInvoice will hang until settled/cancelled
      // We show a pending state in the UI
      await payInvoice(invoiceToPay);
      setHasPaid(true);
      onLog('Payment completed!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      // Check if it's a cancellation
      if (message.includes('cancel')) {
        onLog('Payment was cancelled - funds refunded', 'info');
      } else {
        onLog(`Payment failed: ${message}`, 'error');
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Payment Status:</span>
        {isPaying ? (
          <Badge variant="warning">Pending (Held)</Badge>
        ) : hasPaid ? (
          <Badge variant="success">Completed</Badge>
        ) : state === 'cancelled' ? (
          <Badge variant="error">Cancelled</Badge>
        ) : (
          <Badge variant="default">Not Paid</Badge>
        )}
      </div>

      {!hasPaid && state !== 'cancelled' && (
        <>
          <Input
            label="Hold Invoice"
            value={inputInvoice}
            onChange={(e) => setInputInvoice(e.target.value)}
            placeholder="Paste the hold invoice..."
          />

          <Button
            onClick={handlePay}
            loading={loading || isPaying}
            disabled={hasPaid}
            className="w-full"
          >
            {isPaying ? 'Waiting for settle/cancel...' : 'Pay Hold Invoice'}
          </Button>
        </>
      )}

      {isPaying && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Payment is held.</strong> Your funds are locked until
            the recipient settles or cancels the invoice.
          </p>
        </div>
      )}

      {error && !isPaying && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

## Custom Hook: useHoldInvoice

**File**: `src/hooks/useHoldInvoice.ts`

```typescript
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
```

---

## Crypto Utilities

**File**: `src/lib/crypto.ts`

Uses SDK utilities where available. Generation uses Web Crypto API (platform crypto, not "rolling our own").

```typescript
import { fromHexString, Invoice } from '@getalby/lightning-tools/bolt11';

// Re-export SDK utility for hex decoding
export { fromHexString };

/**
 * Convert bytes to hex string.
 * Simple string conversion utility (not crypto).
 */
export function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random preimage and its SHA-256 hash for hold invoices.
 *
 * Uses Web Crypto API (platform crypto):
 * - crypto.getRandomValues() for secure random bytes
 * - crypto.subtle.digest() for SHA-256 hashing
 *
 * This is appropriate because we're generating values, not verifying claims.
 * The SDK doesn't provide a generation helper since wallets normally handle this.
 */
export async function generatePreimageAndHash(): Promise<{
  preimage: string;
  paymentHash: string;
}> {
  // Generate 32 random bytes for preimage using platform crypto
  const preimageBytes = crypto.getRandomValues(new Uint8Array(32));
  const preimage = toHexString(preimageBytes);

  // Hash the preimage with SHA-256 using platform crypto
  const hashBuffer = await crypto.subtle.digest('SHA-256', preimageBytes);
  const paymentHash = toHexString(new Uint8Array(hashBuffer));

  return { preimage, paymentHash };
}

/**
 * Verify that a preimage matches an invoice's payment hash.
 *
 * Uses SDK's Invoice.validatePreimage() - don't roll your own crypto for verification!
 *
 * @param invoiceString - BOLT-11 invoice string (e.g., "lnbc...")
 * @param preimage - Hex-encoded preimage to verify
 * @returns true if SHA256(preimage) matches the invoice's payment_hash
 */
export function verifyPreimage(invoiceString: string, preimage: string): boolean {
  const invoice = new Invoice({ pr: invoiceString });
  return invoice.validatePreimage(preimage);
}
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `client.makeHoldInvoice({ amount, payment_hash })` | Create hold invoice | NWCClient |
| `client.settleHoldInvoice({ preimage })` | Release funds to recipient | NWCClient |
| `client.cancelHoldInvoice({ payment_hash })` | Refund payer | NWCClient |
| `client.subscribeNotifications(cb, ['hold_invoice_accepted'])` | Listen for held payments | NWCClient |
| `fromHexString(hex)` | Convert hex string to bytes | lightning-tools |
| `Invoice.validatePreimage(preimage)` | Verify preimage matches invoice | lightning-tools |

---

## Test Requirements (TDD)

### Unit Tests

**File**: `tests/unit/lib/crypto.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  toHexString,
  fromHexString,
  generatePreimageAndHash,
  verifyPreimage,
} from '@/lib/crypto';

// Mock the Invoice class from lightning-tools/bolt11 subpath
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  fromHexString: vi.fn().mockImplementation((hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }),
  Invoice: vi.fn().mockImplementation(({ pr }) => ({
    paymentHash: 'mock_payment_hash',
    // Mock validatePreimage to return true for specific preimage
    validatePreimage: vi.fn().mockImplementation((preimage: string) => {
      return preimage === 'valid_preimage_hex';
    }),
  })),
}));

describe('crypto utilities', () => {
  describe('toHexString', () => {
    it('converts bytes to hex', () => {
      const bytes = new Uint8Array([0, 15, 255]);
      expect(toHexString(bytes)).toBe('000fff');
    });

    it('handles empty array', () => {
      expect(toHexString(new Uint8Array([]))).toBe('');
    });
  });

  describe('fromHexString (re-exported from SDK)', () => {
    it('converts hex to bytes', () => {
      const bytes = fromHexString('000fff');
      expect(bytes).toEqual(new Uint8Array([0, 15, 255]));
    });
  });

  describe('generatePreimageAndHash', () => {
    it('generates 32-byte preimage (64 hex chars)', async () => {
      const { preimage } = await generatePreimageAndHash();
      expect(preimage).toHaveLength(64);
      expect(preimage).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates 32-byte payment hash (64 hex chars)', async () => {
      const { paymentHash } = await generatePreimageAndHash();
      expect(paymentHash).toHaveLength(64);
      expect(paymentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates unique values each time', async () => {
      const result1 = await generatePreimageAndHash();
      const result2 = await generatePreimageAndHash();
      expect(result1.preimage).not.toBe(result2.preimage);
      expect(result1.paymentHash).not.toBe(result2.paymentHash);
    });

    it('preimage and hash are different', async () => {
      const { preimage, paymentHash } = await generatePreimageAndHash();
      expect(preimage).not.toBe(paymentHash);
    });
  });

  describe('verifyPreimage', () => {
    it('delegates to SDK Invoice.validatePreimage()', () => {
      const result = verifyPreimage('lnbc...', 'valid_preimage_hex');
      expect(result).toBe(true);
    });

    it('returns false for invalid preimage', () => {
      const result = verifyPreimage('lnbc...', 'invalid_preimage');
      expect(result).toBe(false);
    });
  });
});
```

**File**: `tests/unit/hooks/useHoldInvoice.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHoldInvoice } from '@/hooks/useHoldInvoice';

// Mock NWCClient
const mockMakeHoldInvoice = vi.fn().mockResolvedValue({
  invoice: 'lnbc...',
});
const mockSettleHoldInvoice = vi.fn().mockResolvedValue({});
const mockCancelHoldInvoice = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    makeHoldInvoice: mockMakeHoldInvoice,
    settleHoldInvoice: mockSettleHoldInvoice,
    cancelHoldInvoice: mockCancelHoldInvoice,
  }),
}));

describe('useHoldInvoice', () => {
  it('creates hold invoice with generated preimage', async () => {
    const { result } = renderHook(() => useHoldInvoice('bob'));

    let holdInvoice;
    await act(async () => {
      holdInvoice = await result.current.createHoldInvoice({
        amount: 1000000,
        description: 'Test',
      });
    });

    expect(holdInvoice).toHaveProperty('preimage');
    expect(holdInvoice).toHaveProperty('paymentHash');
    expect(holdInvoice?.state).toBe('created');
  });

  it('settles hold invoice', async () => {
    const { result } = renderHook(() => useHoldInvoice('bob'));

    await act(async () => {
      await result.current.settleHoldInvoice('preimage123');
    });

    expect(mockSettleHoldInvoice).toHaveBeenCalledWith({ preimage: 'preimage123' });
  });

  it('cancels hold invoice', async () => {
    const { result } = renderHook(() => useHoldInvoice('bob'));

    await act(async () => {
      await result.current.cancelHoldInvoice('hash123');
    });

    expect(mockCancelHoldInvoice).toHaveBeenCalledWith({ payment_hash: 'hash123' });
  });
});
```

---

## File Structure

```
src/pages/4-HoldInvoice/
├── index.tsx                    # Main page component
└── components/
    ├── CreateHoldInvoice.tsx
    ├── HoldInvoiceStatus.tsx
    └── PayHoldInvoice.tsx

src/hooks/
└── useHoldInvoice.ts            # Add to src/hooks/index.ts exports

src/lib/
└── crypto.ts
```

---

## Acceptance Criteria

- [ ] Bob can create hold invoice with amount/description
- [ ] Preimage and hash are generated correctly
- [ ] Invoice is displayed with QR code
- [ ] Alice can pay the hold invoice
- [ ] Status updates to "Held" when payment received
- [ ] Bob can settle to receive funds
- [ ] Bob can cancel to refund Alice
- [ ] Final states display correctly
- [ ] Preimage verification works
- [ ] All tests pass

## Related Specifications

- [09-scenario-3-notifications.md](./09-scenario-3-notifications.md) - Uses hold_invoice_accepted notifications
- [11-scenario-5-proof-of-payment.md](./11-scenario-5-proof-of-payment.md) - Preimage verification
