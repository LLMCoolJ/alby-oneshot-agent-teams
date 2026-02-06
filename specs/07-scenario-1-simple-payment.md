# Specification 07: Scenario 1 - Simple Invoice Payment

## Purpose

Implement the simplest Lightning payment flow: Bob creates an invoice, Alice pays it.

## Dependencies

- [04-shared-components.md](./04-shared-components.md) - UI components
- [05-wallet-context.md](./05-wallet-context.md) - Wallet hooks
- [06-layout.md](./06-layout.md) - ScenarioPage template

## User Story

> As a developer learning Lightning, I want to see the basic invoice payment flow so I understand how BOLT-11 invoices work.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Simple Invoice Payment                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: Bob creates invoice                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Bob's Wallet                                                    │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │ Amount (sats)    │  │ Description      │                     │   │
│  │  │ [___1000_____]   │  │ [_Coffee_______] │                     │   │
│  │  └──────────────────┘  └──────────────────┘                     │   │
│  │  [Create Invoice]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 2: Invoice displayed                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────┐                                                   │   │
│  │  │ QR Code   │  lnbc1000n1pj...                                 │   │
│  │  │           │  [Copy]                                           │   │
│  │  └───────────┘                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 3: Alice pays invoice                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Alice's Wallet                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Invoice                                                   │   │   │
│  │  │ [_lnbc1000n1pj..._________________________________]       │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │  Amount: 1,000 sats | Description: Coffee                       │   │
│  │  [Pay Invoice]                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 4: Payment confirmed                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Payment successful!                                          │   │
│  │  Preimage: 5a8f3b2c...                                          │   │
│  │  Fees paid: 0 sats                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/1-SimplePayment/index.tsx`

```typescript
import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { CreateInvoiceForm } from './components/CreateInvoiceForm';
import { InvoiceDisplay } from './components/InvoiceDisplay';
import { PayInvoiceForm } from './components/PayInvoiceForm';
import { PaymentResultDisplay } from './components/PaymentResultDisplay';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Nip47Transaction } from '@getalby/sdk/nwc';
import type { PaymentResult } from '@/types';

