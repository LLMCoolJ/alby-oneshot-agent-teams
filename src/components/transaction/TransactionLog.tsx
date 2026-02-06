import { Badge } from '@/components/ui';
import type { LogEntry } from '@/types';

interface TransactionLogProps {
  entries: LogEntry[];
  maxHeight?: string;
}

export function TransactionLog({ entries, maxHeight = '300px' }: TransactionLogProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Log</h3>
        <p className="text-slate-500 text-sm">No events yet. Start a transaction to see activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Log</h3>
      <div
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {entries.map((entry) => (
          <LogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function LogItem({ entry }: { entry: LogEntry }) {
  const timeStr = entry.timestamp.toLocaleTimeString();

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
        {timeStr}
      </span>
      <Badge variant={entry.type} size="sm">
        {entry.type}
      </Badge>
      <span className="text-sm text-slate-700 flex-1">
        {entry.message}
      </span>
    </div>
  );
}
