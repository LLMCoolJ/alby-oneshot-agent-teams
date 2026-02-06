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
