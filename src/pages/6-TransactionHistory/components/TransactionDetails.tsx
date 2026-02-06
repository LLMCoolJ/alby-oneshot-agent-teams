import { Button, Badge, CopyButton } from '@/components/ui';
import { CONSTANTS } from '@/types';
import type { Transaction } from '@/types';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const amountSats = Math.floor(transaction.amount / CONSTANTS.MILLISATS_PER_SAT); // sats
  const feesSats = Math.floor(transaction.feesPaid / CONSTANTS.MILLISATS_PER_SAT); // sats
  const isIncoming = transaction.type === 'incoming';

  return (
    <div className="card mt-6" data-testid="transaction-details">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-details">
          Close
        </Button>
      </div>

      <div className="space-y-4">
        {/* Amount */}
        <div className="text-center py-4">
          <div className={`text-3xl font-bold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '+' : '-'}{amountSats.toLocaleString()} sats
          </div>
          <Badge variant={transaction.state === 'settled' ? 'success' : 'warning'}>
            {transaction.state}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid gap-3 text-sm">
          <DetailRow label="Type" value={transaction.type} />
          <DetailRow label="Description" value={transaction.description || '-'} />
          <DetailRow
            label="Created"
            value={transaction.createdAt.toLocaleString()}
          />
          {transaction.settledAt && (
            <DetailRow
              label="Settled"
              value={transaction.settledAt.toLocaleString()}
            />
          )}
          {transaction.feesPaid > 0 && (
            <DetailRow label="Fees Paid" value={`${feesSats} sats`} />
          )}

          {/* Payment hash */}
          <div>
            <span className="text-slate-600">Payment Hash:</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono break-all" data-testid="payment-hash">
                {transaction.paymentHash}
              </code>
              <CopyButton value={transaction.paymentHash} />
            </div>
          </div>

          {/* Preimage (if settled) */}
          {transaction.preimage && (
            <div>
              <span className="text-slate-600">Preimage:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono break-all" data-testid="preimage">
                  {transaction.preimage}
                </code>
                <CopyButton value={transaction.preimage} />
              </div>
            </div>
          )}

          {/* Invoice */}
          <div>
            <span className="text-slate-600">Invoice:</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono truncate" data-testid="invoice">
                {transaction.invoice}
              </code>
              <CopyButton value={transaction.invoice} />
            </div>
          </div>

          {/* Metadata */}
          {transaction.metadata && (
            <details className="mt-2" data-testid="metadata">
              <summary className="cursor-pointer text-slate-600">Metadata</summary>
              <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
