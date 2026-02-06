import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '@/pages/6-TransactionHistory/index';
import { TransactionList } from '@/pages/6-TransactionHistory/components/TransactionList';
import { TransactionDetails } from '@/pages/6-TransactionHistory/components/TransactionDetails';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types';

// ============================================================================
// Shared Mock Data
// ============================================================================

const { mockAddLog, mockAliceWallet, mockBobWallet, mockLoadMore, mockRefresh, mockTransactions, mockUseWallet } = vi.hoisted(() => {
  const mockAddLog = vi.fn();
  const mockAliceWallet = { status: 'connected' as const, balance: 100000000, error: null };
  const mockBobWallet = { status: 'connected' as const, balance: 50000000, error: null };
  const mockLoadMore = vi.fn();
  const mockRefresh = vi.fn().mockResolvedValue(undefined);
  const mockUseWallet = vi.fn().mockImplementation((id: string) => {
    if (id === 'alice') return mockAliceWallet;
    return mockBobWallet;
  });
  const mockTransactions = [
    {
      id: 'hash1',
      type: 'incoming' as const,
      state: 'settled' as const,
      amount: 1000000, // millisats
      feesPaid: 0, // millisats
      description: 'Coffee payment',
      invoice: 'lnbc1000n1...',
      preimage: 'pre1',
      paymentHash: 'hash1',
      createdAt: new Date('2024-01-15T12:34:56Z'),
      settledAt: new Date('2024-01-15T12:34:58Z'),
      expiresAt: null,
    },
    {
      id: 'hash2',
      type: 'outgoing' as const,
      state: 'settled' as const,
      amount: 500000, // millisats
      feesPaid: 1000, // millisats
      description: 'Sent payment',
      invoice: 'lnbc500n1...',
      preimage: 'pre2',
      paymentHash: 'hash2',
      createdAt: new Date('2024-01-15T12:30:00Z'),
      settledAt: new Date('2024-01-15T12:30:02Z'),
      expiresAt: null,
    },
  ];
  return { mockAddLog, mockAliceWallet, mockBobWallet, mockLoadMore, mockRefresh, mockTransactions, mockUseWallet };
});

// ============================================================================
// Module Mocks
// ============================================================================

// Mock wallet hook
vi.mock('@/hooks', () => ({
  useWallet: mockUseWallet,
}));

// Mock transaction log
vi.mock('@/hooks/useTransactionLog', () => ({
  useTransactionLog: vi.fn().mockReturnValue({
    entries: [],
    addLog: mockAddLog,
  }),
}));

// Mock transactions hook
vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn().mockReturnValue({
    transactions: mockTransactions,
    loading: false,
    error: null,
    hasMore: true,
    loadMore: mockLoadMore,
    refresh: mockRefresh,
  }),
}));

// Mock WalletCard and TransactionLog layout components
vi.mock('@/components/wallet/WalletCard', () => ({
  WalletCard: ({ children, walletId }: { children: React.ReactNode; walletId: string }) => (
    <div data-testid={`wallet-card-${walletId}`}>{children}</div>
  ),
}));

vi.mock('@/components/transaction/TransactionLog', () => ({
  TransactionLog: () => <div data-testid="transaction-log" />,
}));

// ============================================================================
// TransactionHistory Page
// ============================================================================

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock implementations
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'alice') return mockAliceWallet;
      return mockBobWallet;
    });
    vi.mocked(useTransactions).mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
  });

  it('renders the page title and description', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText(/View and filter your Lightning transaction history/)).toBeInTheDocument();
  });

  it('renders transaction lists for both wallets when connected', () => {
    render(<TransactionHistory />);
    expect(screen.getByTestId('alice-filter')).toBeInTheDocument();
    expect(screen.getByTestId('bob-filter')).toBeInTheDocument();
  });

  it('does not show TransactionList when wallet is disconnected', () => {
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'alice') return { status: 'disconnected', balance: null, error: null };
      return mockBobWallet;
    });

    render(<TransactionHistory />);
    expect(screen.queryByTestId('alice-filter')).not.toBeInTheDocument();
    expect(screen.getByTestId('bob-filter')).toBeInTheDocument();
  });

  it('shows transaction details when a transaction is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionHistory />);

    const txButtons = screen.getAllByTestId('transaction-hash1');
    await user.click(txButtons[0]);

    expect(screen.getByTestId('transaction-details')).toBeInTheDocument();
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
  });

  it('closes transaction details when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionHistory />);

    const txButtons = screen.getAllByTestId('transaction-hash1');
    await user.click(txButtons[0]);
    expect(screen.getByTestId('transaction-details')).toBeInTheDocument();

    await user.click(screen.getByTestId('close-details'));
    expect(screen.queryByTestId('transaction-details')).not.toBeInTheDocument();
  });
});

// ============================================================================
// TransactionList
// ============================================================================

