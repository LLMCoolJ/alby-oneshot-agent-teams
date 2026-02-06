import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { InvoiceCreator } from './components/InvoiceCreator';
import { PayAndProve } from './components/PayAndProve';
import { PreimageVerifier } from './components/PreimageVerifier';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Nip47Transaction } from '@getalby/sdk/nwc';

export default function ProofOfPayment() {
  const [invoice, setInvoice] = useState<Nip47Transaction | null>(null);
  const [preimage, setPreimage] = useState<string | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleReset = () => {
    setInvoice(null);
    setPreimage(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Proof of Payment"
      description="Alice pays Bob and receives a preimage that cryptographically proves the payment was made."
      aliceContent={
        aliceWallet.status === 'connected' && invoice && (
          <PayAndProve
            invoice={invoice}
            onPreimageReceived={setPreimage}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          invoice ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Invoice created! Payment hash is embedded in the invoice.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-slate-500 hover:text-slate-700"
                data-testid="create-new-invoice"
              >
                Create new invoice
              </button>
            </div>
          ) : (
            <InvoiceCreator
              onInvoiceCreated={setInvoice}
              onLog={addLog}
            />
          )
        )
      }
      logs={entries}
    >
      {/* Verification section */}
      <PreimageVerifier
        invoice={invoice}
        preimage={preimage}
        onLog={addLog}
      />
    </ScenarioPage>
  );
}
