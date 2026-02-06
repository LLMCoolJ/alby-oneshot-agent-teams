import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '@/pages/6-TransactionHistory/index';
import { useWallet } from '@/hooks';

const { mockAddLog, mockAliceWallet, mockBobWallet, mockTransactions, mockLoadMore, mockRefresh } = vi.hoisted(() => {
  const mockAddLog = vi.fn();
  const mockAliceWallet = { status: 'connected' as const, balance: 100000000, error: null };
  const mockBobWallet = { status: 'connected' as const, balance: 50000000, error: null };
  const mockTransactions = [
    {
      id: 'hash1',
      type: 'incoming' as const,
      state: 'settled' as const,
      amount: 1000000,
      feesPaid: 0,
      description: 'Payment received',
      invoice: 'lnbc1000n1...',
      preimage: 'pre1',
      paymentHash: 'hash1',
      createdAt: new Date('2024-01-15T12:34:56Z'),
      settledAt: new Date('2024-01-15T12:34:58Z'),
      expiresAt: null,
    },
  ];
  const mockLoadMore = vi.fn();
  const mockRefresh = vi.fn();
  return { mockAddLog, mockAliceWallet, mockBobWallet, mockTransactions, mockLoadMore, mockRefresh };
});

// Mock wallet hook
vi.mock('@/hooks', () => ({
  useWallet: vi.fn().mockImplementation((id: string) => {
    if (id === 'alice') return mockAliceWallet;
    return mockBobWallet;
  }),
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
    hasMore: false,
    loadMore: mockLoadMore,
    refresh: mockRefresh,
  }),
}));

// Mock WalletCard and TransactionLog
vi.mock('@/components/wallet/WalletCard', () => ({
  WalletCard: ({ children, walletId }: { children: React.ReactNode; walletId: string }) => (
    <div data-testid={`wallet-card-${walletId}`}>{children}</div>
  ),
}));

vi.mock('@/components/transaction/TransactionLog', () => ({
  TransactionLog: () => <div data-testid="transaction-log" />,
}));

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and description', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText(/View and filter/)).toBeInTheDocument();
  });

  it('renders transaction lists for both wallets', () => {
    render(<TransactionHistory />);
    expect(screen.getByTestId('alice-filter')).toBeInTheDocument();
    expect(screen.getByTestId('bob-filter')).toBeInTheDocument();
  });

  it('shows transaction details when a transaction is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionHistory />);

    const txButtons = screen.getAllByTestId('transaction-hash1');
    await user.click(txButtons[0]);

    expect(screen.getByTestId('transaction-details')).toBeInTheDocument();
    expect(screen.getAllByText(/1,000 sats/).length).toBeGreaterThanOrEqual(1);
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

  it('does not show transaction list when wallet is disconnected', () => {
    vi.mocked(useWallet).mockImplementation(((id: string) => {
      if (id === 'alice') return { id: 'alice', status: 'disconnected', nwcUrl: null, balance: null, info: null, error: null };
      return mockBobWallet;
    }) as any);

    render(<TransactionHistory />);
    expect(screen.queryByTestId('alice-filter')).not.toBeInTheDocument();
    expect(screen.getByTestId('bob-filter')).toBeInTheDocument();
  });
});
