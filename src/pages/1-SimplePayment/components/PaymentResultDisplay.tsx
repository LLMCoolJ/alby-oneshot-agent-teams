import { CopyButton } from '@/components/ui';
import { CONSTANTS, PaymentResult } from '@/types';

interface PaymentResultDisplayProps {
  result: PaymentResult;
}

export function PaymentResultDisplay({ result }: PaymentResultDisplayProps) {
  const feesSats = Math.floor(result.feesPaid / CONSTANTS.MILLISATS_PER_SAT); // sats

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="payment-result">
      <div className="flex items-center gap-2 mb-3">
        <CheckIcon className="w-5 h-5 text-green-600" />
        <span className="font-medium text-green-800">Payment Successful!</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-slate-600">Preimage:</span>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 p-2 bg-white rounded border text-xs font-mono truncate" data-testid="payment-preimage">
              {result.preimage}
            </code>
            <CopyButton value={result.preimage} />
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Fees paid:</span>
          <span className="font-medium" data-testid="payment-fees">{feesSats} sats</span>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
