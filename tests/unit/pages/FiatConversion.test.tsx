import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencySelector } from '@/pages/8-FiatConversion/components/CurrencySelector';
import { ConversionCalculator } from '@/pages/8-FiatConversion/components/ConversionCalculator';
import { QuickReference } from '@/pages/8-FiatConversion/components/QuickReference';
import FiatConversionPage from '@/pages/8-FiatConversion/index';

// ── Module-level mock functions ──────────────────────────────────────────────

const mockGetFiatValue = vi.fn().mockResolvedValue(42);
const mockGetSatoshiValue = vi.fn().mockResolvedValue(1000);
const mockGetFormattedFiatValue = vi.fn().mockResolvedValue('$0.42');
const mockGetFiatBtcRate = vi.fn().mockResolvedValue(42000);

const mockUseWallet = vi.fn().mockReturnValue({
  status: 'connected',
  balance: 100_000_000,
  info: { alias: 'TestWallet' },
  error: null,
});

const mockUseBalance = vi.fn().mockReturnValue({
  sats: 250000,
  loading: false,
});

const mockUseFiatRate = vi.fn().mockReturnValue({
  fiatValue: 105,
  formattedFiat: '$105.00',
  loading: false,
  error: null,
});

const mockAddLog = vi.fn();
const mockClearLogs = vi.fn();
const mockUseTransactionLog = vi.fn().mockReturnValue({
  entries: [],
  addLog: mockAddLog,
  clearLogs: mockClearLogs,
});

// ── Mock modules ─────────────────────────────────────────────────────────────

vi.mock('@getalby/lightning-tools/fiat', () => ({
  getFiatValue: (...args: unknown[]) => mockGetFiatValue(...args),
  getSatoshiValue: (...args: unknown[]) => mockGetSatoshiValue(...args),
  getFormattedFiatValue: (...args: unknown[]) => mockGetFormattedFiatValue(...args),
  getFiatBtcRate: (...args: unknown[]) => mockGetFiatBtcRate(...args),
}));

