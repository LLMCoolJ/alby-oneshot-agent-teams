import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { LightningAddressDisplay } from './components/LightningAddressDisplay';
import { PayToAddressForm } from './components/PayToAddressForm';
import { useTransactionLog, useWallet } from '@/hooks';

export default function LightningAddressPage() {
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Lightning Address Payment"
      description="Pay to a Lightning Address (like email) without needing an invoice. The system handles invoice creation automatically."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <PayToAddressForm onLog={addLog} />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <LightningAddressDisplay />
        )
      }
      logs={entries}
    />
  );
}
