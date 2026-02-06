import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { MockNostrNote } from './components/MockNostrNote';
import { ZapForm } from './components/ZapForm';
import { ZapResult } from './components/ZapResult';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { MockNostrNote as MockNoteType, PaymentResult } from '@/types';

// Demo note for Bob
const DEMO_NOTE: MockNoteType = {
  id: 'note1abc123def456',
  pubkey: 'npub1bob123...',
  content: 'Just set up my Lightning wallet! Anyone want to test zaps? ⚡',
  created_at: Math.floor(Date.now() / 1000) - 3600,
  author: {
    name: 'Bob',
    picture: undefined,
  },
};

export default function NostrZapPage() {
  const [zapResult, setZapResult] = useState<PaymentResult | null>(null);
  const { entries, addLog } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleZapSuccess = (result: PaymentResult) => {
    setZapResult(result);
    addLog('Zap sent successfully!', 'success');
  };

  const handleReset = () => {
    setZapResult(null);
  };

  return (
    <ScenarioPage
      title="Nostr Zap"
      description="Alice zaps Bob's Nostr note with a Lightning payment. Zaps are social tips with cryptographic proof."
      aliceContent={
        aliceWallet.status === 'connected' && (
          zapResult ? (
            <ZapResult result={zapResult} onReset={handleReset} />
          ) : (
            <ZapForm
              note={DEMO_NOTE}
              recipientAddress={bobWallet.info?.lud16}
              onZapSuccess={handleZapSuccess}
              onLog={addLog}
            />
          )
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <MockNostrNote note={DEMO_NOTE} lightningAddress={bobWallet.info?.lud16} />
        )
      }
      logs={entries}
    >
      {/* Educational content */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-3">How Zaps Work</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900 mb-1">Zap Request (kind 9734)</div>
            <p className="text-purple-700">
              A signed Nostr event containing the zap amount, comment, and
              references to the note being zapped.
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900 mb-1">Zap Receipt (kind 9735)</div>
            <p className="text-purple-700">
              Published after payment, proving the zap happened. Contains
              the original request and payment proof.
            </p>
          </div>
        </div>
      </div>
    </ScenarioPage>
  );
}
