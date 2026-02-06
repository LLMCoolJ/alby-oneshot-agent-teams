import { QRCodeSVG } from 'qrcode.react';
import { CopyButton } from './CopyButton';

/** Props for the QRCode component */
export interface QRCodeProps {
  /** The value to encode in the QR code */
  value: string;
  /** QR code size in pixels (default 200) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show the encoded value as truncated text below the QR code */
  showValue?: boolean;
  /** Label displayed above the QR code */
  label?: string;
}

/** QR code display with optional label, value text, and copy button */
export function QRCode({
  value,
  size = 200,
  className = '',
  showValue = false,
  label,
}: QRCodeProps) {
  return (
    <div
      data-testid="qrcode"
      className={['bg-white p-4 rounded-lg flex flex-col items-center gap-3', className].join(' ')}
    >
      {label && (
        <p className="text-sm font-medium text-slate-700" data-testid="qrcode-label">
          {label}
        </p>
      )}
      <QRCodeSVG value={value} size={size} data-testid="qrcode-svg" />
      {showValue && (
        <p
          className="text-xs font-mono text-slate-500 truncate max-w-full"
          data-testid="qrcode-value"
          title={value}
        >
          {value}
        </p>
      )}
      <CopyButton value={value} label="Copy" />
    </div>
  );
}
