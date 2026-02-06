import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionDetails } from '@/pages/6-TransactionHistory/components/TransactionDetails';
import type { Transaction } from '@/types';

const mockTransaction: Transaction = {
  id: 'hash1',
  type: 'incoming',
  state: 'settled',
  amount: 1000000, // millisats
  feesPaid: 500, // millisats
  description: 'Coffee payment',
  invoice: 'lnbc1000n1pj9npjpp5...',
  preimage: 'abc123def456',
  paymentHash: 'hash123abc',
  createdAt: new Date('2024-01-15T12:34:56Z'),
  settledAt: new Date('2024-01-15T12:34:58Z'),
  expiresAt: null,
  metadata: {
    comment: 'Thanks for the coffee!',
  },
};

describe('TransactionDetails', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transaction details panel', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByTestId('transaction-details')).toBeInTheDocument();
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
  });

  it('displays amount in sats', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByText('+1,000 sats')).toBeInTheDocument();
  });

  it('displays outgoing amount with minus sign', () => {
    const outgoing: Transaction = { ...mockTransaction, type: 'outgoing' };
    render(<TransactionDetails transaction={outgoing} onClose={mockOnClose} />);
    expect(screen.getByText('-1,000 sats')).toBeInTheDocument();
  });

  it('shows transaction type', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByText('incoming')).toBeInTheDocument();
  });

  it('shows description', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByText('Coffee payment')).toBeInTheDocument();
  });

  it('shows payment hash with copy button', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByTestId('payment-hash')).toHaveTextContent('hash123abc');
  });

  it('shows preimage when available', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByTestId('preimage')).toHaveTextContent('abc123def456');
  });

  it('hides preimage when null', () => {
    const noPreimage: Transaction = { ...mockTransaction, preimage: null };
    render(<TransactionDetails transaction={noPreimage} onClose={mockOnClose} />);
    expect(screen.queryByTestId('preimage')).not.toBeInTheDocument();
  });

  it('shows invoice', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByTestId('invoice')).toHaveTextContent('lnbc1000n1pj9npjpp5...');
  });

  it('shows status badge', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByText('settled')).toBeInTheDocument();
  });

  it('shows settled date when available', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByText('Settled:')).toBeInTheDocument();
  });

  it('hides settled date when null', () => {
    const pending: Transaction = { ...mockTransaction, settledAt: null, state: 'pending' };
    render(<TransactionDetails transaction={pending} onClose={mockOnClose} />);
    expect(screen.queryByText('Settled:')).not.toBeInTheDocument();
  });

  it('shows fees when greater than zero', () => {
    // feesPaid is 500 millisats = 0 sats (Math.floor(500/1000) = 0)
    // Use a transaction with fees >= 1000 millisats
    const withFees: Transaction = { ...mockTransaction, feesPaid: 2000 }; // millisats
    render(<TransactionDetails transaction={withFees} onClose={mockOnClose} />);
    expect(screen.getByText('Fees Paid:')).toBeInTheDocument();
    expect(screen.getByText('2 sats')).toBeInTheDocument();
  });

  it('hides fees when zero', () => {
    const noFees: Transaction = { ...mockTransaction, feesPaid: 0 };
    render(<TransactionDetails transaction={noFees} onClose={mockOnClose} />);
    expect(screen.queryByText('Fees Paid:')).not.toBeInTheDocument();
  });

  it('shows metadata when present', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    expect(screen.getByTestId('metadata')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('hides metadata when not present', () => {
    const noMeta: Transaction = { ...mockTransaction, metadata: undefined };
    render(<TransactionDetails transaction={noMeta} onClose={mockOnClose} />);
    expect(screen.queryByTestId('metadata')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    await user.click(screen.getByTestId('close-details'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows dash for missing description', () => {
    const noDesc: Transaction = { ...mockTransaction, description: '' };
    render(<TransactionDetails transaction={noDesc} onClose={mockOnClose} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders copy buttons for payment hash, preimage, and invoice', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);
    const copyButtons = screen.getAllByTestId('copy-button');
    expect(copyButtons.length).toBeGreaterThanOrEqual(3);
  });
});