export default function SimplePayment() {
  const [invoice, setInvoice] = useState<Nip47Transaction | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();

  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleInvoiceCreated = (inv: Nip47Transaction) => {
    setInvoice(inv);
    setPaymentResult(null);
    addLog(`Invoice created for ${inv.amount / 1000} sats`, 'success');
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    addLog(`Payment successful! Preimage: ${result.preimage.slice(0, 16)}...`, 'success');
  };

  const handleReset = () => {
    setInvoice(null);
    setPaymentResult(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Simple Invoice Payment"
      description="Bob creates a BOLT-11 invoice, Alice pays it. The fundamental Lightning payment flow."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <div className="space-y-4 mt-4">
            <PayInvoiceForm
              onPaymentSuccess={handlePaymentSuccess}
              onLog={addLog}
              disabled={paymentResult !== null}
            />
            {paymentResult && (
              <PaymentResultDisplay result={paymentResult} />
            )}
          </div>
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <div className="space-y-4 mt-4">
            {!invoice ? (
              <CreateInvoiceForm
                onInvoiceCreated={handleInvoiceCreated}
                onLog={addLog}
              />
            ) : (
              <InvoiceDisplay
                invoice={invoice}
                onReset={handleReset}
              />
            )}
          </div>
        )
      }
      logs={entries}
    />
  );
}
```

---

## Components

### CreateInvoiceForm

**File**: `src/pages/1-SimplePayment/components/CreateInvoiceForm.tsx`

```typescript
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useInvoice } from '@/hooks';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface CreateInvoiceFormProps {
  onInvoiceCreated: (invoice: Nip47Transaction) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function CreateInvoiceForm({ onInvoiceCreated, onLog }: CreateInvoiceFormProps) {
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('');
  const { createInvoice, loading, error } = useInvoice('bob');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < CONSTANTS.MIN_PAYMENT_SATS) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog('Creating invoice...', 'info');

    try {
      const invoice = await createInvoice({
        amount: amountSats * CONSTANTS.MILLISATS_PER_SAT,
        description: description || 'Lightning Demo Payment',
      });
      onInvoiceCreated(invoice);
    } catch (err) {
      onLog(`Failed to create invoice: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={CONSTANTS.MIN_PAYMENT_SATS}
        placeholder="1000"
        required
      />
      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this payment for?"
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Create Invoice
      </Button>
    </form>
  );
}
```

### InvoiceDisplay

**File**: `src/pages/1-SimplePayment/components/InvoiceDisplay.tsx`

```typescript
import { QRCode, Button, CopyButton } from '@/components/ui';
import { CONSTANTS } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface InvoiceDisplayProps {
  invoice: Nip47Transaction;
  onReset: () => void;
}

export function InvoiceDisplay({ invoice, onReset }: InvoiceDisplayProps) {
  const amountSats = Math.floor(invoice.amount / CONSTANTS.MILLISATS_PER_SAT);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-2">Invoice for</p>
        <p className="text-2xl font-bold text-slate-900">
          {amountSats.toLocaleString()} sats
        </p>
        {invoice.description && (
          <p className="text-sm text-slate-600 mt-1">{invoice.description}</p>
        )}
      </div>

      <div className="flex justify-center">
        <QRCode
          value={invoice.invoice}
          size={200}
          label="Scan to pay"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={invoice.invoice}
            readOnly
            className="input-field font-mono text-xs flex-1"
          />
          <CopyButton value={invoice.invoice} />
        </div>
      </div>

      <div className="pt-2">
        <Button variant="secondary" onClick={onReset} className="w-full">
          Create New Invoice
        </Button>
      </div>
    </div>
  );
}
```

### PayInvoiceForm

**File**: `src/pages/1-SimplePayment/components/PayInvoiceForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { usePayment } from '@/hooks';
import { decodeInvoice } from '@getalby/lightning-tools/bolt11';
import type { PaymentResult } from '@/types';

interface PayInvoiceFormProps {
  onPaymentSuccess: (result: PaymentResult) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  disabled?: boolean;
}

export function PayInvoiceForm({ onPaymentSuccess, onLog, disabled }: PayInvoiceFormProps) {
  const [invoice, setInvoice] = useState('');
  const [decodedInfo, setDecodedInfo] = useState<{
    amount: number;
    description: string | null;
  } | null>(null);
  const { payInvoice, loading, error } = usePayment('alice');

  // Decode invoice when pasted
  useEffect(() => {
    if (!invoice) {
      setDecodedInfo(null);
      return;
    }

    try {
      const decoded = decodeInvoice(invoice);
      if (decoded) {
        setDecodedInfo({
          amount: decoded.satoshi,
          description: decoded.description ?? null,
        });
      }
    } catch {
      setDecodedInfo(null);
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice.trim()) {
      onLog('Please enter an invoice', 'error');
      return;
    }

    onLog('Paying invoice...', 'info');

    try {
      const result = await payInvoice(invoice);
      onPaymentSuccess(result);
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="BOLT-11 Invoice"
        value={invoice}
        onChange={(e) => setInvoice(e.target.value)}
        placeholder="lnbc..."
        disabled={disabled}
      />

      {decodedInfo && (
        <div className="p-3 bg-slate-50 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Amount:</span>
            <span className="font-medium">{decodedInfo.amount.toLocaleString()} sats</span>
          </div>
          {decodedInfo.description && (
            <div className="flex justify-between mt-1">
              <span className="text-slate-600">Description:</span>
              <span className="font-medium truncate ml-2">{decodedInfo.description}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={disabled || !invoice}
        className="w-full"
      >
        Pay Invoice
      </Button>
    </form>
  );
}
```

### PaymentResultDisplay

**File**: `src/pages/1-SimplePayment/components/PaymentResultDisplay.tsx`

```typescript
import { Badge, CopyButton } from '@/components/ui';
import { CONSTANTS, PaymentResult } from '@/types';

interface PaymentResultDisplayProps {
  result: PaymentResult;
}

export function PaymentResultDisplay({ result }: PaymentResultDisplayProps) {
  const feesSats = Math.floor(result.feesPaid / CONSTANTS.MILLISATS_PER_SAT);

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <CheckIcon className="w-5 h-5 text-green-600" />
        <span className="font-medium text-green-800">Payment Successful!</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-slate-600">Preimage:</span>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 p-2 bg-white rounded border text-xs font-mono truncate">
              {result.preimage}
            </code>
            <CopyButton value={result.preimage} />
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Fees paid:</span>
          <span className="font-medium">{feesSats} sats</span>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `client.makeInvoice({ amount, description })` | Create BOLT-11 invoice | NWCClient |
| `client.payInvoice({ invoice })` | Pay BOLT-11 invoice | NWCClient |
| `client.getBalance()` | Refresh wallet balance | NWCClient |
| `decodeInvoice(bolt11)` | Extract invoice details | lightning-tools |

---

## Test Requirements (TDD)

### Unit Tests

**File**: `tests/unit/pages/SimplePayment.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateInvoiceForm } from '@/pages/1-SimplePayment/components/CreateInvoiceForm';
import { PayInvoiceForm } from '@/pages/1-SimplePayment/components/PayInvoiceForm';
import { InvoiceDisplay } from '@/pages/1-SimplePayment/components/InvoiceDisplay';
import { PaymentResultDisplay } from '@/pages/1-SimplePayment/components/PaymentResultDisplay';

// Mock hooks
vi.mock('@/hooks', () => ({
  useInvoice: vi.fn().mockReturnValue({
    createInvoice: vi.fn().mockResolvedValue({
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
      description: 'Test',
      payment_hash: 'abc123',
    }),
    loading: false,
    error: null,
  }),
  usePayment: vi.fn().mockReturnValue({
    payInvoice: vi.fn().mockResolvedValue({
      preimage: 'preimage123',
      feesPaid: 0,
    }),
    loading: false,
    error: null,
  }),
}));

describe('CreateInvoiceForm', () => {
  it('renders amount and description inputs', () => {
    render(<CreateInvoiceForm onInvoiceCreated={() => {}} onLog={() => {}} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('calls onInvoiceCreated when form is submitted', async () => {
    const onInvoiceCreated = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={onInvoiceCreated} onLog={() => {}} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onInvoiceCreated).toHaveBeenCalled();
    });
  });

  it('validates minimum amount', async () => {
    const onLog = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={() => {}} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
  });
});

describe('InvoiceDisplay', () => {
  const mockInvoice = {
    invoice: 'lnbc1000n1test...',
    amount: 1000000, // millisats
    description: 'Test Payment',
    payment_hash: 'abc123',
  };

  it('displays invoice amount in sats', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={() => {}} />);

    expect(screen.getByText('1,000 sats')).toBeInTheDocument();
  });

  it('renders QR code', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={() => {}} />);

    // QR code component should be present
    expect(screen.getByText(/scan to pay/i)).toBeInTheDocument();
  });

  it('includes copy button', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={() => {}} />);

    // Copy button functionality
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});