describe('TransactionList', () => {
  const mockOnSelect = vi.fn();
  const mockOnLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTransactions).mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
  });

  it('renders filter select with All/Incoming/Outgoing options', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    const select = screen.getByTestId('alice-filter');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Incoming')).toBeInTheDocument();
    expect(screen.getByText('Outgoing')).toBeInTheDocument();
  });

  it('shows Refresh button', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByTestId('alice-refresh')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders transaction items with correct amounts', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByText('+1,000 sats')).toBeInTheDocument();
    expect(screen.getByText('-500 sats')).toBeInTheDocument();
  });

  it('shows correct direction arrows (up for incoming, down for outgoing)', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    // \u2191 = up arrow for incoming, \u2193 = down arrow for outgoing
    expect(screen.getByText('\u2191')).toBeInTheDocument();
    expect(screen.getByText('\u2193')).toBeInTheDocument();
  });

  it('shows Settled status badges', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    const badges = screen.getAllByText('Settled');
    expect(badges.length).toBe(2);
  });

  it('shows Pending badge for pending transactions', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [
        { ...mockTransactions[0], id: 'pending1', state: 'pending' as const },
      ],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows Failed badge for failed transactions', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [
        { ...mockTransactions[0], id: 'failed1', state: 'failed' as const },
      ],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows Held badge for accepted transactions', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [
        { ...mockTransactions[0], id: 'held1', state: 'accepted' as const },
      ],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByText('Held')).toBeInTheDocument();
  });

  it('shows "No transactions found" when empty', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByTestId('alice-empty')).toHaveTextContent('No transactions found');
  });

  it('shows Load More button when hasMore', () => {
    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.getByTestId('alice-load-more')).toBeInTheDocument();
    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('does not show Load More button when hasMore is false', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: mockTransactions,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    expect(screen.queryByTestId('alice-load-more')).not.toBeInTheDocument();
  });

  it('TransactionItem click calls onSelectTransaction', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList walletId="alice" onSelectTransaction={mockOnSelect} onLog={mockOnLog} />
    );

    await user.click(screen.getByTestId('transaction-hash1'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockTransactions[0]);
  });
});

// ============================================================================
// TransactionDetails
// ============================================================================

describe('TransactionDetails', () => {
  const mockOnClose = vi.fn();

  const mockTransaction: Transaction = {
    id: 'hash1',
    type: 'incoming',
    state: 'settled',
    amount: 1000000, // millisats
    feesPaid: 2000, // millisats = 2 sats
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields (amount, type, description, dates, hash, invoice)', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);

    // Amount
    expect(screen.getByText('+1,000 sats')).toBeInTheDocument();
    // Type
    expect(screen.getByText('incoming')).toBeInTheDocument();
    // Description
    expect(screen.getByText('Coffee payment')).toBeInTheDocument();
    // Created date
    expect(screen.getByText('Created:')).toBeInTheDocument();
    // Settled date
    expect(screen.getByText('Settled:')).toBeInTheDocument();
    // Payment Hash
    expect(screen.getByText('Payment Hash:')).toBeInTheDocument();
    expect(screen.getByTestId('payment-hash')).toHaveTextContent('hash123abc');
    // Invoice
    expect(screen.getByText('Invoice:')).toBeInTheDocument();
    expect(screen.getByTestId('invoice')).toHaveTextContent('lnbc1000n1pj9npjpp5...');
  });

  it('shows preimage when available', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);

    expect(screen.getByText('Preimage:')).toBeInTheDocument();
    expect(screen.getByTestId('preimage')).toHaveTextContent('abc123def456');
  });

  it('hides preimage when null', () => {
    const noPreimage: Transaction = { ...mockTransaction, preimage: null };
    render(<TransactionDetails transaction={noPreimage} onClose={mockOnClose} />);

    expect(screen.queryByTestId('preimage')).not.toBeInTheDocument();
  });

  it('shows metadata in collapsible section', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);

    expect(screen.getByTestId('metadata')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('hides metadata when not present', () => {
    const noMeta: Transaction = { ...mockTransaction, metadata: undefined };
    render(<TransactionDetails transaction={noMeta} onClose={mockOnClose} />);

    expect(screen.queryByTestId('metadata')).not.toBeInTheDocument();
  });

  it('Close button calls onClose', async () => {
    const user = userEvent.setup();
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);

    await user.click(screen.getByTestId('close-details'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows fees when > 0', () => {
    render(<TransactionDetails transaction={mockTransaction} onClose={mockOnClose} />);

    expect(screen.getByText('Fees Paid:')).toBeInTheDocument();
    expect(screen.getByText('2 sats')).toBeInTheDocument();
  });

  it('hides fees when zero', () => {
    const noFees: Transaction = { ...mockTransaction, feesPaid: 0 };
    render(<TransactionDetails transaction={noFees} onClose={mockOnClose} />);

    expect(screen.queryByText('Fees Paid:')).not.toBeInTheDocument();
  });

  it('displays outgoing amount with minus sign', () => {
    const outgoing: Transaction = { ...mockTransaction, type: 'outgoing' };
    render(<TransactionDetails transaction={outgoing} onClose={mockOnClose} />);

    expect(screen.getByText('-1,000 sats')).toBeInTheDocument();
  });

  it('hides settled date when null', () => {
    const pending: Transaction = { ...mockTransaction, settledAt: null, state: 'pending' };
    render(<TransactionDetails transaction={pending} onClose={mockOnClose} />);

    expect(screen.queryByText('Settled:')).not.toBeInTheDocument();
  });

  it('shows dash for missing description', () => {
    const noDesc: Transaction = { ...mockTransaction, description: '' };
    render(<TransactionDetails transaction={noDesc} onClose={mockOnClose} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
