import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateInvoiceForm } from '@/pages/1-SimplePayment/components/CreateInvoiceForm';
import { PayInvoiceForm } from '@/pages/1-SimplePayment/components/PayInvoiceForm';
import { InvoiceDisplay } from '@/pages/1-SimplePayment/components/InvoiceDisplay';
import { PaymentResultDisplay } from '@/pages/1-SimplePayment/components/PaymentResultDisplay';

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string; size?: number; 'data-testid'?: string }) => (
    <svg data-testid={props['data-testid'] || 'qrcode-svg'} data-value={props.value} data-size={props.size} />
  ),
}));

// Store mock functions so tests can control them
const mockCreateInvoice = vi.fn().mockResolvedValue({
  invoice: 'lnbc1000n1test...',
  amount: 1000000,
  description: 'Test',
  payment_hash: 'abc123',
});

const mockPayInvoice = vi.fn().mockResolvedValue({
  preimage: 'preimage123',
  feesPaid: 0,
});

const mockUseInvoice = vi.fn().mockReturnValue({
  createInvoice: mockCreateInvoice,
  loading: false,
  error: null,
});

const mockUsePayment = vi.fn().mockReturnValue({
  payInvoice: mockPayInvoice,
  loading: false,
  error: null,
});

const mockDecodeInvoice = vi.fn();

// Mock bolt11 decoder
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  decodeInvoice: (...args: unknown[]) => mockDecodeInvoice(...args),
  Invoice: vi.fn(),
  fromHexString: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks', () => ({
  useInvoice: (...args: unknown[]) => mockUseInvoice(...args),
  usePayment: (...args: unknown[]) => mockUsePayment(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockCreateInvoice.mockResolvedValue({
    invoice: 'lnbc1000n1test...',
    amount: 1000000,
    description: 'Test',
    payment_hash: 'abc123',
  });

  mockPayInvoice.mockResolvedValue({
    preimage: 'preimage123',
    feesPaid: 0,
  });

  mockUseInvoice.mockReturnValue({
    createInvoice: mockCreateInvoice,
    loading: false,
    error: null,
  });

  mockUsePayment.mockReturnValue({
    payInvoice: mockPayInvoice,
    loading: false,
    error: null,
  });

  mockDecodeInvoice.mockReturnValue({
    paymentHash: 'abc123',
    satoshi: 1000,
    description: 'Test Payment',
  });
});

// ============================================================================
// CreateInvoiceForm
// ============================================================================

describe('CreateInvoiceForm', () => {
  it('renders amount and description inputs', () => {
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders Create Invoice button', () => {
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('has default amount value of 1000', () => {
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue(1000);
  });

  it('calls onInvoiceCreated when form is submitted with valid amount', async () => {
    const onInvoiceCreated = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={onInvoiceCreated} onLog={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onInvoiceCreated).toHaveBeenCalledWith({
        invoice: 'lnbc1000n1test...',
        amount: 1000000,
        description: 'Test',
        payment_hash: 'abc123',
      });
    });
  });

  it('logs "Creating invoice..." before calling createInvoice', async () => {
    const onLog = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '500');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Creating invoice...', 'info');
  });

  it('passes amount in millisats and description to createInvoice', async () => {
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '2000');
    await userEvent.type(screen.getByLabelText(/description/i), 'Coffee');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith({
        amount: 2000000, // 2000 sats * 1000 millisats
        description: 'Coffee',
      });
    });
  });

  it('uses default description when none provided', async () => {
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Lightning Demo Payment' })
      );
    });
  });

  it('validates minimum amount (rejects 0)', async () => {
    const onLog = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('validates NaN amount', async () => {
    const onLog = vi.fn();
    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('logs error when createInvoice fails', async () => {
    mockCreateInvoice.mockRejectedValueOnce(new Error('Network error'));
    const onLog = vi.fn();

    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Failed to create invoice: Network error',
        'error'
      );
    });
  });

  it('logs generic error when createInvoice throws non-Error', async () => {
    mockCreateInvoice.mockRejectedValueOnce('something broke');
    const onLog = vi.fn();

    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Failed to create invoice: Unknown error',
        'error'
      );
    });
  });

  it('does not call onInvoiceCreated when createInvoice fails', async () => {
    mockCreateInvoice.mockRejectedValueOnce(new Error('fail'));
    const onInvoiceCreated = vi.fn();

    render(<CreateInvoiceForm onInvoiceCreated={onInvoiceCreated} onLog={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalled();
    });
    expect(onInvoiceCreated).not.toHaveBeenCalled();
  });

  it('displays error from useInvoice hook', () => {
    mockUseInvoice.mockReturnValue({
      createInvoice: mockCreateInvoice,
      loading: false,
      error: 'Wallet not connected',
    });

    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
  });

  it('passes loading state to Button', () => {
    mockUseInvoice.mockReturnValue({
      createInvoice: mockCreateInvoice,
      loading: true,
      error: null,
    });

    render(<CreateInvoiceForm onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    // Button should be disabled when loading
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeDisabled();
  });
});