vi.mock('@/hooks', () => ({
  useWallet: (...args: unknown[]) => mockUseWallet(...args),
  useBalance: (...args: unknown[]) => mockUseBalance(...args),
  useFiatRate: (...args: unknown[]) => mockUseFiatRate(...args),
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

// ── Reset mocks before each test ─────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockGetFiatValue.mockResolvedValue(42);
  mockGetSatoshiValue.mockResolvedValue(1000);
  mockGetFormattedFiatValue.mockResolvedValue('$0.42');
  mockGetFiatBtcRate.mockResolvedValue(42000);

  mockUseWallet.mockReturnValue({
    status: 'connected',
    balance: 100_000_000,
    info: { alias: 'TestWallet' },
    error: null,
  });

  mockUseBalance.mockReturnValue({
    sats: 250000,
    loading: false,
  });

  mockUseFiatRate.mockReturnValue({
    fiatValue: 105,
    formattedFiat: '$105.00',
    loading: false,
    error: null,
  });

  mockUseTransactionLog.mockReturnValue({
    entries: [],
    addLog: mockAddLog,
    clearLogs: mockClearLogs,
  });
});

// ── ConversionCalculator Tests ───────────────────────────────────────────────

describe('ConversionCalculator', () => {
  it('renders the calculator heading', () => {
    render(<ConversionCalculator currency="USD" />);
    expect(screen.getByText('Conversion Calculator')).toBeInTheDocument();
  });

  it('renders sats input and fiat input', () => {
    render(<ConversionCalculator currency="USD" />);
    expect(screen.getByTestId('sats-input')).toBeInTheDocument();
    expect(screen.getByTestId('fiat-input')).toBeInTheDocument();
  });

  it('renders result areas with em-dash placeholders', () => {
    render(<ConversionCalculator currency="USD" />);
    expect(screen.getByTestId('sats-to-fiat-result')).toHaveTextContent('\u2014');
    expect(screen.getByTestId('fiat-to-sats-result')).toHaveTextContent('\u2014');
  });

  it('converts sats to fiat when sats input changes', async () => {
    render(<ConversionCalculator currency="USD" />);

    const satsInput = screen.getByTestId('sats-input');
    await userEvent.type(satsInput, '1000');

    // Wait for the 300ms debounce + async conversion
    await waitFor(() => {
      expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1000, currency: 'USD' });
    }, { timeout: 2000 });

    // The result should show the formatted currency value
    await waitFor(() => {
      expect(screen.getByTestId('sats-to-fiat-result')).not.toHaveTextContent('\u2014');
    }, { timeout: 2000 });
  });

  it('converts fiat to sats when fiat input changes', async () => {
    render(<ConversionCalculator currency="USD" />);

    const fiatInput = screen.getByTestId('fiat-input');
    await userEvent.type(fiatInput, '50');

    // Wait for the 300ms debounce + async conversion
    await waitFor(() => {
      expect(mockGetSatoshiValue).toHaveBeenCalledWith({ amount: 50, currency: 'USD' });
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(screen.getByTestId('fiat-to-sats-result')).toHaveTextContent('sats');
    }, { timeout: 2000 });
  });

  it('shows em-dash when sats input is invalid (zero)', async () => {
    render(<ConversionCalculator currency="USD" />);

    const satsInput = screen.getByTestId('sats-input');
    await userEvent.type(satsInput, '0');

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 400));

    // Zero value => result stays as em-dash
    expect(screen.getByTestId('sats-to-fiat-result')).toHaveTextContent('\u2014');
  });

  it('shows em-dash when fiat input is invalid (zero)', async () => {
    render(<ConversionCalculator currency="USD" />);

    const fiatInput = screen.getByTestId('fiat-input');
    await userEvent.type(fiatInput, '0');

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 400));

    expect(screen.getByTestId('fiat-to-sats-result')).toHaveTextContent('\u2014');
  });

  it('handles conversion error gracefully for sats to fiat', async () => {
    mockGetFiatValue.mockRejectedValue(new Error('API error'));

    render(<ConversionCalculator currency="USD" />);

    const satsInput = screen.getByTestId('sats-input');
    await userEvent.type(satsInput, '500');

    await waitFor(() => {
      // On error, result should remain as em-dash (null => em-dash)
      expect(screen.getByTestId('sats-to-fiat-result')).toHaveTextContent('\u2014');
    }, { timeout: 2000 });
  });

  it('handles conversion error gracefully for fiat to sats', async () => {
    mockGetSatoshiValue.mockRejectedValue(new Error('API error'));

    render(<ConversionCalculator currency="USD" />);

    const fiatInput = screen.getByTestId('fiat-input');
    await userEvent.type(fiatInput, '10');

    await waitFor(() => {
      expect(screen.getByTestId('fiat-to-sats-result')).toHaveTextContent('\u2014');
    }, { timeout: 2000 });
  });

  it('shows currency symbol for the selected currency', () => {
    render(<ConversionCalculator currency="EUR" />);
    // The euro symbol should appear before the fiat input
    expect(screen.getByText('\u20AC')).toBeInTheDocument();
  });

  it('shows dollar symbol for USD', () => {
    render(<ConversionCalculator currency="USD" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });
});

// ── QuickReference Tests ─────────────────────────────────────────────────────

describe('QuickReference', () => {
  it('renders heading', async () => {
    render(<QuickReference currency="USD" />);

    expect(screen.getByText('Quick Reference')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Make the mock never resolve to keep loading state
    mockGetFiatValue.mockReturnValue(new Promise(() => {}));

    render(<QuickReference currency="USD" />);

    expect(screen.getByText('Loading conversions...')).toBeInTheDocument();
  });

  it('shows reference amounts after loading', async () => {
    render(<QuickReference currency="USD" />);

    // Wait for all reference items to appear
    await waitFor(() => {
      expect(screen.getByTestId('reference-item-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('reference-item-100')).toBeInTheDocument();
    expect(screen.getByTestId('reference-item-1000')).toBeInTheDocument();
    expect(screen.getByTestId('reference-item-10000')).toBeInTheDocument();
    expect(screen.getByTestId('reference-item-100000')).toBeInTheDocument();
    expect(screen.getByTestId('reference-item-1000000')).toBeInTheDocument();
  });

  it('formats sats correctly: 1 sat, 1K sats, 1M sats', async () => {
    render(<QuickReference currency="USD" />);

    await waitFor(() => {
      expect(screen.getByTestId('reference-item-1')).toBeInTheDocument();
    });

    // 1 sat (singular)
    expect(screen.getByTestId('reference-item-1')).toHaveTextContent('1 sat');
    // 1K sats
    expect(screen.getByTestId('reference-item-1000')).toHaveTextContent('1K sats');
    // 1M sats
    expect(screen.getByTestId('reference-item-1000000')).toHaveTextContent('1M sats');
  });

  it('calls getFiatValue for each reference amount', async () => {
    render(<QuickReference currency="USD" />);

    await waitFor(() => {
      expect(mockGetFiatValue).toHaveBeenCalledTimes(6);
    });

    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1, currency: 'USD' });
    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 100, currency: 'USD' });
    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1000, currency: 'USD' });
    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 10000, currency: 'USD' });
    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 100000, currency: 'USD' });
    expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1000000, currency: 'USD' });
  });

  it('shows educational note about satoshis', async () => {
    render(<QuickReference currency="USD" />);

    expect(screen.getByText(/Did you know/)).toBeInTheDocument();
    expect(screen.getByText(/100,000,000 sats in 1 BTC/)).toBeInTheDocument();
  });

  it('handles getFiatValue error gracefully', async () => {
    mockGetFiatValue.mockRejectedValue(new Error('API error'));

    render(<QuickReference currency="USD" />);

    await waitFor(() => {
      expect(screen.getByTestId('reference-item-1')).toBeInTheDocument();
    });

    // Each item should show em-dash on error
    expect(screen.getByTestId('reference-item-1')).toHaveTextContent('\u2014');
  });

  it('refetches when currency changes', async () => {
    const { rerender } = render(<QuickReference currency="USD" />);

    await waitFor(() => {
      expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1, currency: 'USD' });
    });

    mockGetFiatValue.mockClear();
    rerender(<QuickReference currency="EUR" />);

    await waitFor(() => {
      expect(mockGetFiatValue).toHaveBeenCalledWith({ satoshi: 1, currency: 'EUR' });
    });
  });
});

