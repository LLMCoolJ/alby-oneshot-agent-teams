import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletConnect } from '@/components/wallet/WalletConnect';

const { mockConnect, mockUseWallet } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockUseWallet: vi.fn().mockReturnValue({
    status: 'disconnected',
    balance: null,
    info: null,
    error: null,
    id: 'alice',
    nwcUrl: null,
  }),
}));

vi.mock('@/hooks', () => ({
  useWallet: mockUseWallet,
  useWalletActions: vi.fn().mockReturnValue({
    connect: mockConnect,
  }),
}));

vi.mock('@/types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/types')>();
  return {
    ...actual,
    isValidNwcUrl: (url: string) => url.startsWith('nostr+walletconnect://'),
  };
});

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.mockReturnValue({
      status: 'disconnected',
      balance: null,
      info: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
    });
  });

  it('renders input and connect button', () => {
    render(<WalletConnect walletId="alice" />);
    expect(screen.getByTestId('nwc-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('connect button is disabled when input is empty', () => {
    render(<WalletConnect walletId="alice" />);
    expect(screen.getByTestId('connect-wallet-btn')).toBeDisabled();
  });

  it('connect button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<WalletConnect walletId="alice" />);

    await user.type(screen.getByTestId('nwc-url-input'), 'nostr+walletconnect://test');
    expect(screen.getByTestId('connect-wallet-btn')).not.toBeDisabled();
  });

  it('shows validation error for invalid NWC URL', async () => {
    const user = userEvent.setup();
    render(<WalletConnect walletId="alice" />);

    await user.type(screen.getByTestId('nwc-url-input'), 'invalid-url');
    await user.click(screen.getByTestId('connect-wallet-btn'));

    expect(screen.getByText('Invalid NWC URL. Must start with nostr+walletconnect://')).toBeInTheDocument();
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('calls connect with valid NWC URL', async () => {
    const user = userEvent.setup();
    render(<WalletConnect walletId="alice" />);

    await user.type(screen.getByTestId('nwc-url-input'), 'nostr+walletconnect://test123');
    await user.click(screen.getByTestId('connect-wallet-btn'));

    expect(mockConnect).toHaveBeenCalledWith('nostr+walletconnect://test123');
  });

  it('clears validation error on valid submit', async () => {
    const user = userEvent.setup();
    render(<WalletConnect walletId="alice" />);

    // First submit invalid
    await user.type(screen.getByTestId('nwc-url-input'), 'bad');
    await user.click(screen.getByTestId('connect-wallet-btn'));
    expect(screen.getByText('Invalid NWC URL. Must start with nostr+walletconnect://')).toBeInTheDocument();

    // Clear and type valid
    await user.clear(screen.getByTestId('nwc-url-input'));
    await user.type(screen.getByTestId('nwc-url-input'), 'nostr+walletconnect://valid');
    await user.click(screen.getByTestId('connect-wallet-btn'));

    expect(screen.queryByText('Invalid NWC URL. Must start with nostr+walletconnect://')).not.toBeInTheDocument();
  });

  it('shows wallet error from context', () => {
    mockUseWallet.mockReturnValue({
      status: 'error',
      balance: null,
      info: null,
      error: 'Connection refused',
      id: 'alice',
      nwcUrl: null,
    });

    render(<WalletConnect walletId="alice" />);
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('shows loading state when connecting', () => {
    mockUseWallet.mockReturnValue({
      status: 'connecting',
      balance: null,
      info: null,
      error: null,
      id: 'alice',
      nwcUrl: null,
    });

    render(<WalletConnect walletId="alice" />);
    const btn = screen.getByTestId('connect-wallet-btn');
    expect(btn).toBeInTheDocument();
  });

  it('handles connect error gracefully', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    render(<WalletConnect walletId="alice" />);

    await user.type(screen.getByTestId('nwc-url-input'), 'nostr+walletconnect://test');
    await user.click(screen.getByTestId('connect-wallet-btn'));

    expect(mockConnect).toHaveBeenCalled();
  });
});
