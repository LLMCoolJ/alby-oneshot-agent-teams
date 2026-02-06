import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { TransactionList } from './components/TransactionList';
import { TransactionDetails } from './components/TransactionDetails';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Transaction } from '@/types';

export default function TransactionHistory() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Transaction History"
      description="View and filter your Lightning transaction history with detailed information."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <TransactionList
            walletId="alice"
            onSelectTransaction={setSelectedTransaction}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <TransactionList
            walletId="bob"
            onSelectTransaction={setSelectedTransaction}
            onLog={addLog}
          />
        )
      }
      logs={entries}
    >
      {/* Transaction details panel */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </ScenarioPage>
  );
}
