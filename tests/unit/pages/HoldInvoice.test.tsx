import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateHoldInvoice } from '@/pages/4-HoldInvoice/components/CreateHoldInvoice';
import { HoldInvoiceStatus } from '@/pages/4-HoldInvoice/components/HoldInvoiceStatus';
import { PayHoldInvoice } from '@/pages/4-HoldInvoice/components/PayHoldInvoice';
import type { HoldInvoice } from '@/types';

// Mock hooks - use vi.hoisted so variables are available in vi.mock factories
const {
  mockCreateHoldInvoice,
  mockSettleHoldInvoice,
  mockCancelHoldInvoice,
  mockUseHoldInvoice,
  mockPayInvoice,
  mockUsePayment,
  mockSubscribe,
  mockUnsubscribe,
  mockUseNotifications,
} = vi.hoisted(() => {
  const mockCreateHoldInvoice = vi.fn();
  const mockSettleHoldInvoice = vi.fn();
  const mockCancelHoldInvoice = vi.fn();
  const mockUseHoldInvoice = vi.fn();
  const mockPayInvoice = vi.fn();
  const mockUsePayment = vi.fn();
  const mockSubscribe = vi.fn().mockResolvedValue(undefined);
  const mockUnsubscribe = vi.fn();
  const mockUseNotifications = vi.fn();
  return {
    mockCreateHoldInvoice,
    mockSettleHoldInvoice,
    mockCancelHoldInvoice,
    mockUseHoldInvoice,
    mockPayInvoice,
    mockUsePayment,
    mockSubscribe,
    mockUnsubscribe,
    mockUseNotifications,
  };
});

vi.mock('@/hooks', () => ({
  useHoldInvoice: mockUseHoldInvoice,
  usePayment: mockUsePayment,
  useNotifications: mockUseNotifications,
}));

vi.mock('@/hooks/useHoldInvoice', () => ({
  useHoldInvoice: mockUseHoldInvoice,
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: mockUseNotifications,
}));

vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, loading, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled || loading} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: ({ label, value, onChange, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} aria-label={label} {...props} />
    </div>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
  QRCode: ({ value }: any) => <div data-testid="qr-code">{value}</div>,
  CopyButton: ({ value: _value }: any) => <button data-testid="copy-button">Copy</button>,
}));

const mockHoldInvoice: HoldInvoice = {
  invoice: 'lnbc5000n1ptest...',
  paymentHash: 'a'.repeat(64),
  preimage: 'b'.repeat(64),
  state: 'created',
  amount: 5000000,
};

describe('CreateHoldInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHoldInvoice.mockResolvedValue(mockHoldInvoice);
    mockUseHoldInvoice.mockReturnValue({
      createHoldInvoice: mockCreateHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
      loading: false,
      error: null,
    });
  });

  it('renders form with amount and description fields', () => {
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText('Amount (sats)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
  });

  it('renders Create Hold Invoice button', () => {
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create hold invoice/i })).toBeInTheDocument();
  });

  it('shows info note about hold invoices', () => {
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByText(/hold invoices allow conditional payments/i)).toBeInTheDocument();
  });

  it('has default amount of 5000', () => {
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText('Amount (sats)')).toHaveValue(5000);
  });

  it('calls createHoldInvoice on form submit', async () => {
    const onCreated = vi.fn();
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={onCreated} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(mockCreateHoldInvoice).toHaveBeenCalledWith({
        amount: 5000000, // 5000 sats * 1000
        description: 'Hold Invoice Demo',
      });
    });
  });

  it('uses custom description when provided', async () => {
    const onCreated = vi.fn();
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={onCreated} onLog={onLog} />);

    const descInput = screen.getByLabelText('Description (optional)');
    await userEvent.type(descInput, 'Escrow for service');

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(mockCreateHoldInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Escrow for service' })
      );
    });
  });

  it('calls onCreated with the hold invoice result', async () => {
    const onCreated = vi.fn();
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={onCreated} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(mockHoldInvoice);
    });
  });

  it('logs preimage generation message on submit', async () => {
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Generating preimage and payment hash...', 'info');
  });

  it('logs error on invalid amount', async () => {
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={onLog} />);

    const amountInput = screen.getByLabelText('Amount (sats)');
    await userEvent.clear(amountInput);
    // Empty field: parseInt('', 10) returns NaN, which is invalid
    // Directly fire the form submit to bypass HTML5 validation
    const form = amountInput.closest('form')!;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
  });

  it('logs error on creation failure', async () => {
    mockCreateHoldInvoice.mockRejectedValue(new Error('Network error'));
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed: Network error', 'error');
    });
  });

  it('logs generic error for non-Error thrown values', async () => {
    mockCreateHoldInvoice.mockRejectedValue('something broke');
    const onLog = vi.fn();
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed: Unknown error', 'error');
    });
  });

  it('displays error from hook', () => {
    mockUseHoldInvoice.mockReturnValue({
      createHoldInvoice: mockCreateHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
      loading: false,
      error: 'Something went wrong',
    });

    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    mockUseHoldInvoice.mockReturnValue({
      createHoldInvoice: mockCreateHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
      loading: true,
      error: null,
    });

    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('allows custom amount entry', async () => {
    render(<CreateHoldInvoice onCreated={vi.fn()} onLog={vi.fn()} />);

    const amountInput = screen.getByLabelText('Amount (sats)');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '10000');

    await userEvent.click(screen.getByRole('button', { name: /create hold invoice/i }));

    await waitFor(() => {
      expect(mockCreateHoldInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 10000000 })
      );
    });
  });
});

