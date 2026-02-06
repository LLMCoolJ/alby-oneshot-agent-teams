# Specification 09: Scenario 3 - Real-time Payment Notifications

## Purpose

Demonstrate subscribing to payment notifications and receiving real-time updates when payments are sent or received.

## Dependencies

- [04-shared-components.md](./04-shared-components.md) - UI components
- [05-wallet-context.md](./05-wallet-context.md) - NWC client access
- [06-layout.md](./06-layout.md) - ScenarioPage template
- [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) - useLightningAddressPayment hook

## User Story

> As a developer, I want to see how to subscribe to real-time payment notifications so my app can update immediately when payments arrive.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Real-time Payment Notifications                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bob subscribes to notifications                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Bob's Wallet                                                    │   │
│  │                                                                  │   │
│  │  Notification Status: ● Listening                               │   │
│  │  [Stop Listening]                                                │   │
│  │                                                                  │   │
│  │  Incoming Payments:                                              │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ 12:34:56  ⚡ Received 500 sats                            │  │   │
│  │  │ 12:34:45  ⚡ Received 1,000 sats                          │  │   │
│  │  │ 12:34:30  ⚡ Received 250 sats                            │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Alice sends multiple payments                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Alice's Wallet                                                  │   │
│  │                                                                  │   │
│  │  Quick Pay (no invoice needed):                                  │   │
│  │  ┌──────────────────┐  ┌───────────────────────────────────┐    │   │
│  │  │ Amount: [100]    │  │ Bob's Address: bob@test.getalby  │    │   │
│  │  └──────────────────┘  └───────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  [Send 100 sats] [Send 500 sats] [Send 1000 sats]               │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page Component

**File**: `src/pages/3-Notifications/index.tsx`

```typescript
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { NotificationSubscriber } from './components/NotificationSubscriber';
import { QuickPayButtons } from './components/QuickPayButtons';
import { useTransactionLog, useWallet } from '@/hooks';

export default function Notifications() {
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Real-time Payment Notifications"
      description="Bob subscribes to notifications and sees incoming payments in real-time as Alice sends them."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <QuickPayButtons
            recipientAddress={bobWallet.info?.lud16}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <NotificationSubscriber onLog={addLog} />
        )
      }
      logs={entries}
    />
  );
}
```

---

## Components

### NotificationSubscriber

**File**: `src/pages/3-Notifications/components/NotificationSubscriber.tsx`

```typescript
import { useState, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { CONSTANTS } from '@/types';
import type { NotificationEvent } from '@/types';

interface NotificationSubscriberProps {
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function NotificationSubscriber({ onLog }: NotificationSubscriberProps) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  const handleNotification = useCallback((event: NotificationEvent) => {
    setNotifications((prev) => [event, ...prev].slice(0, 50)); // Keep last 50
    const amountSats = Math.floor(event.transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
    onLog(`Received ${amountSats.toLocaleString()} sats`, 'success');
  }, [onLog]);

  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  } = useNotifications('bob', {
    onNotification: handleNotification,
    notificationTypes: ['payment_received'],
  });

  const handleToggle = async () => {
    if (isSubscribed) {
      unsubscribe();
      onLog('Stopped listening for notifications', 'info');
    } else {
      onLog('Subscribing to payment notifications...', 'info');
      try {
        await subscribe();
        onLog('Now listening for incoming payments', 'success');
      } catch (err) {
        onLog(`Failed to subscribe: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          {isSubscribed ? (
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Listening
              </span>
            </Badge>
          ) : (
            <Badge variant="default">Not listening</Badge>
          )}
        </div>
        <Button
          variant={isSubscribed ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleToggle}
        >
          {isSubscribed ? 'Stop Listening' : 'Start Listening'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Notifications list */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Incoming Payments
        </h4>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center">
            {isSubscribed
              ? 'Waiting for payments...'
              : 'Start listening to see incoming payments'
            }
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem key={notification.transaction.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationEvent }) {
  const amountSats = Math.floor(notification.transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
  const timeStr = notification.timestamp.toLocaleTimeString();

  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <span className="text-lg">⚡</span>
      <div className="flex-1">
        <span className="font-medium text-green-800">
          +{amountSats.toLocaleString()} sats
        </span>
        {notification.transaction.description && (
          <p className="text-xs text-green-700 truncate">
            {notification.transaction.description}
          </p>
        )}
      </div>
      <span className="text-xs text-green-600">{timeStr}</span>
    </div>
  );
}
```

### QuickPayButtons

**File**: `src/pages/3-Notifications/components/QuickPayButtons.tsx`

> **Note**: This component uses `useLightningAddressPayment` which is defined in [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) and should be exported from `src/hooks/index.ts`.

```typescript
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useLightningAddressPayment } from '@/hooks';

