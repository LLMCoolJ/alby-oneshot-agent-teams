import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { CreateHoldInvoice } from './components/CreateHoldInvoice';
import { HoldInvoiceStatus } from './components/HoldInvoiceStatus';
import { PayHoldInvoice } from './components/PayHoldInvoice';
import { useTransactionLog, useWallet } from '@/hooks';
import type { HoldInvoice } from '@/types';

export default function HoldInvoice() {
  const [holdInvoice, setHoldInvoice] = useState<HoldInvoice | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();
  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleHoldInvoiceCreated = (invoice: HoldInvoice) => {
    setHoldInvoice(invoice);
    addLog(`Hold invoice created: ${invoice.amount / 1000} sats`, 'success');
  };

  const handleStateChange = (newState: HoldInvoice['state']) => {
    if (holdInvoice) {
      setHoldInvoice({ ...holdInvoice, state: newState });
      addLog(`Invoice state changed to: ${newState}`, 'info');
    }
  };

  const handleReset = () => {
    setHoldInvoice(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Hold Invoice (Escrow)"
      description="Conditional payments using hold invoices. Alice's payment is locked until Bob settles or cancels."
      aliceContent={
        aliceWallet.status === 'connected' && holdInvoice && (
          <PayHoldInvoice
            invoice={holdInvoice.invoice}
            state={holdInvoice.state}
            onLog={addLog}
          />
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          holdInvoice ? (
            <HoldInvoiceStatus
              holdInvoice={holdInvoice}
              onStateChange={handleStateChange}
              onReset={handleReset}
              onLog={addLog}
            />
          ) : (
            <CreateHoldInvoice
              onCreated={handleHoldInvoiceCreated}
              onLog={addLog}
            />
          )
        )
      }
      logs={entries}
    >
      {/* Explainer section */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-3">How Hold Invoices Work</h3>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">1. Create</div>
            <p className="text-slate-600">
              Bob generates a preimage and its hash. The hash is included in the invoice.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">2. Hold</div>
            <p className="text-slate-600">
              Alice pays, but funds are locked. Only Bob has the preimage to claim them.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">3. Settle/Cancel</div>
            <p className="text-slate-600">
              Bob reveals preimage to receive funds, or cancels to refund Alice.
            </p>
          </div>
        </div>
      </div>
    </ScenarioPage>
  );
}
