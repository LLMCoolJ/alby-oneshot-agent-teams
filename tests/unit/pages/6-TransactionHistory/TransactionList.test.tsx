import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '@/pages/6-TransactionHistory/components/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';

const { mockLoadMore, mockRefresh, mockTransactions } = vi.hoisted(() => {
  const mockLoadMore = vi.fn();
  const mockRefresh = vi.fn().mockResolvedValue(undefined);
  const mockTransactions = [
    {
      id: 'hash1',
      type: 'incoming' as const,
      state: 'settled' as const,
      amount: 1000000, // millisats
      feesPaid: 0,
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
      feesPaid: 1000,
      description: 'Sent payment',
      invoice: 'lnbc500n1...',
      preimage: 'pre2',
      paymentHash: 'hash2',
      createdAt: new Date('2024-01-15T12:30:00Z'),
      settledAt: new Date('2024-01-15T12:30:02Z'),
      expiresAt: null,
    },
  ];
  return { mockLoadMore, mockRefresh, mockTransactions };
});

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

describe('TransactionList', () => {
  const mockOnSelect = vi.fn();
  const mockOnLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transaction items', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByText(/1,000 sats/)).toBeInTheDocument();
    expect(screen.getByText(/500 sats/)).toBeInTheDocument();
  });

  it('displays incoming transaction with + prefix', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByText('+1,000 sats')).toBeInTheDocument();
  });

  it('displays outgoing transaction with - prefix', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByText('-500 sats')).toBeInTheDocument();
  });

  it('shows transaction descriptions', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByText(/Coffee payment/)).toBeInTheDocument();
    expect(screen.getByText(/Sent payment/)).toBeInTheDocument();
  });

  it('shows status badges', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    const badges = screen.getAllByText('Settled');
    expect(badges.length).toBe(2);
  });

  it('calls onSelectTransaction when transaction is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    await user.click(screen.getByTestId('transaction-hash1'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('shows Load More button when hasMore is true', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByTestId('alice-load-more')).toBeInTheDocument();
  });

  it('calls loadMore when Load More button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    await user.click(screen.getByTestId('alice-load-more'));
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('shows filter select with correct options', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    const select = screen.getByTestId('alice-filter');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Incoming')).toBeInTheDocument();
    expect(screen.getByText('Outgoing')).toBeInTheDocument();
  });

  it('calls onLog on mount', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(mockOnLog).toHaveBeenCalledWith("Loading alice's transactions...", 'info');
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    await user.click(screen.getByTestId('alice-refresh'));
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockOnLog).toHaveBeenCalledWith('Refreshing transactions...', 'info');
  });

  it('shows error message when error exists', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [],
      loading: false,
      error: 'Failed to load',
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByTestId('alice-error')).toHaveTextContent('Failed to load');
  });

  it('shows empty state when no transactions', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByTestId('alice-empty')).toHaveTextContent('No transactions found');
  });

  it('shows spinner when loading with no transactions', () => {
    vi.mocked(useTransactions).mockReturnValueOnce({
      transactions: [],
      loading: true,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });

    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    // Two spinners: one in the Refresh button (loading=true), one in the content area
    expect(screen.getAllByTestId('spinner').length).toBeGreaterThanOrEqual(2);
  });

  it('shows correct direction arrows (up for incoming, down for outgoing)', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    // \u2191 = up arrow for incoming, \u2193 = down arrow for outgoing
    expect(screen.getByText('\u2191')).toBeInTheDocument();
    expect(screen.getByText('\u2193')).toBeInTheDocument();
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
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
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
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
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
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByText('Held')).toBeInTheDocument();
  });

  it('renders Refresh button', () => {
    render(
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.getByTestId('alice-refresh')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
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
      <TransactionList
        walletId="alice"
        onSelectTransaction={mockOnSelect}
        onLog={mockOnLog}
      />
    );

    expect(screen.queryByTestId('alice-load-more')).not.toBeInTheDocument();
  });
});
