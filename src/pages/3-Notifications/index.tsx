import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { NotificationSubscriber } from './components/NotificationSubscriber';
import { QuickPayButtons } from './components/QuickPayButtons';
import { useTransactionLog, useWallet } from '@/hooks';

export default function Notifications() {
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  return (
    <ScenarioPage
      title="Real-time Payment Notifications"
      description="Bob subscribes to notifications and sees incoming payments in real-time as Alice sends them."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <QuickPayButtons
            recipientAddress={bobWallet.info?.lud16}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <NotificationSubscriber onLog={addLog} />
        )
      }
      logs={entries}
    />
  );
}
