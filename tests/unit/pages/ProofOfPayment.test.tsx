import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceCreator } from '@/pages/5-ProofOfPayment/components/InvoiceCreator';
import { PayAndProve } from '@/pages/5-ProofOfPayment/components/PayAndProve';
import { PreimageVerifier } from '@/pages/5-ProofOfPayment/components/PreimageVerifier';

// Store mock functions so tests can control them
const mockCreateInvoice = vi.fn().mockResolvedValue({
  invoice: 'lnbc1000n1test...',
  amount: 1000000, // millisats
  description: 'Proof of Payment Demo',
  payment_hash: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
});

const mockPayInvoice = vi.fn().mockResolvedValue({
  preimage: 'preimage123abc456def789012345678901234567890abcdef1234567890abcdef',
  feesPaid: 0,
});

const mockUseInvoice = vi.fn().mockReturnValue({
  createInvoice: mockCreateInvoice,
  loading: false,
  error: null,
  invoice: null,
});

const mockUsePayment = vi.fn().mockReturnValue({
  payInvoice: mockPayInvoice,
  loading: false,
  error: null,
});

const mockValidatePreimage = vi.fn().mockReturnValue(true);

// Mock bolt11 Invoice
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  Invoice: vi.fn().mockImplementation(() => ({
    paymentHash: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
    validatePreimage: mockValidatePreimage,
  })),
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
    amount: 1000000, // millisats
    description: 'Proof of Payment Demo',
    payment_hash: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
  });

  mockPayInvoice.mockResolvedValue({
    preimage: 'preimage123abc456def789012345678901234567890abcdef1234567890abcdef',
    feesPaid: 0,
  });

  mockUseInvoice.mockReturnValue({
    createInvoice: mockCreateInvoice,
    loading: false,
    error: null,
    invoice: null,
  });

  mockUsePayment.mockReturnValue({
    payInvoice: mockPayInvoice,
    loading: false,
    error: null,
  });

  mockValidatePreimage.mockReturnValue(true);
});

// ============================================================================
// InvoiceCreator
// ============================================================================

describe('InvoiceCreator', () => {
  it('renders amount input', () => {
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('renders Create Invoice button', () => {
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('has default amount value of 1000', () => {
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue(1000);
  });

  it('calls onInvoiceCreated when form is submitted', async () => {
    const onInvoiceCreated = vi.fn();
    render(<InvoiceCreator onInvoiceCreated={onInvoiceCreated} onLog={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onInvoiceCreated).toHaveBeenCalledWith(expect.objectContaining({
        invoice: 'lnbc1000n1test...',
        payment_hash: expect.any(String),
      }));
    });
  });

  it('logs "Creating invoice..." before calling createInvoice', async () => {
    const onLog = vi.fn();
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Creating invoice...', 'info');
  });

  it('passes amount in millisats to createInvoice', async () => {
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '2000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith({
        amount: 2000000, // 2000 sats * 1000 millisats
        description: 'Proof of Payment Demo',
      });
    });
  });

  it('validates minimum amount (rejects 0)', async () => {
    const onLog = vi.fn();
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('validates NaN amount', async () => {
    const onLog = vi.fn();
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid amount', 'error');
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('logs error when createInvoice fails with Error', async () => {
    mockCreateInvoice.mockRejectedValueOnce(new Error('Network error'));
    const onLog = vi.fn();

    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed: Network error', 'error');
    });
  });

  it('logs generic error when createInvoice throws non-Error', async () => {
    mockCreateInvoice.mockRejectedValueOnce('something broke');
    const onLog = vi.fn();

    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed: Unknown error', 'error');
    });
  });

  it('does not call onInvoiceCreated when createInvoice fails', async () => {
    mockCreateInvoice.mockRejectedValueOnce(new Error('fail'));
    const onInvoiceCreated = vi.fn();

    render(<InvoiceCreator onInvoiceCreated={onInvoiceCreated} onLog={vi.fn()} />);

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
      invoice: null,
    });

    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
  });

  it('passes loading state to Button', () => {
    mockUseInvoice.mockReturnValue({
      createInvoice: mockCreateInvoice,
      loading: true,
      error: null,
      invoice: null,
    });

    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeDisabled();
  });

  it('logs success with payment hash on invoice creation', async () => {
    const onLog = vi.fn();
    render(<InvoiceCreator onInvoiceCreated={vi.fn()} onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        expect.stringContaining('Invoice created with payment_hash:'),
        'success'
      );
    });
  });
});

