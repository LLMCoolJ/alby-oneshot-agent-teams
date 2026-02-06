import { useContext } from 'react';
import { WalletContext } from '@/context/WalletContext';
import type { WalletId } from '@/types';

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
