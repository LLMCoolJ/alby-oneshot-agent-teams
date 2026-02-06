import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SimplePayment from '@/pages/1-SimplePayment';

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string; size?: number; 'data-testid'?: string }) => (
    <svg data-testid={props['data-testid'] || 'qrcode-svg'} data-value={props.value} />
  ),
}));

// Mock bolt11 decoder
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  decodeInvoice: vi.fn().mockReturnValue({
    paymentHash: 'abc123',
    satoshi: 1000,
    description: 'Test Payment',
  }),
  Invoice: vi.fn(),
  fromHexString: vi.fn(),
}));

const mockCreateInvoice = vi.fn().mockResolvedValue({
  invoice: 'lnbc1000n1test...',
  amount: 1000000,
  description: 'Test Payment',
  payment_hash: 'abc123',
});

const mockPayInvoice = vi.fn().mockResolvedValue({
  preimage: 'preimage123abc456def',
  feesPaid: 0,
});

// Mock all hooks used by SimplePayment and its child components
vi.mock('@/hooks', () => ({
  useWallet: vi.fn().mockReturnValue({
    status: 'connected',
    balance: 100000000,
    info: { alias: 'Test Wallet', color: '#ff0000', pubkey: 'abc', network: 'testnet', blockHeight: 1, methods: [] },
    error: null,
  }),
  useWalletActions: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  }),
  useNWCClient: vi.fn().mockReturnValue(null),
  useBalance: vi.fn().mockReturnValue({ sats: 100000, loading: false }),
  useInvoice: vi.fn().mockReturnValue({
    createInvoice: mockCreateInvoice,
    loading: false,
    error: null,
  }),
  usePayment: vi.fn().mockReturnValue({
    payInvoice: mockPayInvoice,
    loading: false,
    error: null,
  }),
  useBudget: vi.fn().mockReturnValue({ budget: null, loading: false, error: null }),
  useFiatRate: vi.fn().mockReturnValue({ rate: 0.00001, loading: false }),
  useTransactionLog: vi.fn().mockReturnValue({
    entries: [],
    addLog: vi.fn(),
    clearLogs: vi.fn(),
  }),
}));

// Mock WalletContext
vi.mock('@/context/WalletContext', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWalletContext: vi.fn().mockReturnValue({
    alice: { status: 'connected', balance: 100000000 },
    bob: { status: 'connected', balance: 50000000 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
    getClient: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateInvoice.mockResolvedValue({
    invoice: 'lnbc1000n1test...',
    amount: 1000000,
    description: 'Test Payment',
    payment_hash: 'abc123',
  });
  mockPayInvoice.mockResolvedValue({
    preimage: 'preimage123abc456def',
    feesPaid: 0,
  });
});

describe('Simple Payment Flow', () => {
  it('renders page title and description', () => {
    render(
      <BrowserRouter>
        <SimplePayment />
      </BrowserRouter>
    );

    expect(screen.getByText('Simple Invoice Payment')).toBeInTheDocument();
    expect(screen.getByText(/Bob creates a BOLT-11 invoice/i)).toBeInTheDocument();
  });

  it('renders both wallet cards', () => {
    render(
      <BrowserRouter>
        <SimplePayment />
      </BrowserRouter>
    );

    expect(screen.getByTestId('wallet-card-alice')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-card-bob')).toBeInTheDocument();
  });

  it('shows CreateInvoiceForm in Bob panel when connected', () => {
    render(
      <BrowserRouter>
        <SimplePayment />
      </BrowserRouter>
    );

    expect(screen.getByTestId('create-invoice-form')).toBeInTheDocument();
  });

  it('shows PayInvoiceForm in Alice panel when connected', () => {
    render(
      <BrowserRouter>
        <SimplePayment />
      </BrowserRouter>
    );

    expect(screen.getByTestId('pay-invoice-form')).toBeInTheDocument();
  });
});
