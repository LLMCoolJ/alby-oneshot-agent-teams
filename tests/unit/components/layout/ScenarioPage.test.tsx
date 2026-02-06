import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ScenarioPage } from '@/components/layout/ScenarioPage';
import type { LogEntry } from '@/types';

// Mock WalletCard to avoid deep wallet context dependency
vi.mock('@/components/wallet/WalletCard', () => ({
  WalletCard: ({ walletId, title, children }: { walletId: string; title?: string; children?: React.ReactNode }) => (
    <div data-testid={`wallet-card-${walletId}`}>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

// Mock TransactionLog to isolate ScenarioPage tests
vi.mock('@/components/transaction/TransactionLog', () => ({
  TransactionLog: ({ entries }: { entries: LogEntry[] }) => (
    <div data-testid="transaction-log">
      <span>{entries.length} entries</span>
    </div>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const defaultProps = {
  title: 'Simple Payment',
  description: 'Send sats from Alice to Bob',
  logs: [] as LogEntry[],
};

describe('ScenarioPage', () => {
  it('renders the title', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    expect(screen.getByText('Simple Payment')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    expect(screen.getByText('Send sats from Alice to Bob')).toBeInTheDocument();
  });

  it('renders both wallet cards', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    expect(screen.getByTestId('wallet-card-alice')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-card-bob')).toBeInTheDocument();
  });

  it('passes title to Alice wallet card', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    const aliceCard = screen.getByTestId('wallet-card-alice');
    expect(aliceCard).toHaveTextContent("Alice's Wallet");
  });

  it('passes title to Bob wallet card', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    const bobCard = screen.getByTestId('wallet-card-bob');
    expect(bobCard).toHaveTextContent("Bob's Wallet");
  });

  it('renders alice content inside Alice card', () => {
    render(
      <ScenarioPage
        {...defaultProps}
        aliceContent={<div data-testid="alice-action">Send Button</div>}
      />,
      { wrapper },
    );
    const aliceCard = screen.getByTestId('wallet-card-alice');
    expect(aliceCard).toContainElement(screen.getByTestId('alice-action'));
  });

  it('renders bob content inside Bob card', () => {
    render(
      <ScenarioPage
        {...defaultProps}
        bobContent={<div data-testid="bob-action">Receive Button</div>}
      />,
      { wrapper },
    );
    const bobCard = screen.getByTestId('wallet-card-bob');
    expect(bobCard).toContainElement(screen.getByTestId('bob-action'));
  });

  it('renders TransactionLog with entries', () => {
    const logs: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Test entry', type: 'info' },
      { id: '2', timestamp: new Date(), message: 'Another entry', type: 'success' },
    ];
    render(<ScenarioPage {...defaultProps} logs={logs} />, { wrapper });
    expect(screen.getByTestId('transaction-log')).toHaveTextContent('2 entries');
  });

  it('renders TransactionLog with empty entries', () => {
    render(<ScenarioPage {...defaultProps} logs={[]} />, { wrapper });
    expect(screen.getByTestId('transaction-log')).toHaveTextContent('0 entries');
  });

  it('renders additional children content', () => {
    render(
      <ScenarioPage {...defaultProps}>
        <div data-testid="extra-content">Extra Section</div>
      </ScenarioPage>,
      { wrapper },
    );
    expect(screen.getByTestId('extra-content')).toBeInTheDocument();
  });

  it('renders title as h1', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Simple Payment');
  });

  it('renders without optional alice/bob content', () => {
    render(<ScenarioPage {...defaultProps} />, { wrapper });
    expect(screen.getByTestId('wallet-card-alice')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-card-bob')).toBeInTheDocument();
  });

  it('renders children between wallet cards and transaction log', () => {
    const { container } = render(
      <ScenarioPage {...defaultProps}>
        <div data-testid="middle-content">Middle</div>
      </ScenarioPage>,
      { wrapper },
    );
    // In the DOM, middle-content should appear before transaction-log
    expect(container.innerHTML.indexOf('middle-content')).toBeLessThan(
      container.innerHTML.indexOf('transaction-log'),
    );
  });
});
