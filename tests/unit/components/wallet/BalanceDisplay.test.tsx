import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay';

const mockUseFiatRate = vi.fn().mockReturnValue({
  fiatValue: 42,
  formattedFiat: '$0.42',
  loading: false,
  error: null,
});

vi.mock('@/hooks', () => ({
  useFiatRate: (...args: any[]) => mockUseFiatRate(...args),
}));

describe('BalanceDisplay', () => {
  beforeEach(() => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: 42,
      formattedFiat: '$0.42',
      loading: false,
      error: null,
    });
  });

  it('renders sats balance', () => {
    render(<BalanceDisplay sats={100000} />);
    expect(screen.getByTestId('balance-sats')).toBeInTheDocument();
    expect(screen.getByText('100,000')).toBeInTheDocument();
    expect(screen.getByText('sats')).toBeInTheDocument();
  });

  it('renders fiat value when showFiat is true', () => {
    render(<BalanceDisplay sats={100000} showFiat={true} />);
    expect(screen.getByTestId('balance-fiat')).toBeInTheDocument();
    expect(screen.getByText('$0.42')).toBeInTheDocument();
  });

  it('does not render fiat when showFiat is false', () => {
    render(<BalanceDisplay sats={100000} showFiat={false} />);
    expect(screen.queryByTestId('balance-fiat')).not.toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<BalanceDisplay sats={null} loading={true} />);
    expect(screen.getByText('Loading balance...')).toBeInTheDocument();
    expect(screen.queryByTestId('balance-sats')).not.toBeInTheDocument();
  });

  it('shows placeholder when sats is null', () => {
    render(<BalanceDisplay sats={null} />);
    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.queryByTestId('balance-sats')).not.toBeInTheDocument();
  });

  it('formats sats with locale formatting', () => {
    render(<BalanceDisplay sats={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders zero balance', () => {
    render(<BalanceDisplay sats={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('does not show fiat when formattedFiat is null', () => {
    mockUseFiatRate.mockReturnValue({
      fiatValue: null,
      formattedFiat: null,
      loading: false,
      error: null,
    });

    render(<BalanceDisplay sats={100} showFiat={true} />);
    expect(screen.queryByTestId('balance-fiat')).not.toBeInTheDocument();
  });

  it('defaults showFiat to true', () => {
    render(<BalanceDisplay sats={100000} />);
    expect(screen.getByTestId('balance-fiat')).toBeInTheDocument();
  });

  it('passes currency to useFiatRate', () => {
    render(<BalanceDisplay sats={100} currency="EUR" />);
    expect(mockUseFiatRate).toHaveBeenCalledWith(100, 'EUR');
  });

  it('passes 0 to useFiatRate when sats is null', () => {
    render(<BalanceDisplay sats={null} />);
    expect(mockUseFiatRate).toHaveBeenCalledWith(0, 'USD');
  });
});
