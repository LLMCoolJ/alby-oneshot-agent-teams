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