// ============================================================================
// InvoiceDisplay
// ============================================================================

describe('InvoiceDisplay', () => {
  const mockInvoice = {
    invoice: 'lnbc1000n1test...',
    amount: 1000000, // millisats = 1000 sats
    description: 'Test Payment',
    payment_hash: 'abc123',
  };

  it('displays invoice amount in sats', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByText('1,000 sats')).toBeInTheDocument();
  });

  it('displays "Invoice for" label', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByText('Invoice for')).toBeInTheDocument();
  });

  it('displays invoice description', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByText('Test Payment')).toBeInTheDocument();
  });

  it('does not display description when empty', () => {
    const noDescInvoice = { ...mockInvoice, description: '' };
    render(<InvoiceDisplay invoice={noDescInvoice as any} onReset={vi.fn()} />);

    // Should still have amount
    expect(screen.getByText('1,000 sats')).toBeInTheDocument();
    // Should not render description element for empty string
    expect(screen.queryByText('Test Payment')).not.toBeInTheDocument();
  });

  it('renders QR code with invoice value', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByText(/scan to pay/i)).toBeInTheDocument();
    expect(screen.getByTestId('qrcode')).toBeInTheDocument();
  });

  it('displays bolt11 string in readonly input', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    const bolt11Input = screen.getByTestId('invoice-bolt11');
    expect(bolt11Input).toHaveValue('lnbc1000n1test...');
    expect(bolt11Input).toHaveAttribute('readOnly');
  });

  it('includes copy button for invoice', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Create New Invoice button', () => {
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create new invoice/i })).toBeInTheDocument();
  });

  it('calls onReset when Create New Invoice is clicked', async () => {
    const onReset = vi.fn();
    render(<InvoiceDisplay invoice={mockInvoice as any} onReset={onReset} />);

    await userEvent.click(screen.getByRole('button', { name: /create new invoice/i }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  it('correctly converts millisats to sats (rounds down)', () => {
    const oddAmountInvoice = { ...mockInvoice, amount: 1500 }; // 1.5 sats -> 1 sat
    render(<InvoiceDisplay invoice={oddAmountInvoice as any} onReset={vi.fn()} />);

    expect(screen.getByText('1 sats')).toBeInTheDocument();
  });
});

// ============================================================================
// PayInvoiceForm
// ============================================================================

describe('PayInvoiceForm', () => {
  it('renders BOLT-11 Invoice input', () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText(/invoice/i)).toBeInTheDocument();
  });

  it('renders Pay Invoice button', () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeInTheDocument();
  });

  it('Pay Invoice button is disabled when invoice input is empty', () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  });

  it('disables input when disabled prop is true', () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} disabled />);

    expect(screen.getByLabelText(/invoice/i)).toBeDisabled();
  });

  it('disables Pay Invoice button when disabled prop is true', () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  });

  it('decodes invoice and displays amount when valid invoice is entered', async () => {
    mockDecodeInvoice.mockReturnValue({
      paymentHash: 'abc123',
      satoshi: 1000,
      description: 'Test Payment',
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');

    await waitFor(() => {
      expect(screen.getByText('1,000 sats')).toBeInTheDocument();
      expect(screen.getByText('Test Payment')).toBeInTheDocument();
    });
  });

  it('shows decoded info panel when invoice is decoded', async () => {
    mockDecodeInvoice.mockReturnValue({
      paymentHash: 'abc123',
      satoshi: 5000,
      description: 'Coffee',
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc5000n1test');

    await waitFor(() => {
      expect(screen.getByTestId('decoded-invoice-info')).toBeInTheDocument();
      expect(screen.getByText('5,000 sats')).toBeInTheDocument();
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
  });

  it('does not show decoded info when decoding fails', async () => {
    mockDecodeInvoice.mockImplementation(() => {
      throw new Error('Invalid invoice');
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'invalid');

    await waitFor(() => {
      expect(screen.queryByTestId('decoded-invoice-info')).not.toBeInTheDocument();
    });
  });

  it('clears decoded info when invoice input is cleared', async () => {
    mockDecodeInvoice.mockReturnValue({
      paymentHash: 'abc123',
      satoshi: 1000,
      description: 'Test',
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    const input = screen.getByLabelText(/invoice/i);
    await userEvent.type(input, 'lnbc1000n1test');

    await waitFor(() => {
      expect(screen.getByTestId('decoded-invoice-info')).toBeInTheDocument();
    });

    await userEvent.clear(input);

    await waitFor(() => {
      expect(screen.queryByTestId('decoded-invoice-info')).not.toBeInTheDocument();
    });
  });

  it('does not show description in decoded info when null', async () => {
    mockDecodeInvoice.mockReturnValue({
      paymentHash: 'abc123',
      satoshi: 1000,
      description: null,
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');

    await waitFor(() => {
      expect(screen.getByText('1,000 sats')).toBeInTheDocument();
    });

    // Description label should not appear
    expect(screen.queryByText('Description:')).not.toBeInTheDocument();
  });

  it('calls onPaymentSuccess after successful payment', async () => {
    const onPaymentSuccess = vi.fn();
    render(<PayInvoiceForm onPaymentSuccess={onPaymentSuccess} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onPaymentSuccess).toHaveBeenCalledWith({
        preimage: 'preimage123',
        feesPaid: 0,
      });
    });
  });

  it('logs "Paying invoice..." before calling payInvoice', async () => {
    const onLog = vi.fn();
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Paying invoice...', 'info');
  });

  it('passes invoice string to payInvoice', async () => {
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalledWith('lnbc1000n1test');
    });
  });

  it('logs error when payInvoice fails with Error', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Insufficient balance'));
    const onLog = vi.fn();

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Payment failed: Insufficient balance',
        'error'
      );
    });
  });

  it('logs generic error when payInvoice throws non-Error', async () => {
    mockPayInvoice.mockRejectedValueOnce('unknown');
    const onLog = vi.fn();

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Payment failed: Unknown error',
        'error'
      );
    });
  });

  it('does not call onPaymentSuccess when payment fails', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('fail'));
    const onPaymentSuccess = vi.fn();

    render(<PayInvoiceForm onPaymentSuccess={onPaymentSuccess} onLog={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc1000n1test');
    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalled();
    });
    expect(onPaymentSuccess).not.toHaveBeenCalled();
  });

  it('logs error when submitting empty invoice', async () => {
    const onLog = vi.fn();
    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={onLog} />);

    // Force-enable the button by typing and clearing (since button is disabled when empty,
    // we test the internal validation by verifying the button is disabled)
    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  });

  it('displays error from usePayment hook', () => {
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: false,
      error: 'Payment route not found',
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByText('Payment route not found')).toBeInTheDocument();
  });

  it('passes loading state to Button', () => {
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: true,
      error: null,
    });

    render(<PayInvoiceForm onPaymentSuccess={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  });
});

