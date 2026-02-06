# Specification 05: Wallet Context & Hooks

## Purpose

Define the React Context and custom hooks that manage NWC client connections for both Alice and Bob wallets.

## Dependencies

- [03-shared-types.md](./03-shared-types.md) - Type definitions
- [01-project-setup.md](./01-project-setup.md) - SDK packages

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       WalletProvider                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    WalletContext                             │   │
│  │  ┌─────────────────┐      ┌─────────────────┐              │   │
│  │  │ Alice Wallet    │      │ Bob Wallet      │              │   │
│  │  │ - NWCClient     │      │ - NWCClient     │              │   │
│  │  │ - WalletState   │      │ - WalletState   │              │   │
│  │  └─────────────────┘      └─────────────────┘              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
    useWallet('alice')            useWallet('bob')
    useBalance('alice')           useBalance('bob')
    useNWCClient('alice')         useNWCClient('bob')
```

---

## WalletContext

**File**: `src/context/WalletContext.tsx`

### Context Interface

```typescript
import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { NWCClient } from '@getalby/sdk/nwc';
import type {
  WalletId,
  WalletState,
  WalletContextValue,
  ConnectionStatus,
  WalletInfo,
  Nip47GetBudgetResponse,
} from '@/types';

// Initial state for a wallet
const initialWalletState: WalletState = {
  id: 'alice',
  status: 'disconnected',
  nwcUrl: null,
  balance: null,
  info: null,
  error: null,
};

// Context initial value
const initialContextValue: WalletContextValue = {
  alice: { ...initialWalletState, id: 'alice' },
  bob: { ...initialWalletState, id: 'bob' },
  connect: async () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
  getClient: () => null,
};

export const WalletContext = createContext<WalletContextValue>(initialContextValue);
```

### State Management

```typescript
// Action types
type WalletAction =
  | { type: 'SET_STATUS'; walletId: WalletId; status: ConnectionStatus }
  | { type: 'SET_CONNECTED'; walletId: WalletId; nwcUrl: string; info: WalletInfo }
  | { type: 'SET_BALANCE'; walletId: WalletId; balance: number }
  | { type: 'SET_ERROR'; walletId: WalletId; error: string }
  | { type: 'DISCONNECT'; walletId: WalletId };

// Reducer
function walletReducer(
  state: { alice: WalletState; bob: WalletState },
  action: WalletAction
): { alice: WalletState; bob: WalletState } {
  const updateWallet = (walletId: WalletId, updates: Partial<WalletState>) => ({
    ...state,
    [walletId]: { ...state[walletId], ...updates },
  });

  switch (action.type) {
    case 'SET_STATUS':
      return updateWallet(action.walletId, { status: action.status });

    case 'SET_CONNECTED':
      return updateWallet(action.walletId, {
        status: 'connected',
        nwcUrl: action.nwcUrl,
        info: action.info,
        error: null,
      });

    case 'SET_BALANCE':
      return updateWallet(action.walletId, { balance: action.balance });

    case 'SET_ERROR':
      return updateWallet(action.walletId, {
        status: 'error',
        error: action.error,
      });

    case 'DISCONNECT':
      return updateWallet(action.walletId, {
        status: 'disconnected',
        nwcUrl: null,
        balance: null,
        info: null,
        error: null,
      });

    default:
      return state;
  }
}
```

### Provider Implementation

```typescript
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, {
    alice: { ...initialWalletState, id: 'alice' },
    bob: { ...initialWalletState, id: 'bob' },
  });

  // Store NWC clients in refs (not state, as they're not serializable)
  const clientsRef = useRef<{
    alice: NWCClient | null;
    bob: NWCClient | null;
  }>({ alice: null, bob: null });

  const connect = useCallback(async (walletId: WalletId, nwcUrl: string) => {
    dispatch({ type: 'SET_STATUS', walletId, status: 'connecting' });

    try {
      // Close existing client if any
      clientsRef.current[walletId]?.close();

      // Create new NWC client
      const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
      clientsRef.current[walletId] = client;

      // Get wallet info
      const info = await client.getInfo();
      const walletInfo: WalletInfo = {
        alias: info.alias,
        color: info.color,
        pubkey: info.pubkey,
        network: info.network,
        blockHeight: info.block_height,
        methods: info.methods,
        lud16: info.lud16,
      };

      dispatch({ type: 'SET_CONNECTED', walletId, nwcUrl, info: walletInfo });

      // Fetch initial balance
      const balanceResponse = await client.getBalance();
      dispatch({ type: 'SET_BALANCE', walletId, balance: balanceResponse.balance });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      dispatch({ type: 'SET_ERROR', walletId, error: message });
      clientsRef.current[walletId] = null;
      throw error;
    }
  }, []);

  const disconnect = useCallback((walletId: WalletId) => {
    clientsRef.current[walletId]?.close();
    clientsRef.current[walletId] = null;
    dispatch({ type: 'DISCONNECT', walletId });
  }, []);

  const refreshBalance = useCallback(async (walletId: WalletId) => {
    const client = clientsRef.current[walletId];
    if (!client) return;

    try {
      const response = await client.getBalance();
      dispatch({ type: 'SET_BALANCE', walletId, balance: response.balance });
    } catch (error) {
      console.error(`Failed to refresh balance for ${walletId}:`, error);
    }
  }, []);

  const getClient = useCallback((walletId: WalletId): NWCClient | null => {
    return clientsRef.current[walletId];
  }, []);

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    getClient,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
```

---

## Custom Hooks

### useWallet

**File**: `src/hooks/useWallet.ts`

```typescript
import { useContext } from 'react';
import { WalletContext } from '@/context/WalletContext';
import type { WalletId, WalletState } from '@/types';

