import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock qrcode.react before importing the component
vi.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string; size?: number; 'data-testid'?: string }) => (
    <svg data-testid={props['data-testid'] || 'qrcode-svg'} data-value={props.value} data-size={props.size} />
  ),
}));

import { QRCode } from '@/components/ui/QRCode';

describe('QRCode', () => {
  it('renders QR code with correct value', () => {
    render(<QRCode value="lnbc1234" />);
    expect(screen.getByTestId('qrcode')).toBeInTheDocument();
    const svg = screen.getByTestId('qrcode-svg');
    expect(svg).toHaveAttribute('data-value', 'lnbc1234');
  });

  it('applies custom size', () => {
    render(<QRCode value="test" size={300} />);
    const svg = screen.getByTestId('qrcode-svg');
    expect(svg).toHaveAttribute('data-size', '300');
  });

  it('shows value when showValue is true', () => {
    render(<QRCode value="lnbc1234567890" showValue />);
    expect(screen.getByTestId('qrcode-value')).toHaveTextContent('lnbc1234567890');
  });

  it('shows label when provided', () => {
    render(<QRCode value="test" label="Scan to pay" />);
    expect(screen.getByTestId('qrcode-label')).toHaveTextContent('Scan to pay');
  });

  it('includes copy functionality', () => {
    render(<QRCode value="lnbc1234" />);
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
  });
});
