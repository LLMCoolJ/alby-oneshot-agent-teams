// ============================================================================
// Shared Types — src/types/index.ts
// All TypeScript types and interfaces used across the application.
// ============================================================================

import type { NWCClient } from '@getalby/sdk/nwc';

// ── SDK Type Re-exports ─────────────────────────────────────────────────────

/** Re-export commonly used SDK types for convenience */
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

/** Re-export error classes for error handling */
export {
  Nip47Error,
  Nip47WalletError,
  Nip47NetworkError,
  Nip47TimeoutError,
  Nip47PublishTimeoutError,
  Nip47ReplyTimeoutError,
} from '@getalby/sdk/nwc';

/** From bolt11 subpath */
export type { Invoice as LightningInvoice } from '@getalby/lightning-tools/bolt11';

/** From lnurl subpath */
export type {
  LnUrlPayResponse,
  ZapArgs,
} from '@getalby/lightning-tools/lnurl';

/** From fiat subpath */
export type { FiatCurrency as FiatCurrencyInfo } from '@getalby/lightning-tools/fiat';

// ── Wallet Types ────────────────────────────────────────────────────────────

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
  balance: number | null; // millisats
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

// ── Transaction Types ───────────────────────────────────────────────────────

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

// ── Invoice Types ───────────────────────────────────────────────────────────

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

// ── Payment Types ───────────────────────────────────────────────────────────

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

// ── Notification Types ──────────────────────────────────────────────────────

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

// ── Fiat Conversion Types ───────────────────────────────────────────────────

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

// ── Nostr/Zap Types ────────────────────────────────────────────────────────

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

// ── UI Component Types ──────────────────────────────────────────────────────

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

// ── Context Types ───────────────────────────────────────────────────────────

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

// ── Utility Types ───────────────────────────────────────────────────────────

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

// ── Type Guards ─────────────────────────────────────────────────────────────

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

// ── Constants ───────────────────────────────────────────────────────────────

/**
 * Default values and constants
 */
export const CONSTANTS = {
  // Units
  MILLISATS_PER_SAT: 1000,
  SATS_PER_BTC: 100_000_000,

  // Default expiry times
  DEFAULT_INVOICE_EXPIRY: 3600, // 1 hour in seconds
  DEFAULT_HOLD_INVOICE_EXPIRY: 86400, // 24 hours in seconds

  // Polling intervals
  BALANCE_POLL_INTERVAL: 30_000, // 30 seconds
  FIAT_RATE_CACHE_DURATION: 60_000, // 1 minute

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Validation
  MIN_PAYMENT_SATS: 1, // sats
  MAX_PAYMENT_SATS: 10_000_000, // 10M sats

  // Demo
  FAUCET_URL: 'https://faucet.nwc.dev',
} as const;

/**
 * Scenario metadata
 */
export const SCENARIOS = [
  { id: 1, name: 'Simple Payment', path: '/simple-payment', icon: '\u{1F4B8}' },
  { id: 2, name: 'Lightning Address', path: '/lightning-address', icon: '\u{1F4E7}' },
  { id: 3, name: 'Notifications', path: '/notifications', icon: '\u{1F514}' },
  { id: 4, name: 'Hold Invoice', path: '/hold-invoice', icon: '\u{1F512}' },
  { id: 5, name: 'Proof of Payment', path: '/proof-of-payment', icon: '\u{2705}' },
  { id: 6, name: 'Transaction History', path: '/transaction-history', icon: '\u{1F4DC}' },
  { id: 7, name: 'Nostr Zap', path: '/nostr-zap', icon: '\u{26A1}' },
  { id: 8, name: 'Fiat Conversion', path: '/fiat-conversion', icon: '\u{1F4B1}' },
] as const;
