import { createContext, useReducer, useCallback, useRef } from 'react';
import { NWCClient } from '@getalby/sdk/nwc';
import type {
  WalletId,
  WalletState,
  WalletContextValue,
  ConnectionStatus,
  WalletInfo,
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
