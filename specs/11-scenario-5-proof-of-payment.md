# Specification 11: Scenario 5 - Proof of Payment

## Purpose

Demonstrate how the preimage returned from a payment can be used as cryptographic proof that the payment was made, by verifying it matches the invoice's payment hash.

## Dependencies

- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Basic payment flow

**SDK Dependencies:**
- `Invoice` class from `@getalby/lightning-tools/bolt11` - for `validatePreimage()` method

## User Story

> As a developer, I want to understand how payment preimages work as proof-of-payment so I can implement systems where Alice proves she paid Bob.

---

## How Proof of Payment Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Proof of Payment Concept                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Invoice Creation (Bob):                                                 │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  1. Bob creates invoice with payment_hash = H                  │     │
│  │     (H is embedded in the BOLT-11 invoice)                     │     │
│  │  2. Only Bob knows the preimage P where SHA256(P) = H         │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Payment (Alice):                                                        │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  1. Alice pays the invoice                                     │     │
│  │  2. When payment succeeds, Alice receives the preimage P      │     │
│  │  3. The preimage is proof: only someone who paid can have it  │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Verification (Anyone):                                                  │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  1. Extract payment_hash H from the invoice                    │     │
│  │  2. Compute SHA256(preimage)                                   │     │
│  │  3. If SHA256(preimage) === H, payment is proven               │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/5-ProofOfPayment/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { InvoiceCreator } from './components/InvoiceCreator';
import { PayAndProve } from './components/PayAndProve';
import { PreimageVerifier } from './components/PreimageVerifier';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