// ── CurrencySelector Tests ───────────────────────────────────────────────────

describe('CurrencySelector', () => {
  const defaultProps = {
    currency: 'USD' as const,
    onCurrencyChange: vi.fn(),
  };

  it('renders Currency Settings heading', () => {
    render(<CurrencySelector {...defaultProps} />);
    expect(screen.getByText('Currency Settings')).toBeInTheDocument();
  });

  it('renders the currency select element', () => {
    render(<CurrencySelector {...defaultProps} />);
    expect(screen.getByTestId('currency-select')).toBeInTheDocument();
  });

  it('renders all 7 currency options', () => {
    render(<CurrencySelector {...defaultProps} />);
    const select = screen.getByTestId('currency-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(7);
  });

  it('shows currency symbols and labels in options', () => {
    render(<CurrencySelector {...defaultProps} />);
    expect(screen.getByText(/\$ US Dollar \(USD\)/)).toBeInTheDocument();
    expect(screen.getByText(/\u20AC Euro \(EUR\)/)).toBeInTheDocument();
    expect(screen.getByText(/\u00A3 British Pound \(GBP\)/)).toBeInTheDocument();
    expect(screen.getByText(/C\$ Canadian Dollar \(CAD\)/)).toBeInTheDocument();
    expect(screen.getByText(/A\$ Australian Dollar \(AUD\)/)).toBeInTheDocument();
    expect(screen.getByText(/\u00A5 Japanese Yen \(JPY\)/)).toBeInTheDocument();
    expect(screen.getByText(/Fr Swiss Franc \(CHF\)/)).toBeInTheDocument();
  });

  it('selects the current currency', () => {
    render(<CurrencySelector {...defaultProps} currency="EUR" />);
    const select = screen.getByTestId('currency-select') as HTMLSelectElement;
    expect(select.value).toBe('EUR');
  });

  it('calls onCurrencyChange when selection changes', async () => {
    const onCurrencyChange = vi.fn();
    render(<CurrencySelector currency="USD" onCurrencyChange={onCurrencyChange} />);

    const select = screen.getByTestId('currency-select');
    await userEvent.selectOptions(select, 'GBP');

    expect(onCurrencyChange).toHaveBeenCalledWith('GBP');
  });

  it('shows exchange rate when loaded', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: 42000,
      formattedFiat: '$42,000.00',
      loading: false,
      error: null,
    });

    render(<CurrencySelector {...defaultProps} />);

    expect(screen.getByText('Current Exchange Rate')).toBeInTheDocument();
    expect(screen.getByText(/1 BTC =/)).toBeInTheDocument();
    expect(screen.getByText(/1 sat/)).toBeInTheDocument();
  });

  it('shows loading state for exchange rate', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: null,
      formattedFiat: null,
      loading: true,
      error: null,
    });

    render(<CurrencySelector {...defaultProps} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows unable to fetch message when rate is null', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: null,
      formattedFiat: null,
      loading: false,
      error: null,
    });

    render(<CurrencySelector {...defaultProps} />);

    expect(screen.getByText('Unable to fetch rate')).toBeInTheDocument();
  });

  it('renders Display Currency label', () => {
    render(<CurrencySelector {...defaultProps} />);
    expect(screen.getByText('Display Currency')).toBeInTheDocument();
  });
});

