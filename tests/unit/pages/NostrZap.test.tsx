import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockNostrNote } from '@/pages/7-NostrZap/components/MockNostrNote';
import { ZapForm } from '@/pages/7-NostrZap/components/ZapForm';
import { ZapResult } from '@/pages/7-NostrZap/components/ZapResult';
import NostrZapPage from '@/pages/7-NostrZap/index';
import type { MockNostrNote as MockNoteType, PaymentResult } from '@/types';

// Store mock functions at module level so tests can control them
const mockSendZap = vi.fn().mockResolvedValue({ preimage: 'preimage123', feesPaid: 0 });
const mockUseZap = vi.fn().mockReturnValue({
  sendZap: mockSendZap,
  loading: false,
  error: null,
});

const mockUseWallet = vi.fn().mockReturnValue({
  status: 'connected',
  balance: 100_000_000,
  info: { lud16: 'bob@testnet.getalby.com' },
  error: null,
});

const mockAddLog = vi.fn();
const mockClearLogs = vi.fn();
const mockUseTransactionLog = vi.fn().mockReturnValue({
  entries: [],
  addLog: mockAddLog,
  clearLogs: mockClearLogs,
});

// Mock hooks
vi.mock('@/hooks/useZap', () => ({
  useZap: (...args: unknown[]) => mockUseZap(...args),
}));

vi.mock('@/hooks', () => ({
  useWallet: (...args: unknown[]) => mockUseWallet(...args),
  useTransactionLog: (...args: unknown[]) => mockUseTransactionLog(...args),
}));

vi.mock('@/hooks/useTransactionLog', () => ({
  useTransactionLog: (...args: unknown[]) => mockUseTransactionLog(...args),
}));

// Mock wallet components used by ScenarioPage
vi.mock('@/components/wallet/WalletCard', () => ({
  WalletCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="wallet-card">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/transaction/TransactionLog', () => ({
  TransactionLog: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="transaction-log">Logs: {entries.length}</div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockSendZap.mockResolvedValue({ preimage: 'preimage123', feesPaid: 0 });
  mockUseZap.mockReturnValue({
    sendZap: mockSendZap,
    loading: false,
    error: null,
  });

  mockUseWallet.mockReturnValue({
    status: 'connected',
    balance: 100_000_000,
    info: { lud16: 'bob@testnet.getalby.com' },
    error: null,
  });

  mockUseTransactionLog.mockReturnValue({
    entries: [],
    addLog: mockAddLog,
    clearLogs: mockClearLogs,
  });
});

// ── Test Data ──────────────────────────────────────────────────────────────

const DEMO_NOTE: MockNoteType = {
  id: 'note1abc123def456',
  pubkey: 'npub1bob123...',
  content: 'Just set up my Lightning wallet! Anyone want to test zaps?',
  created_at: Math.floor(Date.now() / 1000) - 3600,
  author: {
    name: 'Bob',
    picture: undefined,
  },
};

const DEMO_RESULT: PaymentResult = {
  preimage: 'abc123preimage456',
  feesPaid: 0,
};

// ── NostrZapPage Tests ─────────────────────────────────────────────────────

describe('NostrZapPage', () => {
  it('renders title and description', () => {
    render(<NostrZapPage />);

    expect(screen.getByText('Nostr Zap')).toBeInTheDocument();
    expect(
      screen.getByText(/Alice zaps Bob's Nostr note with a Lightning payment/)
    ).toBeInTheDocument();
  });

  it('does not show alice content when wallet disconnected', () => {
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'alice') {
        return { status: 'disconnected', balance: null, info: null, error: null };
      }
      return { status: 'connected', balance: 100_000_000, info: { lud16: 'bob@testnet.getalby.com' }, error: null };
    });

    render(<NostrZapPage />);

    // The ZapForm send button should not be rendered when alice is disconnected
    expect(screen.queryByTestId('send-zap-button')).not.toBeInTheDocument();
  });

  it('does not show bob content when wallet disconnected', () => {
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'bob') {
        return { status: 'disconnected', balance: null, info: null, error: null };
      }
      return { status: 'connected', balance: 100_000_000, info: { lud16: 'bob@testnet.getalby.com' }, error: null };
    });

    render(<NostrZapPage />);

    // Bob's note should not be rendered when bob is disconnected
    expect(screen.queryByText('Lightning Address:')).not.toBeInTheDocument();
  });

  it('renders educational content about zaps', () => {
    render(<NostrZapPage />);

    expect(screen.getByText('How Zaps Work')).toBeInTheDocument();
    expect(screen.getByText('Zap Request (kind 9734)')).toBeInTheDocument();
    expect(screen.getByText('Zap Receipt (kind 9735)')).toBeInTheDocument();
  });
});

// ── MockNostrNote Tests ────────────────────────────────────────────────────

describe('MockNostrNote', () => {
  it('renders author name', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders author avatar initial', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    // The avatar shows the first character of the author name
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders note content', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    expect(
      screen.getByText('Just set up my Lightning wallet! Anyone want to test zaps?')
    ).toBeInTheDocument();
  });

  it('renders note ID (truncated)', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    // Note ID is sliced to 20 chars + "..."
    expect(screen.getByText(/Note ID: note1abc123def456.../)).toBeInTheDocument();
  });

  it('shows Lightning Address when available', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    expect(screen.getByText('Lightning Address:')).toBeInTheDocument();
    expect(screen.getByText('bob@getalby.com')).toBeInTheDocument();
  });

  it('shows warning when no Lightning Address', () => {
    render(<MockNostrNote note={DEMO_NOTE} />);

    expect(
      screen.getByText(/No Lightning Address found/)
    ).toBeInTheDocument();
  });

  it('shows zap indicators', () => {
    render(<MockNostrNote note={DEMO_NOTE} lightningAddress="bob@getalby.com" />);

    expect(screen.getByText(/0 zaps/)).toBeInTheDocument();
    expect(screen.getByText(/0 replies/)).toBeInTheDocument();
    expect(screen.getByText(/0 reposts/)).toBeInTheDocument();
  });
});

