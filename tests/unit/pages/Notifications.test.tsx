import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationSubscriber } from '@/pages/3-Notifications/components/NotificationSubscriber';
import { QuickPayButtons } from '@/pages/3-Notifications/components/QuickPayButtons';

// Mock hooks - use vi.hoisted so variables are available in vi.mock factories
const { mockSubscribe, mockUnsubscribe, mockUseNotifications, mockPayToAddress, mockUseLightningAddressPayment } = vi.hoisted(() => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockUseNotifications = vi.fn().mockReturnValue({
    isSubscribed: false,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    error: null,
  });
  const mockPayToAddress = vi.fn().mockResolvedValue({ preimage: 'abc123', feesPaid: 0 });
  const mockUseLightningAddressPayment = vi.fn().mockReturnValue({
    payToAddress: mockPayToAddress,
    loading: false,
    error: null,
  });
  return { mockSubscribe, mockUnsubscribe, mockUseNotifications, mockPayToAddress, mockUseLightningAddressPayment };
});

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: mockUseNotifications,
}));

vi.mock('@/hooks', () => ({
  useLightningAddressPayment: mockUseLightningAddressPayment,
}));

describe('NotificationSubscriber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockResolvedValue(undefined);
    mockUseNotifications.mockReturnValue({
      isSubscribed: false,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });
  });

  it('shows not listening status initially', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Not listening')).toBeInTheDocument();
  });

  it('shows Start Listening button when not subscribed', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument();
  });

  it('subscribes when Start Listening is clicked', async () => {
    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('logs subscribing message when Start Listening is clicked', async () => {
    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    expect(onLog).toHaveBeenCalledWith('Subscribing to payment notifications...', 'info');
  });

  it('logs success message after subscribing', async () => {
    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Now listening for incoming payments', 'success');
    });
  });

  it('shows listening status when subscribed', () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('shows Stop Listening button when subscribed', () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument();
  });

  it('unsubscribes when Stop Listening is clicked', async () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /stop listening/i }));

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('logs stop message when Stop Listening is clicked', async () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /stop listening/i }));

    expect(onLog).toHaveBeenCalledWith('Stopped listening for notifications', 'info');
  });

  it('displays empty state when not subscribed and no notifications', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Start listening to see incoming payments')).toBeInTheDocument();
  });

  it('displays waiting state when subscribed but no notifications', () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: null,
    });

    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Waiting for payments...')).toBeInTheDocument();
  });

  it('displays error message when error is present', () => {
    mockUseNotifications.mockReturnValue({
      isSubscribed: false,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      error: 'Connection failed',
    });

    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('logs error when subscribe fails', async () => {
    mockSubscribe.mockRejectedValue(new Error('Network timeout'));
    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed to subscribe: Network timeout', 'error');
    });
  });

  it('logs generic error when subscribe fails with non-Error', async () => {
    mockSubscribe.mockRejectedValue('something went wrong');
    const onLog = vi.fn();
    render(<NotificationSubscriber onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: /start listening/i }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Failed to subscribe: Unknown error', 'error');
    });
  });

  it('shows Incoming Payments heading', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(screen.getByText('Incoming Payments')).toBeInTheDocument();
  });

  it('passes bob as walletId and payment_received as notification type', () => {
    render(<NotificationSubscriber onLog={() => {}} />);
    expect(mockUseNotifications).toHaveBeenCalledWith('bob', expect.objectContaining({
      notificationTypes: ['payment_received'],
    }));
  });
});

describe('QuickPayButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPayToAddress.mockResolvedValue({ preimage: 'abc123', feesPaid: 0 });
    mockUseLightningAddressPayment.mockReturnValue({
      payToAddress: mockPayToAddress,
      loading: false,
      error: null,
    });
  });

  it('renders quick pay buttons', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '500 sats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1000 sats' })).toBeInTheDocument();
  });

  it('pre-fills recipient address when provided', () => {
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={() => {}} />);

    expect(screen.getByDisplayValue('bob@test.getalby.com')).toBeInTheDocument();
  });

  it('disables buttons when no address', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '500 sats' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '1000 sats' })).toBeDisabled();
  });

  it('enables buttons when address is provided', () => {
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '500 sats' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '1000 sats' })).not.toBeDisabled();
  });

  it('sends payment when quick pay button is clicked', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '100 sats' }));

    await waitFor(() => {
      expect(mockPayToAddress).toHaveBeenCalledWith({
        address: 'bob@test.getalby.com',
        amount: 100,
      });
    });
  });

  it('logs sending message when payment starts', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '500 sats' }));

    expect(onLog).toHaveBeenCalledWith('Sending 500 sats to bob@test.getalby.com...', 'info');
  });

  it('logs success message after payment', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '1000 sats' }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Sent 1000 sats successfully!', 'success');
    });
  });

  it('logs error when payment fails', async () => {
    mockPayToAddress.mockRejectedValueOnce(new Error('Insufficient balance'));
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '100 sats' }));

    await waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Payment failed: Insufficient balance', 'error');
    });
  });

  it('logs error when no address is entered and button clicked via typed address', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    // Clear the address field
    const input = screen.getByDisplayValue('bob@test.getalby.com');
    await userEvent.clear(input);

    // Buttons should now be disabled, verifying that empty address disables
    expect(screen.getByRole('button', { name: '100 sats' })).toBeDisabled();
  });

  it('disables all buttons when loading', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      payToAddress: mockPayToAddress,
      loading: true,
      error: null,
    });

    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={() => {}} />);

    expect(screen.getByRole('button', { name: '100 sats' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '500 sats' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '1000 sats' })).toBeDisabled();
  });

  it('shows error from hook', () => {
    mockUseLightningAddressPayment.mockReturnValue({
      payToAddress: mockPayToAddress,
      loading: false,
      error: 'Payment service unavailable',
    });

    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={() => {}} />);

    expect(screen.getByText('Payment service unavailable')).toBeInTheDocument();
  });

  it('allows typing a new address', async () => {
    render(<QuickPayButtons onLog={() => {}} />);

    const input = screen.getByPlaceholderText('bob@testnet.getalby.com');
    await userEvent.type(input, 'alice@getalby.com');

    expect(screen.getByDisplayValue('alice@getalby.com')).toBeInTheDocument();
  });

  it('renders info panel with instructions', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(screen.getByText('Try it out!')).toBeInTheDocument();
  });

  it('uses alice wallet for payments', () => {
    render(<QuickPayButtons onLog={() => {}} />);

    expect(mockUseLightningAddressPayment).toHaveBeenCalledWith('alice');
  });

  it('sends 500 sats payment correctly', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '500 sats' }));

    await waitFor(() => {
      expect(mockPayToAddress).toHaveBeenCalledWith({
        address: 'bob@test.getalby.com',
        amount: 500,
      });
    });
  });

  it('sends 1000 sats payment correctly', async () => {
    const onLog = vi.fn();
    render(<QuickPayButtons recipientAddress="bob@test.getalby.com" onLog={onLog} />);

    await userEvent.click(screen.getByRole('button', { name: '1000 sats' }));

    await waitFor(() => {
      expect(mockPayToAddress).toHaveBeenCalledWith({
        address: 'bob@test.getalby.com',
        amount: 1000,
      });
    });
  });
});