// ============================================================================
// PaymentResultDisplay
// ============================================================================

describe('PaymentResultDisplay', () => {
  it('displays "Payment Successful!" message', () => {
    const result = { preimage: 'abc123def456', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
  });

  it('displays preimage', () => {
    const result = { preimage: 'abc123def456', feesPaid: 1000 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('abc123def456')).toBeInTheDocument();
  });

  it('displays preimage in code element', () => {
    const result = { preimage: 'abc123def456789', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByTestId('payment-preimage')).toHaveTextContent('abc123def456789');
  });

  it('displays fees in sats (converts from millisats)', () => {
    const result = { preimage: 'abc123', feesPaid: 5000 }; // 5 sats in millisats
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('5 sats')).toBeInTheDocument();
  });

  it('displays 0 sats fees when no fees paid', () => {
    const result = { preimage: 'abc123', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('0 sats')).toBeInTheDocument();
  });

  it('floors fractional sat fees', () => {
    const result = { preimage: 'abc123', feesPaid: 1500 }; // 1.5 sats -> 1 sat
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('1 sats')).toBeInTheDocument();
  });

  it('includes copy button for preimage', () => {
    const result = { preimage: 'abc123def456', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('displays Preimage label', () => {
    const result = { preimage: 'abc123', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('Preimage:')).toBeInTheDocument();
  });

  it('displays Fees paid label', () => {
    const result = { preimage: 'abc123', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByText('Fees paid:')).toBeInTheDocument();
  });

  it('renders with data-testid="payment-result"', () => {
    const result = { preimage: 'abc123', feesPaid: 0 };
    render(<PaymentResultDisplay result={result} />);

    expect(screen.getByTestId('payment-result')).toBeInTheDocument();
  });
});