export function useWallet(walletId: WalletId): WalletState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context[walletId];
}
```

### useWalletActions

**File**: `src/hooks/useWalletActions.ts`

```typescript
import { useContext } from 'react';
import { WalletContext } from '@/context/WalletContext';
import type { WalletId, WalletContextActions } from '@/types';

interface WalletActions {
  connect: (nwcUrl: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

export function useWalletActions(walletId: WalletId): WalletActions {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletActions must be used within WalletProvider');
  }

  return {
    connect: (nwcUrl: string) => context.connect(walletId, nwcUrl),
    disconnect: () => context.disconnect(walletId),
    refreshBalance: () => context.refreshBalance(walletId),
  };
}
```

### useNWCClient

**File**: `src/hooks/useNWCClient.ts`

```typescript
import { useContext } from 'react';
import { WalletContext } from '@/context/WalletContext';
import type { NWCClient } from '@getalby/sdk/nwc';
import type { WalletId } from '@/types';

export function useNWCClient(walletId: WalletId): NWCClient | null {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useNWCClient must be used within WalletProvider');
  }
  return context.getClient(walletId);
}
```

### useBalance

**File**: `src/hooks/useBalance.ts`

```typescript
import { useEffect, useMemo } from 'react';
import { useWallet } from './useWallet';
import { useWalletActions } from './useWalletActions';
import { CONSTANTS } from '@/types';
import type { WalletId } from '@/types';

interface BalanceInfo {
  millisats: number | null;
  sats: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBalance(
  walletId: WalletId,
  options?: { pollingInterval?: number }
): BalanceInfo {
  const wallet = useWallet(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const pollingInterval = options?.pollingInterval ?? CONSTANTS.BALANCE_POLL_INTERVAL;

  // Set up polling when connected
  useEffect(() => {
    if (wallet.status !== 'connected' || pollingInterval <= 0) return;

    const intervalId = setInterval(refreshBalance, pollingInterval);
    return () => clearInterval(intervalId);
  }, [wallet.status, pollingInterval, refreshBalance]);

  const sats = useMemo(() => {
    if (wallet.balance === null) return null;
    return Math.floor(wallet.balance / CONSTANTS.MILLISATS_PER_SAT);
  }, [wallet.balance]);

  return {
    millisats: wallet.balance,
    sats,
    loading: wallet.status === 'connecting',
    error: wallet.error,
    refresh: refreshBalance,
  };
}
```

### useInvoice

**File**: `src/hooks/useInvoice.ts`

```typescript
import { useState, useCallback } from 'react';
import { useNWCClient } from './useNWCClient';
import type { WalletId, CreateInvoiceRequest, AsyncState } from '@/types';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

interface UseInvoiceReturn {
  invoice: Nip47Transaction | null;
  loading: boolean;
  error: string | null;
  createInvoice: (request: CreateInvoiceRequest) => Promise<Nip47Transaction>;
  reset: () => void;
}

export function useInvoice(walletId: WalletId): UseInvoiceReturn {
  const client = useNWCClient(walletId);
  const [state, setState] = useState<AsyncState<Nip47Transaction>>({
    data: null,
    loading: false,
    error: null,
  });

  const createInvoice = useCallback(
    async (request: CreateInvoiceRequest): Promise<Nip47Transaction> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setState({ data: null, loading: true, error: null });

      try {
        const invoice = await client.makeInvoice({
          amount: request.amount,
          description: request.description,
          expiry: request.expiry,
        });

        setState({ data: invoice, loading: false, error: null });
        return invoice;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create invoice';
        setState({ data: null, loading: false, error: message });
        throw error;
      }
    },
    [client]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    invoice: state.data,
    loading: state.loading,
    error: state.error,
    createInvoice,
    reset,
  };
}
```

### usePayment

**File**: `src/hooks/usePayment.ts`

```typescript
import { useState, useCallback } from 'react';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, PaymentResult, AsyncState } from '@/types';