describe('PayInvoiceForm', () => {
  it('decodes invoice when pasted', async () => {
    render(<PayInvoiceForm onPaymentSuccess={() => {}} onLog={() => {}} />);

    // Note: Would need to mock decodeInvoice for full test
  });

  it('disables input when disabled prop is true', () => {
    render(<PayInvoiceForm onPaymentSuccess={() => {}} onLog={() => {}} disabled />);

    expect(screen.getByLabelText(/invoice/i)).toBeDisabled();
  });
});

describe('PaymentResultDisplay', () => {
  it('displays preimage', () => {
    const result = { preimage: 'abc123def456', feesPaid: 1000 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText(/abc123def456/)).toBeInTheDocument();
  });

  it('displays fees in sats', () => {
    const result = { preimage: 'abc123', feesPaid: 5000 }; // 5 sats in millisats
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('5 sats')).toBeInTheDocument();
  });
});
```

### Integration Tests

**File**: `tests/integration/simple-payment.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from '@/context/WalletContext';
import SimplePayment from '@/pages/1-SimplePayment';

describe('Simple Payment Flow', () => {
  it('completes full payment flow', async () => {
    // This test would require more extensive mocking of NWCClient
    // See testing-strategy.md for integration test approach
  });
});
```

---

## File Structure

```
src/pages/1-SimplePayment/
├── index.tsx                 # Main page component
└── components/
    ├── CreateInvoiceForm.tsx
    ├── InvoiceDisplay.tsx
    ├── PayInvoiceForm.tsx
    └── PaymentResultDisplay.tsx
```

---

## Acceptance Criteria

- [ ] Bob can enter amount and description
- [ ] Invoice is created and displayed as QR code
- [ ] Invoice can be copied to clipboard
- [ ] Alice can paste and decode invoice
- [ ] Invoice details (amount, description) are shown before paying
- [ ] Payment is executed successfully
- [ ] Preimage is displayed after payment
- [ ] Both wallet balances update after payment
- [ ] Transaction log shows all steps
- [ ] Error states are handled gracefully
- [ ] All tests pass

## Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid amount | Red text below input | User corrects input |
| Invoice creation failed | Toast + log entry | Retry button |
| Invalid invoice format | Red text below input | User pastes correct invoice |
| Payment failed | Toast + log entry | Show error details, retry |
| Insufficient balance | Specific error message | Prompt to fund wallet |

## Related Specifications

- [05-wallet-context.md](./05-wallet-context.md) - useInvoice, usePayment hooks
- [06-layout.md](./06-layout.md) - ScenarioPage, TransactionLog
- [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) - Similar payment flow
