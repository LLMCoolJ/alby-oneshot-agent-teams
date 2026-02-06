# Specification 08: Scenario 2 - Lightning Address Payment

## Purpose

Demonstrate paying to a Lightning Address without manually creating an invoice. The system fetches LNURL data and handles invoice creation automatically.

## Dependencies

- [05-wallet-context.md](./05-wallet-context.md) - Wallet hooks
- [06-layout.md](./06-layout.md) - ScenarioPage template
- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Similar flow patterns

## User Story

> As a user, I want to pay someone using just their Lightning Address (like an email) without needing them to create an invoice first.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Lightning Address Payment                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bob displays his Lightning Address                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Bob's Wallet                                                    │   │
│  │                                                                  │   │
│  │  My Lightning Address:                                           │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  bob@testnet.getalby.com                          [Copy] │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Alice pays Bob's address                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Alice's Wallet                                                  │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Lightning Address: bob@testnet.getalby.com               │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Amount (sats): 1000                                      │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Comment (optional): Thanks for the coffee!               │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  │  [Pay Lightning Address]                                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Behind the scenes:                                                      │
│  1. Fetch LNURL-pay data from address                                   │
│  2. Validate amount is within min/max                                   │
│  3. Request invoice from recipient                                       │
│  4. Pay the invoice                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/2-LightningAddress/index.tsx`

```typescript
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { LightningAddressDisplay } from './components/LightningAddressDisplay';
import { PayToAddressForm } from './components/PayToAddressForm';
import { useTransactionLog, useWallet } from '@/hooks';

export default function LightningAddressPage() {
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Lightning Address Payment"
      description="Pay to a Lightning Address (like email) without needing an invoice. The system handles invoice creation automatically."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <PayToAddressForm onLog={addLog} />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <LightningAddressDisplay />
        )
      }
      logs={entries}
    />
  );
}
```

---

## Components

### LightningAddressDisplay

**File**: `src/pages/2-LightningAddress/components/LightningAddressDisplay.tsx`

```typescript
import { CopyButton, Badge } from '@/components/ui';
import { useWallet } from '@/hooks';

export function LightningAddressDisplay() {
  const bobWallet = useWallet('bob');
  const lightningAddress = bobWallet.info?.lud16;

  if (!lightningAddress) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          No Lightning Address found for this wallet. The wallet may not support LNURL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          My Lightning Address
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-slate-50 rounded-lg font-mono text-sm">
            {lightningAddress}
          </div>
          <CopyButton value={lightningAddress} />
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">How it works</h4>
        <p className="text-xs text-blue-700">
          A Lightning Address works like an email. When someone pays it, the system
          automatically fetches payment details and creates an invoice on your behalf.
        </p>
      </div>
    </div>
  );
}
```

### PayToAddressForm

**File**: `src/pages/2-LightningAddress/components/PayToAddressForm.tsx`

```typescript
import { useState } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import { useLightningAddressPayment } from '@/hooks/useLightningAddressPayment';
import { isLightningAddress, CONSTANTS } from '@/types';

interface PayToAddressFormProps {
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function PayToAddressForm({ onLog }: PayToAddressFormProps) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('1000');
  const [comment, setComment] = useState('');
  const {
    payToAddress,
    loading,
    error,
    addressInfo,
    fetchAddressInfo,
    result,
    reset,
  } = useLightningAddressPayment('alice');