// ============================================================================
// PayAndProve
// ============================================================================

describe('PayAndProve', () => {
  const mockInvoice = {
    invoice: 'lnbc1000n1test...',
    amount: 1000000, // millisats = 1000 sats
    description: 'Proof of Payment Demo',
    payment_hash: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
  };

  it('displays invoice amount in sats', () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('1,000 sats')).toBeInTheDocument();
  });

  it('displays payment hash (truncated)', () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    // payment_hash.slice(0, 20) = 'abc123def45678901234', rendered with '...' appended
    expect(screen.getByText(/abc123def45678901234/)).toBeInTheDocument();
  });

  it('renders Pay Invoice button', () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeInTheDocument();
  });

  it('calls payInvoice with correct invoice string', async () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalledWith('lnbc1000n1test...');
    });
  });

  it('logs "Paying invoice..." before payment', async () => {
    const onLog = vi.fn();
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    expect(onLog).toHaveBeenCalledWith('Paying invoice...', 'info');
  });

  it('calls onPreimageReceived after successful payment', async () => {
    const onPreimageReceived = vi.fn();
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={onPreimageReceived}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onPreimageReceived).toHaveBeenCalledWith(
        'preimage123abc456def789012345678901234567890abcdef1234567890abcdef'
      );
    });
  });

  it('displays preimage after successful payment', async () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(screen.getByText('preimage123abc456def789012345678901234567890abcdef1234567890abcdef')).toBeInTheDocument();
    });
  });

  it('shows Payment Complete badge after payment', async () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(screen.getByText('Payment Complete')).toBeInTheDocument();
    });
  });

  it('shows proof explanation text after payment', async () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(screen.getByText(/this preimage is your proof/i)).toBeInTheDocument();
    });
  });

  it('logs success with preimage on payment', async () => {
    const onLog = vi.fn();
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        expect.stringContaining('Payment successful! Received preimage:'),
        'success'
      );
    });
  });

  it('logs error when payInvoice fails with Error', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('Insufficient balance'));
    const onLog = vi.fn();

    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={onLog}
      />
    );

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

    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Payment failed: Unknown error',
        'error'
      );
    });
  });

  it('does not call onPreimageReceived when payment fails', async () => {
    mockPayInvoice.mockRejectedValueOnce(new Error('fail'));
    const onPreimageReceived = vi.fn();

    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={onPreimageReceived}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(mockPayInvoice).toHaveBeenCalled();
    });
    expect(onPreimageReceived).not.toHaveBeenCalled();
  });

  it('displays error from usePayment hook', () => {
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: false,
      error: 'Payment route not found',
    });

    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Payment route not found')).toBeInTheDocument();
  });

  it('passes loading state to Button', () => {
    mockUsePayment.mockReturnValue({
      payInvoice: mockPayInvoice,
      loading: true,
      error: null,
    });

    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  });

  it('correctly converts millisats to sats (rounds down)', () => {
    const oddAmountInvoice = { ...mockInvoice, amount: 1500 }; // 1.5 sats -> 1 sat
    render(
      <PayAndProve
        invoice={oddAmountInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('1 sats')).toBeInTheDocument();
  });

  it('hides Pay Invoice button after successful payment', async () => {
    render(
      <PayAndProve
        invoice={mockInvoice as any}
        onPreimageReceived={vi.fn()}
        onLog={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /pay invoice/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay invoice/i })).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// PreimageVerifier
// ============================================================================

describe('PreimageVerifier', () => {
  it('renders Preimage Verification heading', () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Preimage Verification')).toBeInTheDocument();
  });

  it('renders educational content about why preimages matter', () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    expect(screen.getByText(/the preimage is revealed only when payment succeeds/i)).toBeInTheDocument();
    expect(screen.getByText(/cryptographically impossible to guess/i)).toBeInTheDocument();
  });

  it('shows verified state when invoice and preimage are provided (auto-verify)', async () => {
    const invoice = {
      payment_hash: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="matching_preimage"
        onLog={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Payment Proven!')).toBeInTheDocument();
    });
  });

  it('shows invalid state when preimage does not match', async () => {
    mockValidatePreimage.mockReturnValue(false);

    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="wrong_preimage"
        onLog={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText('Preimage does not match')).toBeInTheDocument();
    });
  });

  it('logs success when verification passes', async () => {
    const onLog = vi.fn();
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="valid_preimage"
        onLog={onLog}
      />
    );

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Verification successful! Preimage matches payment hash.', 'success');
    });
  });

  it('logs error when verification fails', async () => {
    mockValidatePreimage.mockReturnValue(false);
    const onLog = vi.fn();
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="bad_preimage"
        onLog={onLog}
      />
    );

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Verification failed! Preimage does not match.', 'error');
    });
  });

  it('displays payment hash in verification result', async () => {
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="valid_preimage"
        onLog={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('abc123def456789012345678901234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });
  });

  it('shows SHA256 matches text for valid preimage', async () => {
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="valid_preimage"
        onLog={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/sha256\(preimage\) matches payment hash/i)).toBeInTheDocument();
    });
  });

  it('shows SHA256 does not match text for invalid preimage', async () => {
    mockValidatePreimage.mockReturnValue(false);
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="bad_preimage"
        onLog={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/sha256\(preimage\) does not match payment hash/i)).toBeInTheDocument();
    });
  });

  it('allows manual verification with details toggle', async () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={vi.fn()}
      />
    );

    // Open manual verification
    await userEvent.click(screen.getByText(/verify manually/i));

    expect(screen.getByLabelText(/bolt-11 invoice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preimage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify preimage/i })).toBeInTheDocument();
  });

  it('validates both fields required for manual verification', async () => {
    const onLog = vi.fn();
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByText(/verify manually/i));
    await userEvent.click(screen.getByRole('button', { name: /verify preimage/i }));

    expect(onLog).toHaveBeenCalledWith('Please enter both invoice and preimage', 'error');
  });

  it('performs manual verification when both fields are filled', async () => {
    const onLog = vi.fn();
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={onLog}
      />
    );

    await userEvent.click(screen.getByText(/verify manually/i));
    await userEvent.type(screen.getByLabelText(/bolt-11 invoice/i), 'lnbc1000n1manual...');
    await userEvent.type(screen.getByLabelText(/preimage/i), 'manual_preimage_hex');
    await userEvent.click(screen.getByRole('button', { name: /verify preimage/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Verifying preimage...', 'info');
      expect(onLog).toHaveBeenCalledWith('Verification successful! Preimage matches payment hash.', 'success');
    });
  });

  it('does not auto-verify when only invoice is provided', () => {
    const onLog = vi.fn();
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'lnbc1000n1test...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage={null}
        onLog={onLog}
      />
    );

    // Should not call any verification
    expect(onLog).not.toHaveBeenCalledWith('Verifying preimage...', 'info');
  });

  it('does not auto-verify when only preimage is provided', () => {
    const onLog = vi.fn();

    render(
      <PreimageVerifier
        invoice={null}
        preimage="some_preimage"
        onLog={onLog}
      />
    );

    expect(onLog).not.toHaveBeenCalledWith('Verifying preimage...', 'info');
  });

  it('does not show verification result when no verification has been done', () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={vi.fn()}
      />
    );

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });

  it('lists educational points about proof of payment', () => {
    render(
      <PreimageVerifier
        invoice={null}
        preimage={null}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText(/anyone can verify the proof without trusting alice or bob/i)).toBeInTheDocument();
    expect(screen.getByText(/used in atomic swaps, escrow, and dispute resolution/i)).toBeInTheDocument();
  });

  it('logs verification error when Invoice constructor throws', async () => {
    const { Invoice } = await import('@getalby/lightning-tools/bolt11');
    (Invoice as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('Invalid invoice format');
    });

    const onLog = vi.fn();
    const invoice = {
      payment_hash: 'abc123',
      invoice: 'invalid...',
      amount: 1000000,
    };

    render(
      <PreimageVerifier
        invoice={invoice as any}
        preimage="some_preimage"
        onLog={onLog}
      />
    );

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Verification error: Invalid invoice format',
        'error'
      );
    });
  });
});