describe('HoldInvoiceStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettleHoldInvoice.mockResolvedValue(undefined);
    mockCancelHoldInvoice.mockResolvedValue(undefined);
    mockUseHoldInvoice.mockReturnValue({
      createHoldInvoice: mockCreateHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
      loading: false,
      error: null,
    });
    mockUseNotifications.mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      isSubscribed: false,
      error: null,
    });
  });

  it('shows Created badge for created state', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('displays amount in sats', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/5,000 sats/)).toBeInTheDocument();
  });

  it('shows QR code for created state', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('shows invoice string in input for created state', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('lnbc5000n1ptest...')).toBeInTheDocument();
  });

  it('shows waiting for payment text in created state', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/waiting for payment/i)).toBeInTheDocument();
  });

  it('shows Listening indicator when subscribed in created state', () => {
    mockUseNotifications.mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      isSubscribed: true,
      error: null,
    });

    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('shows Held badge for accepted state', () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Held')).toBeInTheDocument();
  });

  it('shows Settle and Cancel buttons for accepted state', () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /settle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows action prompt text for accepted state', () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/payment is held/i)).toBeInTheDocument();
  });

  it('settles invoice and calls onStateChange', async () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onStateChange = vi.fn();
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={onStateChange}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /settle/i }));

    await waitFor(() => {
      expect(mockSettleHoldInvoice).toHaveBeenCalledWith(mockHoldInvoice.preimage);
      expect(onStateChange).toHaveBeenCalledWith('settled');
      expect(onLog).toHaveBeenCalledWith('Invoice settled! Funds received.', 'success');
    });
  });

  it('logs settling message when settle is clicked', async () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /settle/i }));

    expect(onLog).toHaveBeenCalledWith('Settling hold invoice (revealing preimage)...', 'info');
  });

  it('cancels invoice and calls onStateChange', async () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onStateChange = vi.fn();
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={onStateChange}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(mockCancelHoldInvoice).toHaveBeenCalledWith(mockHoldInvoice.paymentHash);
      expect(onStateChange).toHaveBeenCalledWith('cancelled');
      expect(onLog).toHaveBeenCalledWith('Invoice cancelled! Payer refunded.', 'success');
    });
  });

  it('logs cancelling message when cancel is clicked', async () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onLog).toHaveBeenCalledWith('Cancelling hold invoice (refunding payer)...', 'info');
  });

  it('logs error on settle failure', async () => {
    mockSettleHoldInvoice.mockRejectedValue(new Error('Settle failed'));
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /settle/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Settle failed: Settle failed', 'error');
    });
  });

  it('logs error on cancel failure', async () => {
    mockCancelHoldInvoice.mockRejectedValue(new Error('Cancel failed'));
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };
    const onLog = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Cancel failed: Cancel failed', 'error');
    });
  });

  it('shows Settled badge for settled state', () => {
    const settledInvoice = { ...mockHoldInvoice, state: 'settled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={settledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Settled')).toBeInTheDocument();
  });

  it('shows funds received message for settled state', () => {
    const settledInvoice = { ...mockHoldInvoice, state: 'settled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={settledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/funds have been received/i)).toBeInTheDocument();
  });

  it('shows Cancelled badge for cancelled state', () => {
    const cancelledInvoice = { ...mockHoldInvoice, state: 'cancelled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={cancelledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows refund message for cancelled state', () => {
    const cancelledInvoice = { ...mockHoldInvoice, state: 'cancelled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={cancelledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/refunded to the payer/i)).toBeInTheDocument();
  });

  it('shows Create New Hold Invoice button for settled state', () => {
    const settledInvoice = { ...mockHoldInvoice, state: 'settled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={settledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /create new hold invoice/i })).toBeInTheDocument();
  });

  it('shows Create New Hold Invoice button for cancelled state', () => {
    const cancelledInvoice = { ...mockHoldInvoice, state: 'cancelled' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={cancelledInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /create new hold invoice/i })).toBeInTheDocument();
  });

  it('calls onReset when Create New Hold Invoice is clicked', async () => {
    const settledInvoice = { ...mockHoldInvoice, state: 'settled' as const };
    const onReset = vi.fn();

    render(
      <HoldInvoiceStatus
        holdInvoice={settledInvoice}
        onStateChange={vi.fn()}
        onReset={onReset}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /create new hold invoice/i }));

    expect(onReset).toHaveBeenCalled();
  });

  it('shows Technical Details expandable section', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('shows payment hash in technical details', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/payment hash/i)).toBeInTheDocument();
  });

  it('shows error from hook', () => {
    mockUseHoldInvoice.mockReturnValue({
      createHoldInvoice: mockCreateHoldInvoice,
      settleHoldInvoice: mockSettleHoldInvoice,
      cancelHoldInvoice: mockCancelHoldInvoice,
      loading: false,
      error: 'Connection error',
    });

    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Connection error')).toBeInTheDocument();
  });

  it('subscribes to notifications with hold_invoice_accepted type', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(mockUseNotifications).toHaveBeenCalledWith('bob', expect.objectContaining({
      notificationTypes: ['hold_invoice_accepted'],
    }));
  });

  it('does not show QR code for accepted state', () => {
    const acceptedInvoice = { ...mockHoldInvoice, state: 'accepted' as const };

    render(
      <HoldInvoiceStatus
        holdInvoice={acceptedInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('does not show Settle/Cancel buttons for created state', () => {
    render(
      <HoldInvoiceStatus
        holdInvoice={mockHoldInvoice}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /settle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});

describe('PayHoldInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPayInvoice.mockResolvedValue({ preimage: 'abc123', feesPaid: 0 });
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: false,
      error: null,
      result: null,
      reset: vi.fn(),
    });
  });

  it('renders payment status as Not Paid initially', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Not Paid')).toBeInTheDocument();
  });

  it('renders Hold Invoice input field', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Hold Invoice')).toBeInTheDocument();
  });

  it('renders Pay Hold Invoice button', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /pay hold invoice/i })).toBeInTheDocument();
  });

  it('pays using the prop invoice when input is empty', async () => {
    const onLog = vi.fn();
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalledWith('lnbc5000n1ptest...');
    });
  });

  it('pays using the input invoice when provided', async () => {
    const onLog = vi.fn();
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    const input = screen.getByLabelText('Hold Invoice');
    await userEvent.type(input, 'lnbc_custom_invoice');

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalledWith('lnbc_custom_invoice');
    });
  });

  it('logs paying message when pay is clicked', async () => {
    const onLog = vi.fn();
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Paying hold invoice...', 'info');
  });

  it('logs success message after payment completes', async () => {
    const onLog = vi.fn();
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Payment completed!', 'success');
    });
  });

  it('shows Completed badge after successful payment', async () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('hides input and button after successful payment', async () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay hold invoice/i })).not.toBeInTheDocument();
    });
  });

  it('logs cancellation message for cancel errors', async () => {
    mockPayInvoice.mockRejectedValue(new Error('Payment cancelled by recipient'));
    const onLog = vi.fn();

    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Payment was cancelled - funds refunded', 'info');
    });
  });

  it('logs error for non-cancel payment failures', async () => {
    mockPayInvoice.mockRejectedValue(new Error('Insufficient balance'));
    const onLog = vi.fn();

    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Payment failed: Insufficient balance', 'error');
    });
  });

  it('shows Cancelled badge when state is cancelled', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="cancelled"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('hides input and button when state is cancelled', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="cancelled"
        onLog={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /pay hold invoice/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hold Invoice')).not.toBeInTheDocument();
  });

  it('shows error from hook when not paying', () => {
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: false,
      error: 'Payment service down',
      result: null,
      reset: vi.fn(),
    });

    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Payment service down')).toBeInTheDocument();
  });

  it('logs error when no invoice is available', async () => {
    const onLog = vi.fn();
    render(
      <PayHoldInvoice
        invoice=""
        state="created"
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay hold invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Please enter an invoice', 'error');
    expect(mockPayInvoice).not.toHaveBeenCalled();
  });

  it('shows Payment Status label', () => {
    render(
      <PayHoldInvoice
        invoice="lnbc5000n1ptest..."
        state="created"
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Payment Status:')).toBeInTheDocument();
  });
});
