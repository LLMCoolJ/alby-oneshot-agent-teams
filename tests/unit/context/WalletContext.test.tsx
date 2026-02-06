import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { useWallet } from '@/hooks/useWallet';
import { useWalletActions } from '@/hooks/useWalletActions';
import { useNWCClient } from '@/hooks/useNWCClient';
import { createMockNWCClient } from '../../mocks/nwc';
import type { WalletId } from '@/types';

let mockClient: ReturnType<typeof createMockNWCClient>;

vi.mock('@getalby/sdk/nwc', () => ({
  NWCClient: vi.fn().mockImplementation(() => {
    mockClient = createMockNWCClient();
    return mockClient;
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);

// Combined hooks for tests that need shared state
function useWalletAndActions(walletId: WalletId) {
  const wallet = useWallet(walletId);
  const actions = useWalletActions(walletId);
  const client = useNWCClient(walletId);
  return { wallet, actions, client };
}

function useTwoWallets() {
  const alice = useWallet('alice');
  const bob = useWallet('bob');
  const aliceActions = useWalletActions('alice');
  return { alice, bob, aliceActions };
}

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useWallet', () => {
    it('returns disconnected state initially for alice', () => {
      const { result } = renderHook(() => useWallet('alice'), { wrapper });
      expect(result.current.status).toBe('disconnected');
      expect(result.current.balance).toBeNull();
      expect(result.current.info).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.nwcUrl).toBeNull();
      expect(result.current.id).toBe('alice');
    });

    it('returns disconnected state initially for bob', () => {
      const { result } = renderHook(() => useWallet('bob'), { wrapper });
      expect(result.current.status).toBe('disconnected');
      expect(result.current.id).toBe('bob');
    });

    it('returns connected state after connect', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.wallet.status).toBe('connected');
        expect(result.current.wallet.balance).toBe(100_000_000);
        expect(result.current.wallet.info).not.toBeNull();
        expect(result.current.wallet.info?.alias).toBe('Test Wallet');
        expect(result.current.wallet.info?.color).toBe('#ff0000');
        expect(result.current.wallet.info?.pubkey).toBe('abc123');
        expect(result.current.wallet.info?.network).toBe('testnet');
        expect(result.current.wallet.info?.blockHeight).toBe(12345);
        expect(result.current.wallet.info?.methods).toEqual(['pay_invoice', 'make_invoice']);
      });
    });
  });

  describe('useWalletActions', () => {
    it('connect updates wallet state to connected', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.wallet.status).toBe('connected');
      });
    });

    it('connect sets nwcUrl on wallet state', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.wallet.nwcUrl).toBe('nostr+walletconnect://test');
      });
    });

    it('connect sets error on failure', async () => {
      const { NWCClient } = await import('@getalby/sdk/nwc');
      vi.mocked(NWCClient).mockImplementationOnce(() => ({
        ...createMockNWCClient(),
        getInfo: vi.fn().mockRejectedValue(new Error('Connection refused')),
      }) as any);

      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        try {
          await result.current.actions.connect('nostr+walletconnect://bad');
        } catch (e) {
          // expected
        }
      });

      await waitFor(() => {
        expect(result.current.wallet.status).toBe('error');
        expect(result.current.wallet.error).toBe('Connection refused');
      });
    });

    it('connect handles non-Error throws', async () => {
      const { NWCClient } = await import('@getalby/sdk/nwc');
      vi.mocked(NWCClient).mockImplementationOnce(() => ({
        ...createMockNWCClient(),
        getInfo: vi.fn().mockRejectedValue('string error'),
      }) as any);

      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        try {
          await result.current.actions.connect('nostr+walletconnect://bad');
        } catch (e) {
          // expected
        }
      });

      await waitFor(() => {
        expect(result.current.wallet.status).toBe('error');
        expect(result.current.wallet.error).toBe('Connection failed');
      });
    });

    it('disconnect clears wallet state', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      // First connect
      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.wallet.status).toBe('connected');
      });

      // Then disconnect
      act(() => {
        result.current.actions.disconnect();
      });

      expect(result.current.wallet.status).toBe('disconnected');
      expect(result.current.wallet.balance).toBeNull();
      expect(result.current.wallet.info).toBeNull();
      expect(result.current.wallet.nwcUrl).toBeNull();
      expect(result.current.wallet.error).toBeNull();
    });

    it('disconnect calls close on the NWC client', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      const clientClose = mockClient.close;

      act(() => {
        result.current.actions.disconnect();
      });

      expect(clientClose).toHaveBeenCalled();
    });

    it('refreshBalance updates balance', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      // Update mock to return new balance
      mockClient.getBalance.mockResolvedValueOnce({ balance: 200_000_000 });

      await act(async () => {
        await result.current.actions.refreshBalance();
      });

      await waitFor(() => {
        expect(result.current.wallet.balance).toBe(200_000_000);
      });
    });

    it('refreshBalance does nothing when not connected', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      // Should not throw
      await act(async () => {
        await result.current.actions.refreshBalance();
      });
    });

    it('connect closes existing client before reconnecting', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://first');
      });

      const firstClose = mockClient.close;

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://second');
      });

      expect(firstClose).toHaveBeenCalled();
    });

    it('alice and bob connect independently', async () => {
      const { result } = renderHook(() => useTwoWallets(), { wrapper });

      await act(async () => {
        await result.current.aliceActions.connect('nostr+walletconnect://alice');
      });

      await waitFor(() => {
        expect(result.current.alice.status).toBe('connected');
      });

      expect(result.current.bob.status).toBe('disconnected');
    });
  });

  describe('useNWCClient', () => {
    it('returns null when disconnected', () => {
      const { result } = renderHook(() => useNWCClient('alice'), { wrapper });
      expect(result.current).toBeNull();
    });

    it('returns client when connected', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.client).not.toBeNull();
      });
    });

    it('returns null after disconnect', async () => {
      const { result } = renderHook(() => useWalletAndActions('alice'), { wrapper });

      await act(async () => {
        await result.current.actions.connect('nostr+walletconnect://test');
      });

      await waitFor(() => {
        expect(result.current.client).not.toBeNull();
      });

      act(() => {
        result.current.actions.disconnect();
      });

      expect(result.current.client).toBeNull();
    });
  });
});
