import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionLog } from '@/components/transaction/TransactionLog';
import type { LogEntry } from '@/types';

interface ScenarioPageProps {
  title: string;
  description: string;
  aliceContent?: React.ReactNode;
  bobContent?: React.ReactNode;
  logs: LogEntry[];
  children?: React.ReactNode;
}

export function ScenarioPage({
  title,
  description,
  aliceContent,
  bobContent,
  logs,
  children,
}: ScenarioPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>

      {/* Wallet cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WalletCard walletId="alice" title="Alice's Wallet">
          {aliceContent}
        </WalletCard>
        <WalletCard walletId="bob" title="Bob's Wallet">
          {bobContent}
        </WalletCard>
      </div>

      {/* Additional content */}
      {children}

      {/* Transaction log */}
      <TransactionLog entries={logs} />
    </div>
  );
}
