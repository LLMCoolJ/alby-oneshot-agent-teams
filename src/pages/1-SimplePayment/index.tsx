import { useState } from 'react';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import { CreateInvoiceForm } from './components/CreateInvoiceForm';
import { InvoiceDisplay } from './components/InvoiceDisplay';
import { PayInvoiceForm } from './components/PayInvoiceForm';
import { PaymentResultDisplay } from './components/PaymentResultDisplay';
import { useTransactionLog } from '@/hooks/useTransactionLog';
import { useWallet } from '@/hooks';
import type { Nip47Transaction } from '@getalby/sdk/nwc';
import type { PaymentResult } from '@/types';

export default function SimplePayment() {
  const [invoice, setInvoice] = useState<Nip47Transaction | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const { entries, addLog, clearLogs } = useTransactionLog();

  const aliceWallet = useWallet('alice');
  const bobWallet = useWallet('bob');

  const handleInvoiceCreated = (inv: Nip47Transaction) => {
    setInvoice(inv);
    setPaymentResult(null);
    addLog(`Invoice created for ${inv.amount / 1000} sats`, 'success');
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    addLog(`Payment successful! Preimage: ${result.preimage.slice(0, 16)}...`, 'success');
  };

  const handleReset = () => {
    setInvoice(null);
    setPaymentResult(null);
    clearLogs();
  };

  return (
    <ScenarioPage
      title="Simple Invoice Payment"
      description="Bob creates a BOLT-11 invoice, Alice pays it. The fundamental Lightning payment flow."
      aliceContent={
        aliceWallet.status === 'connected' && (
          <div className="space-y-4 mt-4">
            <PayInvoiceForm
              onPaymentSuccess={handlePaymentSuccess}
              onLog={addLog}
              disabled={paymentResult !== null}
            />
            {paymentResult && (
              <PaymentResultDisplay result={paymentResult} />
            )}
          </div>
        )
      }
      bobContent={
        bobWallet.status === 'connected' && (
          <div className="space-y-4 mt-4">
            {!invoice ? (
              <CreateInvoiceForm
                onInvoiceCreated={handleInvoiceCreated}
                onLog={addLog}
              />
            ) : (
              <InvoiceDisplay
                invoice={invoice}
                onReset={handleReset}
              />
            )}
          </div>
        )
      }
      logs={entries}
    />
  );
}