interface UsePaymentReturn {
  result: PaymentResult | null;
  loading: boolean;
  error: string | null;
  payInvoice: (invoice: string) => Promise<PaymentResult>;
  reset: () => void;
}

export function usePayment(walletId: WalletId): UsePaymentReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [state, setState] = useState<AsyncState<PaymentResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const payInvoice = useCallback(
    async (invoice: string): Promise<PaymentResult> => {
      if (!client) {
        throw new Error('Wallet not connected');
      }

      setState({ data: null, loading: true, error: null });

      try {
        const response = await client.payInvoice({ invoice });
        const result: PaymentResult = {
          preimage: response.preimage,
          feesPaid: response.fees_paid,
        };

        setState({ data: result, loading: false, error: null });

        // Refresh balance after payment
        await refreshBalance();

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment failed';
        setState({ data: null, loading: false, error: message });
        throw error;
      }
    },
    [client, refreshBalance]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    result: state.data,
    loading: state.loading,
    error: state.error,
    payInvoice,
    reset,
  };
}
```

---

## Wallet Components

### WalletCard

**File**: `src/components/wallet/WalletCard.tsx`

```typescript
import { Card, Badge, Spinner } from '@/components/ui';
import { useWallet, useBalance } from '@/hooks';
import { WalletConnect } from './WalletConnect';
import { BalanceDisplay } from './BalanceDisplay';
import type { WalletId } from '@/types';

interface WalletCardProps {
  walletId: WalletId;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WalletCard({ walletId, title, className, children }: WalletCardProps) {
  const wallet = useWallet(walletId);
  const { sats, loading } = useBalance(walletId);

  const displayTitle = title ?? (walletId === 'alice' ? 'Alice' : 'Bob');

  const statusBadge = {
    disconnected: <Badge variant="default">Disconnected</Badge>,
    connecting: <Badge variant="info">Connecting...</Badge>,
    connected: <Badge variant="success">Connected</Badge>,
    error: <Badge variant="error">Error</Badge>,
  }[wallet.status];

  return (
    <Card
      title={displayTitle}
      subtitle={wallet.info?.alias}
      headerAction={statusBadge}
      className={className}
    >
      {wallet.status === 'connected' ? (
        <>
          <BalanceDisplay sats={sats} loading={loading} />
          {children}
        </>
      ) : (
        <WalletConnect walletId={walletId} />
      )}
    </Card>
  );
}
```

### WalletConnect

**File**: `src/components/wallet/WalletConnect.tsx`

```typescript
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useWallet, useWalletActions } from '@/hooks';
import { isValidNwcUrl } from '@/types';
import type { WalletId } from '@/types';

interface WalletConnectProps {
  walletId: WalletId;
}

export function WalletConnect({ walletId }: WalletConnectProps) {
  const wallet = useWallet(walletId);
  const { connect } = useWalletActions(walletId);
  const [nwcUrl, setNwcUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!isValidNwcUrl(nwcUrl)) {
      setValidationError('Invalid NWC URL. Must start with nostr+walletconnect://');
      return;
    }

    setValidationError(null);
    try {
      await connect(nwcUrl);
    } catch (error) {
      // Error is handled in context
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="NWC Connection String"
        placeholder="nostr+walletconnect://..."
        value={nwcUrl}
        onChange={(e) => setNwcUrl(e.target.value)}
        error={validationError || wallet.error || undefined}
        hint="Paste your Nostr Wallet Connect URL"
      />
      <Button
        onClick={handleConnect}
        loading={wallet.status === 'connecting'}
        disabled={!nwcUrl}
      >
        Connect Wallet
      </Button>
    </div>
  );
}
```

### BalanceDisplay

**File**: `src/components/wallet/BalanceDisplay.tsx`

```typescript
import { Spinner } from '@/components/ui';
import { useFiatRate } from '@/hooks';