export default function ProofOfPayment() {
  const [invoice, setInvoice] = useState<Nip47Transaction | null>(null);
  const [preimage, setPreimage] = useState<string | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleReset = () => {
    setInvoice(null);
    setPreimage(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Proof of Payment"
      description="Alice pays Bob and receives a preimage that cryptographically proves the payment was made."
      aliceContent={
        aliceWallet.status === 'connected' && invoice && (
          <PayAndProve
            invoice={invoice}
            onPreimageReceived={setPreimage}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          invoice ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Invoice created! Payment hash is embedded in the invoice.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Create new invoice
              </button>
            </div>
          ) : (
            <InvoiceCreator
              onInvoiceCreated={setInvoice}
              onLog={addLog}
            />
          )
        )
      }
      logs={entries}
    >
      {/* Verification section */}
      <PreimageVerifier
        invoice={invoice}
        preimage={preimage}
        onLog={addLog}
      />
    </ScenarioPage>
  );
}
```

---

## Components

### InvoiceCreator

**File**: `src/pages/5-ProofOfPayment/components/InvoiceCreator.tsx`

```typescript
import { useState } from 'react';
import { Button, Input, QRCode, CopyButton } from '@/components/ui';
import { useInvoice } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface InvoiceCreatorProps {
  onInvoiceCreated: (invoice: Nip47Transaction) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function InvoiceCreator({ onInvoiceCreated, onLog }: InvoiceCreatorProps) {
  const [amount, setAmount] = useState('1000');
  const { createInvoice, loading, error, invoice } = useInvoice('bob');

  const handleCreate = async () => {
    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < 1) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog('Creating invoice...', 'info');
    try {
      const inv = await createInvoice({
        amount: amountSats * CONSTANTS.MILLISATS_PER_SAT,
        description: 'Proof of Payment Demo',
      });
      onLog(`Invoice created with payment_hash: ${inv.payment_hash.slice(0, 16)}...`, 'success');
      onInvoiceCreated(inv);
    } catch (err) {
      onLog(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={1}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleCreate} loading={loading} className="w-full">
        Create Invoice
      </Button>
    </div>
  );
}
```

### PayAndProve

**File**: `src/pages/5-ProofOfPayment/components/PayAndProve.tsx`

```typescript
import { useState } from 'react';
import { Button, Badge, CopyButton } from '@/components/ui';
import { usePayment } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';
import type { PaymentResult } from '@/types';

interface PayAndProveProps {
  invoice: Nip47Transaction;
  onPreimageReceived: (preimage: string) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayAndProve({ invoice, onPreimageReceived, onLog }: PayAndProveProps) {
  const [preimage, setPreimage] = useState<string | null>(null);
  const { payInvoice, loading, error } = usePayment('alice');
  const amountSats = Math.floor(invoice.amount / CONSTANTS.MILLISATS_PER_SAT);

  const handlePay = async () => {
    onLog('Paying invoice...', 'info');
    try {
      const result = await payInvoice(invoice.invoice);
      setPreimage(result.preimage);
      onPreimageReceived(result.preimage);
      onLog(`Payment successful! Received preimage: ${result.preimage.slice(0, 16)}...`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Invoice summary */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Amount:</span>
          <span className="font-medium">{amountSats.toLocaleString()} sats</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-600">Payment Hash:</span>
          <span className="font-mono text-xs">{invoice.payment_hash.slice(0, 20)}...</span>
        </div>
      </div>

      {!preimage ? (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handlePay} loading={loading} className="w-full">
            Pay Invoice
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="success">Payment Complete</Badge>
            </div>
            <p className="text-sm text-green-700 mb-2">
              You received the preimage as proof of payment:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white rounded border text-xs font-mono break-all">
                {preimage}
              </code>
              <CopyButton value={preimage} />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>This preimage is your proof.</strong> Anyone can verify
              that SHA-256(preimage) equals the payment hash in the invoice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### PreimageVerifier

**File**: `src/pages/5-ProofOfPayment/components/PreimageVerifier.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button, Input, Badge, CopyButton } from '@/components/ui';
import { Invoice } from '@getalby/lightning-tools/bolt11';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface PreimageVerifierProps {
  invoice: Nip47Transaction | null;
  preimage: string | null;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PreimageVerifier({ invoice, preimage, onLog }: PreimageVerifierProps) {
  const [manualInvoice, setManualInvoice] = useState('');
  const [manualPreimage, setManualPreimage] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    paymentHash: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-verify when both values are available from payment flow
  useEffect(() => {
    if (invoice && preimage) {
      handleVerify(invoice.invoice, preimage);
    }
  }, [invoice, preimage]);

  const handleVerify = (paymentRequest: string, preimageToVerify: string) => {
    setIsVerifying(true);
    onLog('Verifying preimage...', 'info');

    try {
      // Use the SDK's Invoice class for verification - don't roll your own crypto!
      const inv = new Invoice({ pr: paymentRequest });
      const valid = inv.validatePreimage(preimageToVerify);

      setVerificationResult({
        valid,
        paymentHash: inv.paymentHash,
      });

      if (valid) {
        onLog('Verification successful! Preimage matches payment hash.', 'success');
      } else {
        onLog('Verification failed! Preimage does not match.', 'error');
      }
    } catch (err) {
      onLog(`Verification error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = () => {
    if (!manualInvoice || !manualPreimage) {
      onLog('Please enter both invoice and preimage', 'error');
      return;
    }

    handleVerify(manualInvoice, manualPreimage);
  };

  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold mb-4">Preimage Verification</h3>

      {/* Auto-verification result */}
      {verificationResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          verificationResult.valid
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {verificationResult.valid ? (
              <>
                <span className="text-2xl">✅</span>
                <Badge variant="success">Verified</Badge>
                <span className="text-green-800 font-medium">Payment Proven!</span>
              </>
            ) : (
              <>
                <span className="text-2xl">❌</span>
                <Badge variant="error">Invalid</Badge>
                <span className="text-red-800 font-medium">Preimage does not match</span>
              </>
            )}
          </div>

          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-slate-600">Payment Hash:</span>
              <div className="bg-white p-2 rounded mt-1 break-all text-xs">
                {verificationResult.paymentHash}
              </div>
            </div>
            <div className="pt-2 text-center">
              {verificationResult.valid ? (
                <span className="text-green-700">
                  SHA256(preimage) matches payment hash. Payment is proven!
                </span>
              ) : (
                <span className="text-red-700">
                  SHA256(preimage) does not match payment hash.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual verification form */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
          Verify manually with any invoice/preimage
        </summary>
        <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg">
          <Input
            label="BOLT-11 Invoice"
            value={manualInvoice}
            onChange={(e) => setManualInvoice(e.target.value)}
            placeholder="lnbc..."
          />
          <Input
            label="Preimage (hex)"
            value={manualPreimage}
            onChange={(e) => setManualPreimage(e.target.value)}
            placeholder="64-character hex string"
          />
          <Button
            onClick={handleManualVerify}
            loading={isVerifying}
            variant="secondary"
            className="w-full"
          >
            Verify Preimage
          </Button>
        </div>
      </details>

      {/* Educational content */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-900 mb-2">Why This Matters</h4>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>The preimage is revealed only when payment succeeds</li>
          <li>It's cryptographically impossible to guess the preimage</li>
          <li>Anyone can verify the proof without trusting Alice or Bob</li>
          <li>Used in atomic swaps, escrow, and dispute resolution</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Test Requirements (TDD)

### Unit Tests

**File**: `tests/unit/pages/ProofOfPayment.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreimageVerifier } from '@/pages/5-ProofOfPayment/components/PreimageVerifier';

// Mock the Invoice class from lightning-tools bolt11 subpath
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  Invoice: vi.fn().mockImplementation(({ pr }) => ({
    paymentHash: 'abc123def456...',
    validatePreimage: vi.fn().mockReturnValue(true),
  })),
}));

describe('PreimageVerifier', () => {
  it('shows verified state when preimage matches', async () => {
    const invoice = {
      payment_hash: 'abc123...',
      invoice: 'lnbc...',
      amount: 1000000,
    };
    // Use a real preimage/hash pair for testing
    // In real tests, generate a valid pair

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="matching_preimage"
        onLog={() => {}}
      />
    );

    // Would need valid preimage/hash for full test
  });

  it('shows invalid state when preimage does not match', async () => {
    // Test with mismatched preimage
  });

  it('allows manual verification', async () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={() => {}}
      />
    );

    // Open manual verification
    await userEvent.click(screen.getByText(/verify manually/i));

    expect(screen.getByLabelText(/bolt-11 invoice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preimage/i)).toBeInTheDocument();
  });
});
```

---

## File Structure

```
src/pages/5-ProofOfPayment/
├── index.tsx                    # Main page component
└── components/
    ├── InvoiceCreator.tsx
    ├── PayAndProve.tsx
    └── PreimageVerifier.tsx
```

---

## Acceptance Criteria

- [ ] Bob can create invoice (payment hash embedded)
- [ ] Alice can pay and receive preimage
- [ ] Automatic verification shows hash comparison
- [ ] Valid preimage shows "Verified" state
- [ ] Invalid preimage shows "Invalid" state
- [ ] Manual verification works with any invoice/preimage
- [ ] Educational content explains the concept
- [ ] All tests pass

## Related Specifications

- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Payment flow
