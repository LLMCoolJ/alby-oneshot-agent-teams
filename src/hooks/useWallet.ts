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