// ── formatTimeAgo Tests (via MockNostrNote rendering) ──────────────────────

describe('formatTimeAgo', () => {
  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    const note: MockNoteType = {
      ...DEMO_NOTE,
      created_at: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago
    };

    render(<MockNostrNote note={note} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('returns minutes ago for timestamps between 60s and 1h', () => {
    const note: MockNoteType = {
      ...DEMO_NOTE,
      created_at: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
    };

    render(<MockNostrNote note={note} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('returns hours ago for timestamps between 1h and 24h', () => {
    const note: MockNoteType = {
      ...DEMO_NOTE,
      created_at: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    };

    render(<MockNostrNote note={note} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('returns days ago for timestamps over 24h', () => {
    const note: MockNoteType = {
      ...DEMO_NOTE,
      created_at: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    };

    render(<MockNostrNote note={note} />);
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });
});

// ── ZapForm Tests ──────────────────────────────────────────────────────────

describe('ZapForm', () => {
  const defaultProps = {
    note: DEMO_NOTE,
    recipientAddress: 'bob@getalby.com',
    onZapSuccess: vi.fn(),
    onLog: vi.fn(),
  };

  it('renders quick amount buttons (21, 100, 500, 1000)', () => {
    render(<ZapForm {...defaultProps} />);

    expect(screen.getByTestId('zap-amount-21')).toBeInTheDocument();
    expect(screen.getByTestId('zap-amount-100')).toBeInTheDocument();
    expect(screen.getByTestId('zap-amount-500')).toBeInTheDocument();
    expect(screen.getByTestId('zap-amount-1000')).toBeInTheDocument();
  });

  it('quick amount button highlights when selected', async () => {
    render(<ZapForm {...defaultProps} />);

    // Default is 21, so 21 button should have bg-bitcoin class
    const btn21 = screen.getByTestId('zap-amount-21');
    expect(btn21.className).toContain('bg-bitcoin');

    // Click 500
    await userEvent.click(screen.getByTestId('zap-amount-500'));
    const btn500 = screen.getByTestId('zap-amount-500');
    expect(btn500.className).toContain('bg-bitcoin');

    // 21 should no longer be highlighted
    expect(screen.getByTestId('zap-amount-21').className).not.toContain('bg-bitcoin');
  });

  it('renders custom amount input', () => {
    render(<ZapForm {...defaultProps} />);

    const input = screen.getByTestId('zap-custom-amount');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders comment input', () => {
    render(<ZapForm {...defaultProps} />);

    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();
  });

  it('renders send button with amount', () => {
    render(<ZapForm {...defaultProps} />);

    // Default amount is 21
    expect(screen.getByText(/Zap 21 sats/)).toBeInTheDocument();
  });

  it('updates button text when amount changes', async () => {
    render(<ZapForm {...defaultProps} />);

    await userEvent.click(screen.getByTestId('zap-amount-500'));
    expect(screen.getByText(/Zap 500 sats/)).toBeInTheDocument();
  });

  it('disables button when no recipientAddress', () => {
    render(<ZapForm {...defaultProps} recipientAddress={undefined} />);

    const sendButton = screen.getByTestId('send-zap-button');
    expect(sendButton).toBeDisabled();
  });

  it('shows error from hook', () => {
    mockUseZap.mockReturnValue({
      sendZap: mockSendZap,
      loading: false,
      error: 'Something went wrong',
    });

    render(<ZapForm {...defaultProps} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    mockUseZap.mockReturnValue({
      sendZap: mockSendZap,
      loading: true,
      error: null,
    });

    render(<ZapForm {...defaultProps} />);

    const sendButton = screen.getByTestId('send-zap-button');
    expect(sendButton).toBeDisabled();
  });

  it('renders info box about real Nostr clients', () => {
    render(<ZapForm {...defaultProps} />);

    expect(screen.getByText(/In a real Nostr client/)).toBeInTheDocument();
  });
});

// ── ZapResult Tests ────────────────────────────────────────────────────────

describe('ZapResult', () => {
  const defaultProps = {
    result: DEMO_RESULT,
    onReset: vi.fn(),
  };

  it('renders success message', () => {
    render(<ZapResult {...defaultProps} />);

    expect(screen.getByText('Zap Sent!')).toBeInTheDocument();
    expect(screen.getByText(/Your zap has been sent successfully/)).toBeInTheDocument();
  });

  it('renders preimage', () => {
    render(<ZapResult {...defaultProps} />);

    expect(screen.getByText('abc123preimage456')).toBeInTheDocument();
    expect(screen.getByText(/Preimage \(proof\)/)).toBeInTheDocument();
  });

  it('renders "Send Another Zap" button', () => {
    render(<ZapResult {...defaultProps} />);

    expect(screen.getByText('Send Another Zap')).toBeInTheDocument();
  });

  it('calls onReset when "Send Another Zap" is clicked', async () => {
    const onReset = vi.fn();
    render(<ZapResult result={DEMO_RESULT} onReset={onReset} />);

    await userEvent.click(screen.getByTestId('send-another-zap-button'));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders copy button for preimage', () => {
    render(<ZapResult {...defaultProps} />);

    // CopyButton renders with data-testid="copy-button"
    const copyButtons = screen.getAllByTestId('copy-button');
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });
});
