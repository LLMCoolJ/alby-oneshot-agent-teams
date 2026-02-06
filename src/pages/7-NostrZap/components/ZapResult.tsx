import { Button, CopyButton } from '@/components/ui';
import type { PaymentResult } from '@/types';

interface ZapResultProps {
  result: PaymentResult;
  onReset: () => void;
}

export function ZapResult({ result, onReset }: ZapResultProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
        <span className="text-4xl">⚡</span>
        <h3 className="text-lg font-semibold text-purple-900 mt-2">Zap Sent!</h3>
        <p className="text-sm text-purple-700 mt-1">
          Your zap has been sent successfully.
        </p>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-2">
        <div>
          <span className="text-slate-600">Preimage (proof):</span>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 p-2 bg-white rounded border text-xs font-mono truncate">
              {result.preimage}
            </code>
            <CopyButton value={result.preimage} />
          </div>
        </div>
      </div>

      <Button variant="secondary" onClick={onReset} className="w-full" data-testid="send-another-zap-button">
        Send Another Zap
      </Button>
    </div>
  );
}
