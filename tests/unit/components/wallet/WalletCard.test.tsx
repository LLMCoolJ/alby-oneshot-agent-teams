import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletCard } from '@/components/wallet/WalletCard';

vi.mock('@/hooks', () => ({
  useWallet: vi.fn().mockReturnValue({
    status: 'disconnected',
    balance: null,
    info: null,
    error: null,
    id: 'alice',
    nwcUrl: null,
  }),
  useBalance: vi.fn().mockReturnValue({
    sats: null,
    loading: false,
    millisats: null,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/wallet/WalletConnect', () => ({
  WalletConnect: ({ walletId }: { walletId: string }) => (
    <div data-testid="wallet-connect">{walletId}</div>
  ),
}));

vi.mock('@/components/wallet/BalanceDisplay', () => ({
  BalanceDisplay: ({ sats, loading }: { sats: number | null; loading: boolean }) => (
    <div data-testid="balance-display">{loading ? 'loading' : sats}</div>
  ),
}));

describe('WalletCard', () => {
  it('renders with default title for alice', () => {
    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders with default title for bob', () => {
    render(<WalletCard walletId="bob" />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<WalletCard walletId="alice" title="Sender" />);
    expect(screen.getByText('Sender')).toBeInTheDocument();
  });

  it('shows WalletConnect when disconnected', () => {
    render(<WalletCard walletId="alice" />);
    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
  });

  it('shows disconnected badge when disconnected', () => {
    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows BalanceDisplay and children when connected', async () => {
    const { useWallet, useBalance } = await import('@/hooks');
    vi.mocked(useWallet).mockReturnValue({
      status: 'connected',
      balance: 100_000_000,
      info: { alias: 'Test Wallet', color: '#ff0000', pubkey: 'abc', network: 'testnet', blockHeight: 12345, methods: [] },
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
    });
    vi.mocked(useBalance).mockReturnValue({
      sats: 100_000,
      loading: false,
      millisats: 100_000_000,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <WalletCard walletId="alice">
        <div data-testid="child-content">Actions</div>
      </WalletCard>
    );

    expect(screen.getByTestId('balance-display')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-connect')).not.toBeInTheDocument();
  });

  it('shows connected badge when connected', async () => {
    const { useWallet } = await import('@/hooks');
    vi.mocked(useWallet).mockReturnValue({
      status: 'connected',
      balance: 100_000_000,
      info: { alias: 'Test Wallet', color: '#ff0000', pubkey: 'abc', network: 'testnet', blockHeight: 12345, methods: [] },
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
    });

    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows connecting badge when connecting', async () => {
    const { useWallet } = await import('@/hooks');
    vi.mocked(useWallet).mockReturnValue({
      status: 'connecting',
      balance: null,
      info: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
    });

    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows error badge when in error state', async () => {
    const { useWallet } = await import('@/hooks');
    vi.mocked(useWallet).mockReturnValue({
      status: 'error',
      balance: null,
      info: null,
      error: 'Connection failed',
      id: 'alice',
      nwcUrl: null,
    });

    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows alias as subtitle when connected', async () => {
    const { useWallet } = await import('@/hooks');
    vi.mocked(useWallet).mockReturnValue({
      status: 'connected',
      balance: 100_000_000,
      info: { alias: 'My Lightning Wallet', color: '#ff0000', pubkey: 'abc', network: 'testnet', blockHeight: 12345, methods: [] },
      error: null,
      id: 'alice',
      nwcUrl: 'nostr+walletconnect://test',
    });

    render(<WalletCard walletId="alice" />);
    expect(screen.getByText('My Lightning Wallet')).toBeInTheDocument();
  });

  it('passes className to Card', () => {
    const { container } = render(<WalletCard walletId="alice" className="custom-class" />);
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