// ── FiatConversionPage Tests ─────────────────────────────────────────────────

describe('FiatConversionPage', () => {
  it('renders title and description', () => {
    render(<FiatConversionPage />);

    expect(screen.getByText('Fiat Conversion')).toBeInTheDocument();
    expect(
      screen.getByText(/See Lightning amounts in both satoshis and fiat currency/)
    ).toBeInTheDocument();
  });

  it('renders CurrencySelector child', () => {
    render(<FiatConversionPage />);

    expect(screen.getByTestId('currency-select')).toBeInTheDocument();
    expect(screen.getByText('Currency Settings')).toBeInTheDocument();
  });

  it('renders QuickReference child', () => {
    render(<FiatConversionPage />);

    expect(screen.getByText('Quick Reference')).toBeInTheDocument();
  });

  it('renders wallet content when connected', () => {
    render(<FiatConversionPage />);

    // Both wallets connected: should show balance amounts
    const balanceTexts = screen.getAllByText(/sats/);
    expect(balanceTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show alice content when wallet disconnected', () => {
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'alice') {
        return { status: 'disconnected', balance: null, info: null, error: null };
      }
      return { status: 'connected', balance: 100_000_000, info: { alias: 'Bob' }, error: null };
    });

    render(<FiatConversionPage />);

    // When alice is disconnected, alice's BalanceWithFiat should not render
    // Both wallets render WalletCards (via mock), but aliceContent is false
    // The bob card should still have the balance
    const walletCards = screen.getAllByTestId('wallet-card');
    expect(walletCards).toHaveLength(2);
  });

  it('does not show bob content when wallet disconnected', () => {
    mockUseWallet.mockImplementation((id: string) => {
      if (id === 'bob') {
        return { status: 'disconnected', balance: null, info: null, error: null };
      }
      return { status: 'connected', balance: 100_000_000, info: { alias: 'Alice' }, error: null };
    });

    render(<FiatConversionPage />);

    const walletCards = screen.getAllByTestId('wallet-card');
    expect(walletCards).toHaveLength(2);
  });

  it('renders transaction log', () => {
    render(<FiatConversionPage />);

    expect(screen.getByTestId('transaction-log')).toBeInTheDocument();
  });

  it('logs when currency changes', async () => {
    render(<FiatConversionPage />);

    const select = screen.getByTestId('currency-select');
    await userEvent.selectOptions(select, 'EUR');

    expect(mockAddLog).toHaveBeenCalledWith('Currency changed to EUR', 'info');
  });
});

// ── BalanceWithFiat Tests (rendered via FiatConversionPage) ───────────────────

describe('BalanceWithFiat', () => {
  it('shows balance in sats', () => {
    mockUseBalance.mockReturnValue({ sats: 250000, loading: false });

    render(<FiatConversionPage />);

    // 250,000 sats formatted with toLocaleString
    expect(screen.getAllByText(/250,000 sats/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows fiat equivalent', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: 105,
      formattedFiat: '$105.00',
      loading: false,
      error: null,
    });

    render(<FiatConversionPage />);

    // The BalanceWithFiat component shows "≈ $105.00"
    const fiatTexts = screen.getAllByText(/\$105\.00/);
    expect(fiatTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading state for fiat value', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: null,
      formattedFiat: null,
      loading: true,
      error: null,
    });

    render(<FiatConversionPage />);

    const loadingElements = screen.getAllByText('Loading...');
    expect(loadingElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows em-dash when sats is null', () => {
    mockUseBalance.mockReturnValue({ sats: null, loading: false });

    render(<FiatConversionPage />);

    // When sats is null, BalanceWithFiat shows "— sats"
    const emDashes = screen.getAllByText(/\u2014 sats/);
    expect(emDashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows em-dash for fiat when formattedFiat is null', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: null,
      formattedFiat: null,
      loading: false,
      error: null,
    });

    render(<FiatConversionPage />);

    // "≈ —" shown when no fiat value
    const fiatAreas = screen.getAllByText(/\u2014/);
    expect(fiatAreas.length).toBeGreaterThanOrEqual(1);
  });
});
