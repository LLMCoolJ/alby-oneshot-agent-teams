# Specification 03: Shared Types

## Purpose

Define all TypeScript types and interfaces used across the application, ensuring type safety and consistency.

## Dependencies

- [00-overview.md](./00-overview.md) - Architecture reference
- [01-project-setup.md](./01-project-setup.md) - Project configuration

## File Location

`src/types/index.ts`

## Unit Convention Reference

Understanding units across the Alby SDK ecosystem is critical to avoid bugs:

| Library | Import Path | Unit | Notes |
|---------|-------------|------|-------|
| NWC Client | `@getalby/sdk/nwc` | **millisats** | 1 sat = 1,000 millisats |
| Lightning Tools | `@getalby/lightning-tools/*` | **sats** | All functions use satoshis |
| WebLN / Bitcoin Connect | `@getalby/bitcoin-connect` | **sats** | WebLN standard |

**Conversion:**
```typescript
const MILLISATS_PER_SAT = 1000;
const toSats = (millisats: number) => Math.floor(millisats / MILLISATS_PER_SAT);
const toMillisats = (sats: number) => sats * MILLISATS_PER_SAT;
```

---

## Type Definitions

### Wallet Types

```typescript
/**
 * Identifies which wallet (Alice or Bob) is being referenced
 */
export type WalletId = 'alice' | 'bob';

/**
 * Connection status for a wallet
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Represents a connected wallet's state
 */
export interface WalletState {
  id: WalletId;
  status: ConnectionStatus;
  nwcUrl: string | null;
  balance: number | null; // in millisats
  info: WalletInfo | null;
  error: string | null;
}

/**
 * Information about a connected wallet (from NWC get_info)
 */
export interface WalletInfo {
  alias: string;
  color: string;
  pubkey: string;
  network: string;
  blockHeight: number;
  methods: string[];
  lud16?: string; // Lightning Address if available
}

/**
 * Props for wallet-related components
 */
export interface WalletCardProps {
  walletId: WalletId;
  showActions?: boolean;
  className?: string;
}
```

### Transaction Types

```typescript
/**
 * Transaction direction
 */
export type TransactionType = 'incoming' | 'outgoing';

/**
 * Transaction settlement state
 */
export type TransactionState = 'pending' | 'settled' | 'failed' | 'accepted';

/**
 * Represents a Lightning transaction
 */
export interface Transaction {
  id: string; // payment_hash
  type: TransactionType;
  state: TransactionState;
  amount: number; // millisats
  feesPaid: number; // millisats
  description: string;
  invoice: string; // BOLT-11
  preimage: string | null;
  paymentHash: string;
  createdAt: Date;
  settledAt: Date | null;
  expiresAt: Date | null;
  metadata?: TransactionMetadata;
}

/**
 * Additional transaction metadata
 */
export interface TransactionMetadata {
  comment?: string;
  payerData?: {
    email?: string;
    name?: string;
    pubkey?: string;
  };
  recipientData?: {
    identifier?: string;
  };
  nostr?: {
    pubkey: string;
    tags: string[][];
  };
}

/**
 * Filter options for transaction list
 */
export interface TransactionFilter {
  type?: TransactionType;
  from?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}
```

### Invoice Types

```typescript
/**
 * Request to create a new invoice
 */
export interface CreateInvoiceRequest {
  amount: number; // millisats
  description?: string;
  expiry?: number; // seconds
}

/**
 * Decoded BOLT-11 invoice data
 */
export interface DecodedInvoice {
  paymentRequest: string;
  paymentHash: string;
  amount: number; // satoshis
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Hold invoice state
 */
export type HoldInvoiceState = 'created' | 'accepted' | 'settled' | 'cancelled';

/**
 * Hold invoice with preimage/hash pair
 */
export interface HoldInvoice {
  invoice: string;
  paymentHash: string;
  preimage: string;
  state: HoldInvoiceState;
  amount: number; // millisats
}
```

### Payment Types

```typescript
/**
 * Payment request (to pay an invoice)
 */
export interface PayInvoiceRequest {
  invoice: string;
  amount?: number; // for zero-amount invoices, in millisats
}

/**
 * Payment result
 */
export interface PaymentResult {
  preimage: string;
  feesPaid: number; // millisats
}

/**
 * Lightning Address payment request
 */
export interface LightningAddressPayment {
  address: string;
  amount: number; // satoshis
  comment?: string;
}
```

### Notification Types

