import { useState, useCallback, useRef } from 'react';

/** Props for the CopyButton component */
export interface CopyButtonProps {
  /** The text value to copy to clipboard */
  value: string;
  /** Optional visible label next to the icon */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback fired after a successful copy */
  onCopied?: () => void;
}

/** Clipboard icon (SVG) */
function ClipboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/** Checkmark icon (SVG) */
function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Fallback copy using a temporary textarea */
function fallbackCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      ok ? resolve() : reject(new Error('execCommand copy failed'));
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

/** Button that copies a value to the clipboard with visual feedback */
export function CopyButton({
  value,
  label,
  className = '',
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        await fallbackCopy(value);
      }
      setCopied(true);
      onCopied?.();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently
    }
  }, [value, onCopied]);

  return (
    <button
      type="button"
      data-testid="copy-button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied!' : 'Copy'}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors',
        'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bitcoin focus-visible:ring-offset-2',
        'motion-reduce:transition-none',
        copied ? 'text-green-600' : 'text-slate-600',
        className,
      ].join(' ')}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}