interface BalanceDisplayProps {
  sats: number | null;
  loading?: boolean;
  showFiat?: boolean;
  currency?: string;
}

export function BalanceDisplay({
  sats,
  loading = false,
  showFiat = true,
  currency = 'USD',
}: BalanceDisplayProps) {
  const { fiatValue, formattedFiat } = useFiatRate(sats ?? 0, currency);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-slate-500">Loading balance...</span>
      </div>
    );
  }

  if (sats === null) {
    return <span className="text-slate-500">--</span>;
  }

  const formattedSats = sats.toLocaleString();

  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold text-slate-900">
        {formattedSats} <span className="text-lg font-normal text-slate-500">sats</span>
      </div>
      {showFiat && formattedFiat && (
        <div className="text-sm text-slate-500">
          {formattedFiat}
        </div>
      )}
    </div>
  );
}
```

---

## useBudget Hook

**File**: `src/hooks/useBudget.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useNWCClient } from './useNWCClient';
import { useWallet } from './useWallet';
import type { WalletId, BudgetRenewalPeriod } from '@/types';
import type { Nip47GetBudgetResponse } from '@getalby/sdk/nwc';

interface BudgetInfo {
  /** Amount already spent in current period (millisats) */
  usedBudget: number | null;
  /** Total budget limit (millisats) */
  totalBudget: number | null;
  /** Remaining budget (millisats) */
  remainingBudget: number | null;
  /** When the budget resets (Date or null if never) */
  renewsAt: Date | null;
  /** Budget renewal period */
  renewalPeriod: BudgetRenewalPeriod | null;
  /** Whether budget info is available (wallet supports it) */
  available: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBudget(walletId: WalletId): BudgetInfo {
  const client = useNWCClient(walletId);
  const wallet = useWallet(walletId);
  const [budget, setBudget] = useState<Nip47GetBudgetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.getBudget();
      setBudget(response);
    } catch (err) {
      // getBudget may not be supported by all wallets
      setError(err instanceof Error ? err.message : 'Failed to fetch budget');
      setBudget(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Fetch budget when wallet connects
  useEffect(() => {
    if (wallet.status === 'connected' && client) {
      refresh();
    }
  }, [wallet.status, client, refresh]);

  // Check if budget response has data (empty object means unlimited/not set)
  const hasBudget = budget && 'total_budget' in budget;

  return {
    usedBudget: hasBudget ? budget.used_budget : null,
    totalBudget: hasBudget ? budget.total_budget : null,
    remainingBudget: hasBudget ? budget.total_budget - budget.used_budget : null,
    renewsAt: hasBudget && budget.renews_at ? new Date(budget.renews_at * 1000) : null,
    renewalPeriod: hasBudget ? budget.renewal_period : null,
    available: hasBudget ?? false,
    loading,
    error,
    refresh,
  };
}
```

---

## useFiatRate Hook

**File**: `src/hooks/useFiatRate.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { getFiatValue, getFormattedFiatValue } from '@getalby/lightning-tools/fiat';
import { CONSTANTS } from '@/types';

interface FiatRateResult {
  fiatValue: number | null;
  formattedFiat: string | null;
  loading: boolean;
  error: string | null;
}

// Simple in-memory cache
const rateCache: Map<string, { value: number; timestamp: number }> = new Map();

export function useFiatRate(
  satoshi: number,
  currency: string = 'USD'
): FiatRateResult {
  const [fiatValue, setFiatValue] = useState<number | null>(null);
  const [formattedFiat, setFormattedFiat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (satoshi <= 0) {
      setFiatValue(0);
      setFormattedFiat('$0.00');
      setLoading(false);
      return;
    }

    const fetchRate = async () => {
      try {
        setLoading(true);

        const value = await getFiatValue({ satoshi, currency });
        const formatted = await getFormattedFiatValue({
          satoshi,
          currency,
          locale: 'en-US',
        });

        setFiatValue(value);
        setFormattedFiat(formatted);
        setError(null);
      } catch (err) {
        setError('Failed to fetch fiat rate');
        console.error('Fiat rate error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, [satoshi, currency]);

  return { fiatValue, formattedFiat, loading, error };
}
```

---

## Hooks Index

**File**: `src/hooks/index.ts`

```typescript
export { useWallet } from './useWallet';
export { useWalletActions } from './useWalletActions';
export { useNWCClient } from './useNWCClient';
export { useBalance } from './useBalance';
export { useInvoice } from './useInvoice';
export { usePayment } from './usePayment';
export { useBudget } from './useBudget';
export { useFiatRate } from './useFiatRate';
export { useTransactionLog } from './useTransactionLog';
export { useLightningAddressPayment } from './useLightningAddressPayment';
export { useNotifications } from './useNotifications';
export { useHoldInvoice } from './useHoldInvoice';
export { useZap } from './useZap';
```

---

## Test Requirements (TDD)

### WalletContext Tests

**File**: `tests/unit/context/WalletContext.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { useWallet, useWalletActions, useNWCClient } from '@/hooks';

// Mock NWCClient
vi.mock('@getalby/sdk/nwc', () => ({
  NWCClient: vi.fn().mockImplementation(() => ({
    getInfo: vi.fn().mockResolvedValue({
      alias: 'Test Wallet',
      color: '#ff0000',
      pubkey: 'abc123',
      network: 'testnet',
      block_height: 12345,
      methods: ['pay_invoice', 'make_invoice'],
    }),
    getBalance: vi.fn().mockResolvedValue({ balance: 100000000 }), // 100k sats in millisats
    close: vi.fn(),
  })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);

describe('WalletContext', () => {
  describe('useWallet', () => {
    it('returns disconnected state initially', () => {
      const { result } = renderHook(() => useWallet('alice'), { wrapper });
      expect(result.current.status).toBe('disconnected');
      expect(result.current.balance).toBeNull();
    });
  });

  describe('useWalletActions', () => {
    it('connect updates wallet state', async () => {
      const { result: walletResult } = renderHook(() => useWallet('alice'), { wrapper });
      const { result: actionsResult } = renderHook(() => useWalletActions('alice'), { wrapper });

      await act(async () => {
        await actionsResult.current.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(walletResult.current.status).toBe('connected');
      });
    });

    it('disconnect clears wallet state', async () => {
      const { result: walletResult } = renderHook(() => useWallet('alice'), { wrapper });
      const { result: actionsResult } = renderHook(() => useWalletActions('alice'), { wrapper });

      // First connect
      await act(async () => {
        await actionsResult.current.connect('nostr+walletconnect://test');
      });

      // Then disconnect
      act(() => {
        actionsResult.current.disconnect();
      });

      expect(walletResult.current.status).toBe('disconnected');
      expect(walletResult.current.balance).toBeNull();
    });
  });

  describe('useNWCClient', () => {
    it('returns null when disconnected', () => {
      const { result } = renderHook(() => useNWCClient('alice'), { wrapper });
      expect(result.current).toBeNull();
    });

    it('returns client when connected', async () => {
      const { result: clientResult } = renderHook(() => useNWCClient('alice'), { wrapper });
      const { result: actionsResult } = renderHook(() => useWalletActions('alice'), { wrapper });

      await act(async () => {
        await actionsResult.current.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(clientResult.current).not.toBeNull();
      });
    });
  });
});
```

### Hook Tests

**File**: `tests/unit/hooks/useBalance.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBalance } from '@/hooks/useBalance';

// Mock useWallet and useWalletActions
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn().mockReturnValue({
    status: 'connected',
    balance: 100000000, // 100k sats in millisats
    error: null,
  }),
}));

vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useBalance', () => {
  it('converts millisats to sats correctly', () => {
    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.millisats).toBe(100000000);
    expect(result.current.sats).toBe(100000);
  });

  it('returns null sats when balance is null', () => {
    vi.mocked(require('@/hooks/useWallet').useWallet).mockReturnValue({
      status: 'disconnected',
      balance: null,
      error: null,
    });

    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.sats).toBeNull();
  });
});
```

---

## Acceptance Criteria

- [ ] WalletProvider wraps the application
- [ ] Both Alice and Bob wallets can connect independently
- [ ] Connection state persists across component re-renders
- [ ] Balance updates after payments
- [ ] Error states are properly displayed
- [ ] NWC clients are properly cleaned up on disconnect
- [ ] All hooks throw when used outside provider
- [ ] All tests pass

## Related Specifications

- [03-shared-types.md](./03-shared-types.md) - Type definitions
- [04-shared-components.md](./04-shared-components.md) - UI components used
- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Uses payment hooks