```typescript
/**
 * Notification event types from NWC
 */
export type NotificationType = 'payment_received' | 'payment_sent' | 'hold_invoice_accepted';

/**
 * Notification event
 */
export interface NotificationEvent {
  type: NotificationType;
  transaction: Transaction;
  timestamp: Date;
}

/**
 * Notification subscription state
 */
export interface NotificationSubscription {
  active: boolean;
  types: NotificationType[];
  unsubscribe: (() => void) | null;
}
```

### Fiat Conversion Types

```typescript
/**
 * Supported fiat currencies
 */
export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF';

/**
 * Fiat conversion result
 */
export interface FiatConversion {
  satoshi: number;
  fiat: number;
  currency: FiatCurrency;
  rate: number; // BTC per fiat unit
  formattedFiat: string;
  formattedSats: string;
}

/**
 * User's fiat display preferences
 */
export interface FiatPreferences {
  currency: FiatCurrency;
  locale: string;
  showFiat: boolean;
}
```

### Nostr/Zap Types

```typescript
/**
 * Nostr public key (npub format or hex)
 */
export type NostrPubkey = string;

/**
 * Nostr event for zaps
 */
export interface NostrEvent {
  id?: string;
  kind: number;
  pubkey?: string;
  content: string;
  tags: string[][];
  created_at: number;
  sig?: string;
}

/**
 * Zap request parameters
 */
export interface ZapRequest {
  recipientAddress: string; // Lightning Address for LNURL lookup
  recipientPubkey: NostrPubkey;
  amount: number; // satoshis
  comment?: string;
  eventId?: string; // note ID being zapped
  relays: string[];
}

/**
 * Mock Nostr note for demo purposes
 */
export interface MockNostrNote {
  id: string;
  pubkey: NostrPubkey;
  content: string;
  created_at: number;
  author: {
    name: string;
    picture?: string;
  };
}
```

### UI Component Types

```typescript
/**
 * Common button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Common size variants
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Badge/status variants
 */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

/**
 * Log entry for transaction log component
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  details?: Record<string, unknown>;
}
```

### Context Types

```typescript
import type { NWCClient } from '@getalby/sdk/nwc';

/**
 * Wallet context state
 */
export interface WalletContextState {
  alice: WalletState;
  bob: WalletState;
}

/**
 * Wallet context actions
 */
export interface WalletContextActions {
  connect: (walletId: WalletId, nwcUrl: string) => Promise<void>;
  disconnect: (walletId: WalletId) => void;
  refreshBalance: (walletId: WalletId) => Promise<void>;
  getClient: (walletId: WalletId) => NWCClient | null;
}

/**
 * Complete wallet context value
 */
export interface WalletContextValue extends WalletContextState, WalletContextActions {}
```

### Utility Types

```typescript
/**
 * Async operation state
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Form field state
 */
export interface FieldState<T = string> {
  value: T;
  error: string | null;
  touched: boolean;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}
```

### NWC Error Types

The SDK exports specific error classes for granular error handling:

```typescript
import {
  Nip47Error,
  Nip47WalletError,
  Nip47NetworkError,
  Nip47TimeoutError,
  Nip47PublishTimeoutError,
  Nip47ReplyTimeoutError,
  Nip47PublishError,
  Nip47ResponseDecodingError,
  Nip47ResponseValidationError,
  Nip47UnexpectedResponseError,
} from '@getalby/sdk/nwc';

/**
 * Base NWC error - all NWC errors extend this
 */
// Nip47Error { message: string; code: string }

/**
 * Wallet returned an error response (e.g., insufficient_balance, payment_failed)
 * See NIP-47 error codes: https://github.com/nostr-protocol/nips/blob/master/47.md#error-codes
 */
// Nip47WalletError extends Nip47Error

/**
 * Network/connection errors
 */
// Nip47NetworkError extends Nip47Error

/**
 * Timeout errors (base class)
 */
// Nip47TimeoutError extends Nip47Error

/**
 * Timed out waiting for relay to accept our message
 */
// Nip47PublishTimeoutError extends Nip47TimeoutError

/**
 * Timed out waiting for wallet response
 */
// Nip47ReplyTimeoutError extends Nip47TimeoutError
```

