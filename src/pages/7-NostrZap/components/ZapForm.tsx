import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useZap } from '@/hooks/useZap';
import type { MockNostrNote, PaymentResult } from '@/types';

interface ZapFormProps {
  note: MockNostrNote;
  recipientAddress?: string;
  onZapSuccess: (result: PaymentResult) => void;
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const QUICK_AMOUNTS = [21, 100, 500, 1000];
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

export function ZapForm({ note, recipientAddress, onZapSuccess, onLog }: ZapFormProps) {
  const [amount, setAmount] = useState('21');
  const [comment, setComment] = useState('');
  const { sendZap, loading, error } = useZap('alice');

  const handleZap = async () => {
    if (!recipientAddress) {
      onLog('Recipient has no Lightning Address', 'error');
      return;
    }

    const amountSats = parseInt(amount, 10);
    if (isNaN(amountSats) || amountSats < 1) {
      onLog('Invalid amount', 'error');
      return;
    }

    onLog(`Sending ${amountSats} sat zap to ${note.author.name}...`, 'info');

    try {
      const result = await sendZap({
        recipientAddress,
        amount: amountSats,
        recipientPubkey: note.pubkey,
        eventId: note.id,
        relays: DEFAULT_RELAYS,
        comment: comment || undefined,
      });
      onZapSuccess(result);
    } catch (err) {
      onLog(`Zap failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick amount buttons */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Zap Amount
        </label>
        <div className="flex gap-2 mb-2">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              data-testid={`zap-amount-${quickAmount}`}
              onClick={() => setAmount(String(quickAmount))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                amount === String(quickAmount)
                  ? 'bg-bitcoin text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚡ {quickAmount}
            </button>
          ))}
        </div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          placeholder="Custom amount"
          data-testid="zap-custom-amount"
        />
      </div>

      {/* Comment */}
      <Input
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Great post! ⚡"
        maxLength={280}
        data-testid="zap-comment"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleZap}
        loading={loading}
        disabled={!recipientAddress}
        className="w-full"
        data-testid="send-zap-button"
      >
        ⚡ Zap {amount} sats
      </Button>

      {/* Info box */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
        <strong>Note:</strong> In a real Nostr client, zaps would be signed with your
        Nostr private key and published as zap receipts to relays.
      </div>
    </div>
  );
}
