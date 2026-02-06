import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightningAddressDisplay } from '@/pages/2-LightningAddress/components/LightningAddressDisplay';
import { PayToAddressForm } from '@/pages/2-LightningAddress/components/PayToAddressForm';

// Store mock functions at module level so tests can control them
const mockUseWallet = vi.fn().mockReturnValue({
  status: 'connected',
  info: { lud16: 'bob@testnet.getalby.com' },
});

const mockPayToAddress = vi.fn().mockResolvedValue({ preimage: 'abc123def456', feesPaid: 0 });
const mockFetchAddressInfo = vi.fn().mockResolvedValue({
  min: 1,
  max: 1000000,
  description: 'Test',
  commentAllowed: 255,
  fixed: false,
});
const mockReset = vi.fn();

const mockUseLightningAddressPayment = vi.fn().mockReturnValue({
  payToAddress: mockPayToAddress,
  fetchAddressInfo: mockFetchAddressInfo,
  loading: false,
  error: null,
  addressInfo: null,
  result: null,
  reset: mockReset,
});

// Mock hooks
vi.mock('@/hooks', () => ({
  useWallet: (...args: unknown[]) => mockUseWallet(...args),
  useTransactionLog: vi.fn().mockReturnValue({
    entries: [],
    addLog: vi.fn(),
    clearLogs: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLightningAddressPayment', () => ({
  useLightningAddressPayment: (...args: unknown[]) => mockUseLightningAddressPayment(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockUseWallet.mockReturnValue({
    status: 'connected',
    info: { lud16: 'bob@testnet.getalby.com' },
  });

  mockPayToAddress.mockResolvedValue({ preimage: 'abc123def456', feesPaid: 0 });
  mockFetchAddressInfo.mockResolvedValue({
    min: 1,
    max: 1000000,
    description: 'Test',
    commentAllowed: 255,
    fixed: false,
  });

  mockUseLightningAddressPayment.mockReturnValue({
    payToAddress: mockPayToAddress,
    fetchAddressInfo: mockFetchAddressInfo,
    loading: false,
    error: null,
    addressInfo: null,
    result: null,
    reset: mockReset,
  });
});

describe('LightningAddressDisplay', () => {
  it('displays the Lightning Address from wallet info', () => {
    render(<LightningAddressDisplay />);
    expect(screen.getByText('bob@testnet.getalby.com')).toBeInTheDocument();
  });

  it('shows warning when no Lightning Address available', () => {
    mockUseWallet.mockReturnValue({
      status: 'connected',
      info: { lud16: undefined },
    });

    render(<LightningAddressDisplay />);
    expect(screen.getByText(/no lightning address found/i)).toBeInTheDocument();
  });

  it('includes copy button', () => {
    render(<LightningAddressDisplay />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('PayToAddressForm', () => {
  it('validates Lightning Address format', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'not-an-address');
    expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
  });

  it('fetches address info on blur', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    const input = screen.getByLabelText(/lightning address/i);
    await userEvent.type(input, 'bob@getalby.com');
    await userEvent.tab(); // blur

    expect(mockFetchAddressInfo).toHaveBeenCalledWith('bob@getalby.com');
  });

  it('shows min/max when address info is available', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: 255 },
      loading: false,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText('1 sats')).toBeInTheDocument();
    expect(screen.getByText('1,000,000 sats')).toBeInTheDocument();
  });

  it('disables comment field when not supported', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: undefined },
      loading: false,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByLabelText(/comment/i)).toBeDisabled();
  });

  it('shows comment hint with character limit when supported', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: 255 },
      loading: false,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText(/up to 255 characters/i)).toBeInTheDocument();
  });

  it('submits payment successfully', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'bob@getalby.com');
    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /pay lightning address/i }));

    await waitFor(() => {
      expect(mockPayToAddress).toHaveBeenCalledWith({
        address: 'bob@getalby.com',
        amount: 1000,
        comment: undefined,
      });
    });
  });

  it('submits payment with comment', async () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: { min: 1, max: 1000000, description: 'Test', commentAllowed: 255 },
      loading: false,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'bob@getalby.com');
    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '500');
    await userEvent.type(screen.getByLabelText(/comment/i), 'Thanks!');
    await userEvent.click(screen.getByRole('button', { name: /pay lightning address/i }));

    await waitFor(() => {
      expect(mockPayToAddress).toHaveBeenCalledWith({
        address: 'bob@getalby.com',
        amount: 500,
        comment: 'Thanks!',
      });
    });
  });

  it('logs success message after payment', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'bob@getalby.com');
    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /pay lightning address/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        expect.stringContaining('Payment successful!'),
        'success'
      );
    });
  });

  it('logs error when payment fails', async () => {
    mockPayToAddress.mockRejectedValueOnce(new Error('Insufficient balance'));
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'bob@getalby.com');
    await userEvent.clear(screen.getByLabelText(/amount/i));
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /pay lightning address/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Payment failed: Insufficient balance',
        'error'
      );
    });
  });

  it('logs error for invalid address on submit', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    await userEvent.type(screen.getByLabelText(/lightning address/i), 'not-an-address');
    await userEvent.click(screen.getByRole('button', { name: /pay lightning address/i }));

    expect(onLog).toHaveBeenCalledWith('Invalid Lightning Address format', 'error');
    expect(mockPayToAddress).not.toHaveBeenCalled();
  });

  it('shows success view when result exists', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: null,
      loading: false,
      error: null,
      result: { preimage: 'abc123def456', feesPaid: 0 },
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /make another payment/i })).toBeInTheDocument();
  });

  it('calls reset when "Make Another Payment" is clicked', async () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: null,
      loading: false,
      error: null,
      result: { preimage: 'abc123def456', feesPaid: 0 },
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /make another payment/i }));
    expect(mockReset).toHaveBeenCalled();
  });

  it('shows error from hook', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: null,
      loading: false,
      error: 'Something went wrong',
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: null,
      loading: true,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByRole('button', { name: /pay lightning address/i })).toBeDisabled();
  });

  it('disables submit button when address is empty', () => {
    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByRole('button', { name: /pay lightning address/i })).toBeDisabled();
  });

  it('shows address description in info panel', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      addressInfo: { min: 1, max: 1000000, description: 'Pay me here', commentAllowed: 255 },
      loading: false,
      error: null,
      result: null,
      payToAddress: mockPayToAddress,
      fetchAddressInfo: mockFetchAddressInfo,
      reset: mockReset,
    });

    render(<PayToAddressForm onLog={() => {}} />);

    expect(screen.getByText('Pay me here')).toBeInTheDocument();
  });

  it('logs fetch info message on blur', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    const input = screen.getByLabelText(/lightning address/i);
    await userEvent.type(input, 'bob@getalby.com');
    await userEvent.tab();

    expect(onLog).toHaveBeenCalledWith(
      'Fetching LNURL data for bob@getalby.com...',
      'info'
    );
  });

  it('logs success after fetching address info', async () => {
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    const input = screen.getByLabelText(/lightning address/i);
    await userEvent.type(input, 'bob@getalby.com');
    await userEvent.tab();

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('LNURL data fetched successfully', 'success');
    });
  });

  it('logs error when fetch address info fails', async () => {
    mockFetchAddressInfo.mockRejectedValueOnce(new Error('Network error'));
    const onLog = vi.fn();
    render(<PayToAddressForm onLog={onLog} />);

    const input = screen.getByLabelText(/lightning address/i);
    await userEvent.type(input, 'bob@getalby.com');
    await userEvent.tab();

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith(
        'Failed to fetch address info: Network error',
        'error'
      );
    });
  });
});