#### Common NIP-47 Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMITED` | Too many requests |
| `NOT_IMPLEMENTED` | Method not supported by wallet |
| `INSUFFICIENT_BALANCE` | Not enough funds |
| `PAYMENT_FAILED` | Payment could not be completed |
| `NOT_FOUND` | Invoice/transaction not found |
| `QUOTA_EXCEEDED` | Budget limit reached |
| `RESTRICTED` | Operation not allowed |
| `UNAUTHORIZED` | Invalid credentials |
| `INTERNAL` | Wallet internal error |

#### Error Handling Example

```typescript
import { Nip47WalletError, Nip47TimeoutError } from '@getalby/sdk/nwc';

try {
  await client.payInvoice({ invoice });
} catch (error) {
  if (error instanceof Nip47WalletError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        // Show "Not enough funds" message
        break;
      case 'PAYMENT_FAILED':
        // Show "Payment failed, please try again"
        break;
      default:
        // Show generic wallet error
    }
  } else if (error instanceof Nip47TimeoutError) {
    // Show "Connection timed out"
  } else {
    // Unknown error
  }
}
```

### SDK Type Re-exports

```typescript
// Re-export commonly used SDK types for convenience
export type {
  Nip47Transaction,
  Nip47PayResponse,
  Nip47GetInfoResponse,
  Nip47GetBalanceResponse,
  Nip47GetBudgetResponse,
  Nip47Notification,
  Nip47NotificationType,
  Nip47Method,
  BudgetRenewalPeriod,
} from '@getalby/sdk/nwc';

// Re-export error classes for error handling
export {
  Nip47Error,
  Nip47WalletError,
  Nip47NetworkError,
  Nip47TimeoutError,
  Nip47PublishTimeoutError,
  Nip47ReplyTimeoutError,
} from '@getalby/sdk/nwc';

// From bolt11 subpath
export type { Invoice as LightningInvoice } from '@getalby/lightning-tools/bolt11';

// From lnurl subpath
export type {
  LnUrlPayResponse,
  ZapArgs,
} from '@getalby/lightning-tools/lnurl';

// From fiat subpath
export type { FiatCurrency as FiatCurrencyInfo } from '@getalby/lightning-tools/fiat';
```

## Type Guards

```typescript
/**
 * Type guard to check if a transaction is settled
 */
export function isSettledTransaction(tx: Transaction): tx is Transaction & { settledAt: Date; preimage: string } {
  return tx.state === 'settled' && tx.settledAt !== null && tx.preimage !== null;
}

/**
 * Type guard for incoming transactions
 */
export function isIncomingTransaction(tx: Transaction): boolean {
  return tx.type === 'incoming';
}

/**
 * Type guard to check if wallet is connected
 */
export function isConnectedWallet(wallet: WalletState): wallet is WalletState & {
  status: 'connected';
  balance: number;
  info: WalletInfo;
} {
  return wallet.status === 'connected' && wallet.balance !== null && wallet.info !== null;
}

/**
 * Check if a string is a valid NWC URL
 */
export function isValidNwcUrl(url: string): boolean {
  return url.startsWith('nostr+walletconnect://');
}

/**
 * Check if a string looks like a Lightning Address
 */
export function isLightningAddress(str: string): boolean {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
}
```

## Constants

```typescript
/**
 * Default values and constants
 */
export const CONSTANTS = {
  // Units
  MILLISATS_PER_SAT: 1000,
  SATS_PER_BTC: 100_000_000,

  // Default expiry times
  DEFAULT_INVOICE_EXPIRY: 3600, // 1 hour in seconds
  DEFAULT_HOLD_INVOICE_EXPIRY: 86400, // 24 hours

  // Polling intervals
  BALANCE_POLL_INTERVAL: 30_000, // 30 seconds
  FIAT_RATE_CACHE_DURATION: 60_000, // 1 minute

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Validation
  MIN_PAYMENT_SATS: 1,
  MAX_PAYMENT_SATS: 10_000_000, // 10M sats

  // Demo
  FAUCET_URL: 'https://faucet.nwc.dev',
} as const;

/**
 * Scenario metadata
 */
export const SCENARIOS = [
  { id: 1, name: 'Simple Payment', path: '/simple-payment', icon: '💸' },
  { id: 2, name: 'Lightning Address', path: '/lightning-address', icon: '📧' },
  { id: 3, name: 'Notifications', path: '/notifications', icon: '🔔' },
  { id: 4, name: 'Hold Invoice', path: '/hold-invoice', icon: '🔒' },
  { id: 5, name: 'Proof of Payment', path: '/proof-of-payment', icon: '✅' },
  { id: 6, name: 'Transaction History', path: '/transaction-history', icon: '📜' },
  { id: 7, name: 'Nostr Zap', path: '/nostr-zap', icon: '⚡' },
  { id: 8, name: 'Fiat Conversion', path: '/fiat-conversion', icon: '💱' },
] as const;
```