  const handleAddressBlur = async () => {
    if (isLightningAddress(address)) {
      onLog(`Fetching LNURL data for ${address}...`, 'info');
      try {
        await fetchAddressInfo(address);
        onLog('LNURL data fetched successfully', 'success');
      } catch (err) {
        onLog(`Failed to fetch address info: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLightningAddress(address)) {
      onLog('Invalid Lightning Address format', 'error');
      return;
    }

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < CONSTANTS.MIN_PAYMENT_SATS) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog(`Paying ${amountSats} sats to ${address}...`, 'info');

    try {
      const paymentResult = await payToAddress({
        address,
        amount: amountSats,
        comment: comment || undefined,
      });
      onLog(`Payment successful! Preimage: ${paymentResult.preimage.slice(0, 16)}...`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Payment Successful!</span>
          </div>
          <div className="text-sm text-green-700">
            <p>Paid to: {address}</p>
            <p>Amount: {amount} sats</p>
          </div>
        </div>
        <Button variant="secondary" onClick={reset} className="w-full">
          Make Another Payment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Lightning Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onBlur={handleAddressBlur}
        placeholder="bob@testnet.getalby.com"
        error={!address || isLightningAddress(address) ? undefined : 'Invalid format'}
      />

      {addressInfo && (
        <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Min:</span>
            <span>{addressInfo.min.toLocaleString()} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Max:</span>
            <span>{addressInfo.max.toLocaleString()} sats</span>
          </div>
          {addressInfo.description && (
            <div className="pt-1 border-t">
              <span className="text-slate-600">{addressInfo.description}</span>
            </div>
          )}
        </div>
      )}

      <Input
        label="Amount (sats)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={addressInfo?.min ?? CONSTANTS.MIN_PAYMENT_SATS}
        max={addressInfo?.max}
        placeholder="1000"
        required
      />

      <Input
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Thanks for the coffee!"
        hint={addressInfo?.commentAllowed ? `Up to ${addressInfo.commentAllowed} characters` : 'Comments not supported'}
        disabled={!addressInfo?.commentAllowed}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} disabled={!address || !amount} className="w-full">
        Pay Lightning Address
      </Button>
    </form>
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

## Custom Hook: useLightningAddressPayment

**File**: `src/hooks/useLightningAddressPayment.ts`

```typescript
import { useState, useCallback } from 'react';
import { LightningAddress } from '@getalby/lightning-tools/lnurl';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, LightningAddressPayment, PaymentResult } from '@/types';

interface AddressInfo {
  min: number;
  max: number;
  description: string;
  commentAllowed: number | undefined;
  fixed: boolean;
}

interface UseLightningAddressPaymentReturn {
  payToAddress: (payment: LightningAddressPayment) => Promise<PaymentResult>;
  fetchAddressInfo: (address: string) => Promise<AddressInfo>;
  loading: boolean;
  error: string | null;
  addressInfo: AddressInfo | null;
  result: PaymentResult | null;
  reset: () => void;
}

export function useLightningAddressPayment(walletId: WalletId): UseLightningAddressPaymentReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  // Cache LightningAddress instances
  const [lnAddress, setLnAddress] = useState<LightningAddress | null>(null);

  const fetchAddressInfo = useCallback(async (address: string): Promise<AddressInfo> => {
    setLoading(true);
    setError(null);

    try {
      const ln = new LightningAddress(address);
      await ln.fetch();
      setLnAddress(ln);

      if (!ln.lnurlpData) {
        throw new Error('Failed to fetch LNURL-pay data');
      }

      const info: AddressInfo = {
        min: ln.lnurlpData.min,
        max: ln.lnurlpData.max,
        description: ln.lnurlpData.description,
        commentAllowed: ln.lnurlpData.commentAllowed,
        fixed: ln.lnurlpData.fixed,
      };

      setAddressInfo(info);
      return info;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch address info';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const payToAddress = useCallback(async (payment: LightningAddressPayment): Promise<PaymentResult> => {
    if (!client) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Use cached LightningAddress or create new one
      let ln = lnAddress;
      if (!ln || ln.address !== payment.address) {
        ln = new LightningAddress(payment.address);
        await ln.fetch();
        setLnAddress(ln);
      }

      // Request invoice from the Lightning Address
      const invoice = await ln.requestInvoice({
        satoshi: payment.amount,
        comment: payment.comment,
      });

      // Pay the invoice
      const response = await client.payInvoice({ invoice: invoice.paymentRequest });

      const paymentResult: PaymentResult = {
        preimage: response.preimage,
        feesPaid: response.fees_paid,
      };

      setResult(paymentResult);
      await refreshBalance();

      return paymentResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, lnAddress, refreshBalance]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setAddressInfo(null);
    setLnAddress(null);
  }, []);

  return {
    payToAddress,
    fetchAddressInfo,
    loading,
    error,
    addressInfo,
    result,
    reset,
  };
}
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `new LightningAddress(address)` | Create address instance | lightning-tools |
| `ln.fetch()` | Fetch LNURL-pay data | lightning-tools |
| `ln.requestInvoice({ satoshi, comment })` | Request invoice | lightning-tools |
| `client.payInvoice({ invoice })` | Pay the invoice | NWCClient |

---

## Test Requirements (TDD)

### Unit Tests

**File**: `tests/unit/pages/LightningAddress.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightningAddressDisplay } from '@/pages/2-LightningAddress/components/LightningAddressDisplay';
import { PayToAddressForm } from '@/pages/2-LightningAddress/components/PayToAddressForm';
import { useLightningAddressPayment } from '@/hooks/useLightningAddressPayment';

// Mock hooks
vi.mock('@/hooks', () => ({
  useWallet: vi.fn().mockReturnValue({
    status: 'connected',
    info: { lud16: 'bob@testnet.getalby.com' },
  }),
}));

vi.mock('@/hooks/useLightningAddressPayment', () => ({
  useLightningAddressPayment: vi.fn().mockReturnValue({
    payToAddress: vi.fn().mockResolvedValue({ preimage: 'abc123', feesPaid: 0 }),
    fetchAddressInfo: vi.fn().mockResolvedValue({
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    }),
    loading: false,
    error: null,
    addressInfo: null,
    result: null,
    reset: vi.fn(),
  }),
}));

describe('LightningAddressDisplay', () => {
  it('displays the Lightning Address from wallet info', () => {
    render(<LightningAddressDisplay />);
    expect(screen.getByText('bob@testnet.getalby.com')).toBeInTheDocument();
  });

  it('shows warning when no Lightning Address available', () => {
    vi.mocked(require('@/hooks').useWallet).mockReturnValue({
      status: 'connected',
      info: { lud16: undefined },
    });

    render(<LightningAddressDisplay />);
    expect(screen.getByText(/no lightning address found/i)).toBeInTheDocument();
  });

  it('includes copy button', () => {
    render(<LightningAddressDisplay />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('PayToAddressForm', () => {
  it('validates Lightning Address format', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'not-an-address');
    expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
  });

  it('fetches address info on blur', async () => {
    const mockFetchAddressInfo = vi.fn().mockResolvedValue({
      min: 1, max: 1000000, description: 'Test',
    });

    vi.mocked(require('@/hooks/useLightningAddressPayment').useLightningAddressPayment)
      .mockReturnValue({
        fetchAddressInfo: mockFetchAddressInfo,
        loading: false,
        error: null,
        addressInfo: null,
        result: null,
        payToAddress: vi.fn(),
        reset: vi.fn(),
      });

    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    const input = screen.getByLabelText(/lightning address/i);
    await userEvent.type(input, 'bob@getalby.com');
    await userEvent.tab(); // blur

    expect(mockFetchAddressInfo).toHaveBeenCalledWith('bob@getalby.com');
  });

  it('shows min/max when address info is available', () => {
    vi.mocked(require('@/hooks/useLightningAddressPayment').useLightningAddressPayment)
      .mockReturnValue({
        addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: 255 },
        loading: false,
        error: null,
        result: null,
        payToAddress: vi.fn(),
        fetchAddressInfo: vi.fn(),
        reset: vi.fn(),
      });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText('1 sats')).toBeInTheDocument();
    expect(screen.getByText('1,000,000 sats')).toBeInTheDocument();
  });

  it('disables comment field when not supported', () => {
    vi.mocked(require('@/hooks/useLightningAddressPayment').useLightningAddressPayment)
      .mockReturnValue({
        addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: undefined },
        loading: false,
        error: null,
        result: null,
        payToAddress: vi.fn(),
        fetchAddressInfo: vi.fn(),
        reset: vi.fn(),
      });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByLabelText(/comment/i)).toBeDisabled();
  });
});
```

### Hook Tests

**File**: `tests/unit/hooks/useLightningAddressPayment.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLightningAddressPayment } from '@/hooks/useLightningAddressPayment';

// Mock LightningAddress (must match import path)
vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: vi.fn().mockImplementation(() => ({
    address: 'test@getalby.com',
    fetch: vi.fn().mockResolvedValue(undefined),
    lnurlpData: {
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    },
    requestInvoice: vi.fn().mockResolvedValue({
      paymentRequest: 'lnbc1000n1...',
    }),
  })),
}));

// Mock useNWCClient
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

describe('useLightningAddressPayment', () => {
  it('fetches address info correctly', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    expect(result.current.addressInfo).toEqual({
      min: 1,
      max: 1000000,
      description: 'Test',
      commentAllowed: 255,
      fixed: false,
    });
  });

  it('pays to address successfully', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      const paymentResult = await result.current.payToAddress({
        address: 'test@getalby.com',
        amount: 1000,
      });
      expect(paymentResult.preimage).toBe('preimage123');
    });

    expect(result.current.result).toBeDefined();
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useLightningAddressPayment('alice'));

    await act(async () => {
      await result.current.fetchAddressInfo('test@getalby.com');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.addressInfo).toBeNull();
    expect(result.current.result).toBeNull();
  });
});
```

---

## File Structure

```
src/pages/2-LightningAddress/
├── index.tsx                       # Main page component
└── components/
    ├── LightningAddressDisplay.tsx
    └── PayToAddressForm.tsx

src/hooks/
└── useLightningAddressPayment.ts
```

---

## Acceptance Criteria

- [ ] Bob's Lightning Address is displayed if available
- [ ] Warning shown when Lightning Address not available
- [ ] Lightning Address format is validated
- [ ] LNURL-pay data is fetched on blur
- [ ] Min/max amounts are displayed
- [ ] Comment field respects server settings
- [ ] Payment executes successfully
- [ ] Balance updates after payment
- [ ] Error states handled gracefully
- [ ] All tests pass

## Related Specifications

- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Similar payment patterns
- [13-scenario-7-nostr-zap.md](./13-scenario-7-nostr-zap.md) - Uses Lightning Address for zaps
