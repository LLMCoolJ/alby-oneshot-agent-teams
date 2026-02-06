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