## Test Requirements (TDD)

**File**: `tests/unit/types/index.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  isValidNwcUrl,
  isLightningAddress,
  isConnectedWallet,
  isSettledTransaction,
  CONSTANTS,
} from '@/types';
import type { WalletState, Transaction } from '@/types';

describe('Type Guards', () => {
  describe('isValidNwcUrl', () => {
    it('returns true for valid NWC URLs', () => {
      const validUrl = 'nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=abc123';
      expect(isValidNwcUrl(validUrl)).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidNwcUrl('https://example.com')).toBe(false);
      expect(isValidNwcUrl('nostr://something')).toBe(false);
      expect(isValidNwcUrl('')).toBe(false);
    });
  });

  describe('isLightningAddress', () => {
    it('returns true for valid Lightning Addresses', () => {
      expect(isLightningAddress('alice@getalby.com')).toBe(true);
      expect(isLightningAddress('bob_123@testnet.getalby.com')).toBe(true);
    });

    it('returns false for invalid addresses', () => {
      expect(isLightningAddress('not-an-email')).toBe(false);
      expect(isLightningAddress('@missing.user')).toBe(false);
      expect(isLightningAddress('missing@domain')).toBe(false);
    });
  });

  describe('isConnectedWallet', () => {
    it('returns true for fully connected wallet', () => {
      const wallet: WalletState = {
        id: 'alice',
        status: 'connected',
        nwcUrl: 'nostr+walletconnect://...',
        balance: 100000,
        info: {
          alias: 'Alice',
          color: '#ff0000',
          pubkey: 'abc123',
          network: 'testnet',
          blockHeight: 12345,
          methods: ['pay_invoice', 'make_invoice'],
        },
        error: null,
      };
      expect(isConnectedWallet(wallet)).toBe(true);
    });

    it('returns false for disconnected wallet', () => {
      const wallet: WalletState = {
        id: 'alice',
        status: 'disconnected',
        nwcUrl: null,
        balance: null,
        info: null,
        error: null,
      };
      expect(isConnectedWallet(wallet)).toBe(false);
    });
  });

  describe('isSettledTransaction', () => {
    it('returns true for settled transaction with preimage', () => {
      const tx: Transaction = {
        id: 'abc123',
        type: 'incoming',
        state: 'settled',
        amount: 1000000,
        feesPaid: 0,
        description: 'Test payment',
        invoice: 'lnbc...',
        preimage: 'preimage123',
        paymentHash: 'hash123',
        createdAt: new Date(),
        settledAt: new Date(),
        expiresAt: null,
      };
      expect(isSettledTransaction(tx)).toBe(true);
    });

    it('returns false for pending transaction', () => {
      const tx: Transaction = {
        id: 'abc123',
        type: 'incoming',
        state: 'pending',
        amount: 1000000,
        feesPaid: 0,
        description: 'Test payment',
        invoice: 'lnbc...',
        preimage: null,
        paymentHash: 'hash123',
        createdAt: new Date(),
        settledAt: null,
        expiresAt: null,
      };
      expect(isSettledTransaction(tx)).toBe(false);
    });
  });
});

describe('Constants', () => {
  it('has correct unit conversions', () => {
    expect(CONSTANTS.MILLISATS_PER_SAT).toBe(1000);
    expect(CONSTANTS.SATS_PER_BTC).toBe(100_000_000);
  });

  it('has valid payment limits', () => {
    expect(CONSTANTS.MIN_PAYMENT_SATS).toBeGreaterThan(0);
    expect(CONSTANTS.MAX_PAYMENT_SATS).toBeGreaterThan(CONSTANTS.MIN_PAYMENT_SATS);
  });
});
```

## Acceptance Criteria

- [ ] All types compile without errors
- [ ] Type guards work correctly with TypeScript narrowing
- [ ] SDK types are properly re-exported
- [ ] Constants are frozen (readonly)
- [ ] All tests pass
- [ ] Types provide good IntelliSense/autocomplete

## Related Specifications

- [04-shared-components.md](./04-shared-components.md) - Uses UI types
- [05-wallet-context.md](./05-wallet-context.md) - Uses wallet types
- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Uses invoice/payment types