interface QuickPayButtonsProps {
  recipientAddress?: string;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const QUICK_AMOUNTS = [100, 500, 1000];

export function QuickPayButtons({ recipientAddress, onLog }: QuickPayButtonsProps) {
  const [address, setAddress] = useState(recipientAddress || '');
  const [sendingAmount, setSendingAmount] = useState<number | null>(null);
  const { payToAddress, loading, error } = useLightningAddressPayment('alice');

  const handleQuickPay = async (amount: number) => {
    if (!address) {
      onLog('Please enter a Lightning Address', 'error');
      return;
    }

    setSendingAmount(amount);
    onLog(`Sending ${amount} sats to ${address}...`, 'info');

    try {
      await payToAddress({ address, amount });
      onLog(`Sent ${amount} sats successfully!`, 'success');
    } catch (err) {
      onLog(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setSendingAmount(null);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Recipient Lightning Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="bob@testnet.getalby.com"
        hint="Enter Bob's Lightning Address to send payments"
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Quick Pay
        </label>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              onClick={() => handleQuickPay(amount)}
              loading={sendingAmount === amount}
              disabled={loading || !address}
            >
              {amount} sats
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Try it out!</h4>
        <p className="text-xs text-blue-700">
          Click the buttons above to send payments to Bob. If Bob is subscribed
          to notifications, they'll see the payments appear in real-time.
        </p>
      </div>
    </div>
  );
}
```

---

## Custom Hook: useNotifications

**File**: `src/hooks/useNotifications.ts`

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, NotificationEvent, NotificationType, Transaction } from '@/types';
import type { Nip47Notification, Nip47NotificationType } from '@getalby/sdk/nwc';

interface UseNotificationsOptions {
  onNotification?: (event: NotificationEvent) => void;
  notificationTypes?: NotificationType[];
}

interface UseNotificationsReturn {
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => void;
  error: string | null;
}

export function useNotifications(
  walletId: WalletId,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleNotification = useCallback((notification: Nip47Notification) => {
    // Convert SDK notification to our type
    const tx = notification.notification;
    const transaction: Transaction = {
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

    const event: NotificationEvent = {
      type: notification.notification_type as NotificationType,
      transaction,
      timestamp: new Date(),
    };

    options.onNotification?.(event);

    // Refresh balance on payment events
    if (notification.notification_type === 'payment_received' ||
        notification.notification_type === 'payment_sent') {
      refreshBalance();
    }
  }, [options.onNotification, refreshBalance]);

  const subscribe = useCallback(async () => {
    if (!client) {
      setError('Wallet not connected');
      return;
    }

    setError(null);

    try {
      const unsub = await client.subscribeNotifications(
        handleNotification,
        options.notificationTypes as Nip47NotificationType[]
      );

      unsubscribeRef.current = unsub;
      setIsSubscribed(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      throw err;
    }
  }, [client, handleNotification, options.notificationTypes]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsSubscribed(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  };
}
```

---

## SDK Methods Used

| Method | Purpose | From |
|--------|---------|------|
| `client.subscribeNotifications(callback, types)` | Subscribe to events | NWCClient |
| `unsub()` | Unsubscribe from events | Returned by subscribe |

---

## Test Requirements (TDD)

### Unit Tests

**File**: `tests/unit/pages/Notifications.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationSubscriber } from '@/pages/3-Notifications/components/NotificationSubscriber';
import { QuickPayButtons } from '@/pages/3-Notifications/components/QuickPayButtons';

// Mock hooks
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn().mockReturnValue({
    isSubscribed: false,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    error: null,
  }),
}));

describe('NotificationSubscriber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows not listening status initially', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Not listening')).toBeInTheDocument();
  });

  it('subscribes when Start Listening is clicked', async () => {
    render(<NotificationSubscriber onLog={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('shows listening status when subscribed', () => {
    vi.mocked(require('@/hooks/useNotifications').useNotifications).mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('unsubscribes when Stop Listening is clicked', async () => {
    vi.mocked(require('@/hooks/useNotifications').useNotifications).mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /stop listening/i }));

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('displays empty state when no notifications', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText(/start listening/i)).toBeInTheDocument();
  });
});

describe('QuickPayButtons', () => {
  it('renders quick pay buttons', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '500 sats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1000 sats' })).toBeInTheDocument();
  });

  it('pre-fills recipient address when provided', () => {
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={() => {}} />);

    expect(screen.getByDisplayValue('bob@test.getalby.com')).toBeInTheDocument();
  });

  it('disables buttons when no address', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).toBeDisabled();
  });
});
```

### Hook Tests

**File**: `tests/unit/hooks/useNotifications.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

const mockUnsubscribe = vi.fn();
const mockSubscribeNotifications = vi.fn().mockResolvedValue(mockUnsubscribe);

vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    subscribeNotifications: mockSubscribeNotifications,
  }),
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: vi.fn(),
  }),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts unsubscribed', () => {
    const { result } = renderHook(() => useNotifications('bob'));
    expect(result.current.isSubscribed).toBe(false);
  });

  it('subscribes successfully', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications('bob', { onNotification })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(mockSubscribeNotifications).toHaveBeenCalled();
  });

  it('unsubscribes successfully', async () => {
    const { result } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    act(() => {
      result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() => useNotifications('bob'));

    await act(async () => {
      await result.current.subscribe();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
```

---

## File Structure

```
src/pages/3-Notifications/
├── index.tsx                    # Main page component
└── components/
    ├── NotificationSubscriber.tsx
    └── QuickPayButtons.tsx

src/hooks/
└── useNotifications.ts
```

---

## Acceptance Criteria

- [ ] Bob can start/stop notification subscription
- [ ] Visual indicator shows subscription status
- [ ] Incoming payments appear in real-time
- [ ] Alice can send quick payments
- [ ] Notifications include amount and timestamp
- [ ] Balance updates when payments are received
- [ ] Subscription cleaned up on unmount
- [ ] Error states handled gracefully
- [ ] All tests pass

## Related Specifications

- [05-wallet-context.md](./05-wallet-context.md) - NWC client access
- [08-scenario-2-lightning-address.md](./08-scenario-2-lightning-address.md) - Defines `useLightningAddressPayment` hook used by QuickPayButtons
- [10-scenario-4-hold-invoice.md](./10-scenario-4-hold-invoice.md) - Uses hold_invoice_accepted notifications
